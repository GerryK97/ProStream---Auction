import { NextRequest, NextResponse } from 'next/server';
import { playerDB } from '@/lib/db-mongodb';
import { PlayerModel } from '@/models/Player';
import { TournamentModel } from '@/models/Tournament';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import { validateOverlayToken, getOverlayTokenFromRequest } from '@/lib/overlay-auth';

// GET /api/players - Get players accessible to the authenticated user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');

    // Overlay token auth — allows OBS browser sources to read player data without JWT
    const overlayToken = getOverlayTokenFromRequest(request);
    const isOverlayAuth = overlayToken && validateOverlayToken(overlayToken);

    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user && !isOverlayAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Overlay shortcut: return players scoped to the given tournament
    if (!user && isOverlayAuth) {
      if (!tournamentId) {
        return NextResponse.json({ error: 'tournamentId required for overlay access' }, { status: 400 });
      }
      await connectToDatabase();
      const players = await PlayerModel.find({ tournamentId }).lean();
      return NextResponse.json(players);
    }

    // Check if user has permission to read players
    if (!canPerformAction(user!.role, 'read', 'player')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If tournamentId is provided, filter by tournament
    if (tournamentId) {
      await connectToDatabase();

      // Check if user has access to this tournament
      // Admin: access to all tournaments
      // Tournament role: access to tournaments they created
      // Other roles: access to assigned tournaments
      let hasAccess = user.role === 'Admin' || user.assignedTournaments.includes(tournamentId);

      if (!hasAccess && user.role === 'Tournament') {
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

// POST /api/players - Create new player directly in a tournament
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canPerformAction(user.role, 'create', 'player')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, position, currentClub, photoURL, playerClass, tournamentId } = body;

    if (!name || !tournamentId) {
      return NextResponse.json({ error: 'name and tournamentId are required' }, { status: 400 });
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

    const newPlayer = await playerDB.create(
      { name, position, currentClub, photoURL, playerClass, tournamentId },
      user.userId
    );
    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating player:', error);
    return NextResponse.json({ error: error.message || 'Failed to create player' }, { status: 500 });
  }
}
