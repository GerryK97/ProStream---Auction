import { NextRequest, NextResponse } from 'next/server';
import { playerDB } from '@/lib/db-mongodb';
import { PlayerModel } from '@/models/Player';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// GET /api/players - Get players accessible to the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to read players
    if (!canPerformAction(user.role, 'read', 'player')) {
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

      const players = await PlayerModel.find({ tournamentId }).lean();
      return NextResponse.json(players);
    }

    // Otherwise, return players accessible to the user
    const players = await playerDB.getAllForUser(
      user.userId,
      user.role,
      user.assignedTournaments // Pass user's assigned tournaments
    );
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

// POST /api/players - Create new player
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create players
    if (!canPerformAction(user.role, 'create', 'player')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const newPlayer = await playerDB.create(body, user.userId);
    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
