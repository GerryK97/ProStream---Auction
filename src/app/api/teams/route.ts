import { NextRequest, NextResponse } from 'next/server';
import { teamDB } from '@/lib/db-mongodb';
import { TeamModel } from '@/models/Team';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// GET /api/teams - Get teams accessible to the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to read teams
    if (!canPerformAction(user.role, 'read', 'team')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');

    // If tournamentId is provided, filter by tournament
    if (tournamentId) {
      await connectToDatabase();

      // Check if user has access to this tournament
      // Admin: access to all tournaments
      // Tournament role: access to tournaments they created
      // Other roles: access to assigned tournaments
      let hasAccess = user.role === 'Admin' || user.assignedTournaments.includes(tournamentId);

      // Also check if user created this tournament (for Tournament role)
      if (!hasAccess && user.role === 'Tournament') {
        const { TournamentModel } = await import('@/models/Tournament');
        const tournament = await TournamentModel.findById(tournamentId).select('createdBy').lean() as { createdBy: string } | null;
        hasAccess = tournament?.createdBy === user.userId;
      }

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to this tournament' }, { status: 403 });
      }

      const teams = await TeamModel.find({ tournamentId }).lean();
      return NextResponse.json(teams);
    }

    // Otherwise, return teams accessible to the user
    const teams = await teamDB.getAllForUser(
      user.userId,
      user.role,
      [] // No specific tournament filter, will return all accessible teams
    );
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create new team
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create teams
    if (!canPerformAction(user.role, 'create', 'team')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const newTeam = await teamDB.create(body, user.userId);
    return NextResponse.json(newTeam, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
