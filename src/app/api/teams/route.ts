import { NextRequest, NextResponse } from 'next/server';
import { teamDB } from '@/lib/db-mongodb';
import { TeamModel } from '@/models/Team';
import { TournamentModel } from '@/models/Tournament';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import { validateOverlaySessionToken, getOverlayTokenFromRequest } from '@/lib/overlay-auth';
import { serializeTeam } from '@/lib/cloudinaryUtils';

// GET /api/teams - Get teams accessible to the authenticated user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');

    // Overlay token auth — allows OBS browser sources to read team data without JWT
    const overlayToken = getOverlayTokenFromRequest(request);
    const expectedOverlayType = searchParams.get('overlayType');
    const isOverlayAuth = overlayToken && (
      await validateOverlaySessionToken(overlayToken, expectedOverlayType, tournamentId)
    );

    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user && !isOverlayAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Overlay shortcut: return teams scoped to the given tournament
    if (!user && isOverlayAuth) {
      if (!tournamentId) {
        return NextResponse.json({ error: 'tournamentId required for overlay access' }, { status: 400 });
      }
      await connectToDatabase();
      const teams = await TeamModel.find({ tournamentId }).lean();
      return NextResponse.json(teams.map(serializeTeam));
    }

    // Check if user has permission to read teams
    if (!canPerformAction(user!.role, 'read', 'team')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If tournamentId is provided, filter by tournament
    if (tournamentId) {
      await connectToDatabase();

      // Check if user has access to this tournament
      // Admin: access to all tournaments
      // Tournament role: access to tournaments they created
      // Other roles: access to assigned tournaments
      let hasAccess = user!.role === 'Admin' || user!.assignedTournaments.includes(tournamentId);

      if (!hasAccess && user!.role === 'Tournament') {
        const tournament = await TournamentModel.findById(tournamentId).select('createdBy').lean() as { createdBy: string } | null;
        hasAccess = tournament?.createdBy === user!.userId;
      }

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to this tournament' }, { status: 403 });
      }

      const teams = await TeamModel.find({ tournamentId }).lean();
      return NextResponse.json(teams.map(serializeTeam));
    }

    // Otherwise, return teams accessible to the user
    const teams = await teamDB.getAllForUser(
      user!.userId,
      user!.role,
      []
    );
    return NextResponse.json(teams.map(serializeTeam));
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create new team directly in a tournament
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canPerformAction(user.role, 'create', 'team')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, shortCode, ownerName, logoURL, tournamentId } = body;

    if (!name || !shortCode || !ownerName || !tournamentId) {
      return NextResponse.json({ error: 'name, shortCode, ownerName, and tournamentId are required' }, { status: 400 });
    }

    // Validate tournament access
    await connectToDatabase();
    const tournament = await TournamentModel.findById(tournamentId).lean() as any;
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    const hasAccess =
      user.role === 'Admin' ||
      tournament.createdBy === user.userId ||
      user.assignedTournaments.includes(tournamentId);
    if (!hasAccess) return NextResponse.json({ error: 'Access denied to this tournament' }, { status: 403 });

    const newTeam = await teamDB.create(
      { name, shortCode, ownerName, logoURL, tournamentId },
      user.userId
    );
    return NextResponse.json(serializeTeam(newTeam as any), { status: 201 });
  } catch (error: any) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: error.message || 'Failed to create team' }, { status: 500 });
  }
}
