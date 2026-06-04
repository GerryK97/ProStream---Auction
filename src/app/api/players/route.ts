import { NextRequest, NextResponse } from 'next/server';
import { playerDB } from '@/lib/db-mongodb';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { TournamentModel } from '@/models/Tournament';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import { validateOverlaySessionToken, getOverlayTokenFromRequest } from '@/lib/overlay-auth';
import { serializePlayer } from '@/lib/cloudinaryUtils';

// GET /api/players - Get players accessible to the authenticated user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');

    // Overlay token auth — allows OBS browser sources to read player data without JWT
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

    // Overlay shortcut: return players scoped to the given tournament
    if (!user && isOverlayAuth) {
      if (!tournamentId) {
        return NextResponse.json({ error: 'tournamentId required for overlay access' }, { status: 400 });
      }
      await connectToDatabase();
      const players = await PlayerModel.find({ tournamentId }).lean();
      return NextResponse.json(players.map(serializePlayer));
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
      let hasAccess = user!.role === 'Admin' || user!.assignedTournaments.includes(tournamentId);

      if (!hasAccess && user!.role === 'Tournament') {
        const tournament = await TournamentModel.findById(tournamentId).select('createdBy').lean() as { createdBy: string } | null;
        hasAccess = tournament?.createdBy === user!.userId;
      }

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to this tournament' }, { status: 403 });
      }

      const players = await PlayerModel.find({ tournamentId }).lean();
      return NextResponse.json(players.map(serializePlayer));
    }

    // Otherwise, return players accessible to the user
    const players = await playerDB.getAllForUser(
      user!.userId,
      user!.role,
      user!.assignedTournaments
    );
    return NextResponse.json(players.map(serializePlayer));
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
    const { playerNo, name, position, currentClub, photoURL, secondaryImageURL, playerClass, age, battingStyle, bowlingStyle, stats, tournamentId, isIconic, winningTeamId } = body;

    if (!name || !tournamentId) {
      return NextResponse.json({ error: 'name and tournamentId are required' }, { status: 400 });
    }

    if (isIconic && !winningTeamId) {
      return NextResponse.json({ error: 'winningTeamId is required when creating an iconic player' }, { status: 400 });
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

    const newPlayerData: any = {
      ...(playerNo ? { playerNo } : {}),
      name,
      position,
      currentClub,
      photoURL,
      secondaryImageURL,
      playerClass,
      age: age !== undefined ? Number(age) : undefined,
      ...(battingStyle ? { battingStyle } : {}),
      ...(bowlingStyle ? { bowlingStyle } : {}),
      ...(stats ? { stats } : {}),
      tournamentId
    };

    if (isIconic) {
      newPlayerData.isIconic = true;
      newPlayerData.isSold = true;
      newPlayerData.isUnsold = false;
      newPlayerData.finalPrice = 0;
      newPlayerData.winningTeamId = winningTeamId;
    }

    const newPlayer = await playerDB.create(newPlayerData, user.userId);

    // Add iconic player to team's squad roster (no budget deduction — finalPrice is 0)
    if (isIconic && winningTeamId && newPlayer._id) {
      await TeamModel.findByIdAndUpdate(winningTeamId, {
        $addToSet: { playersPurchased: String(newPlayer._id) },
      });
    }

    return NextResponse.json(serializePlayer(newPlayer as any), { status: 201 });
  } catch (error: any) {
    console.error('Error creating player:', error);
    return NextResponse.json({ error: error.message || 'Failed to create player' }, { status: 500 });
  }
}
