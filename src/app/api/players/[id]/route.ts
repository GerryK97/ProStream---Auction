import { NextRequest, NextResponse } from 'next/server';
import { playerDB, tournamentDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction, canAccessPlayer, canModifyResource } from '@/lib/permissions';

// GET /api/players/[id] - Get player by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const player = await playerDB.getById(id);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this player
    let canAccessPlayerFlag = false;
    if (player.tournamentId) {
      const tournament = await tournamentDB.getById(player.tournamentId);
      if (tournament) {
        const canAccessTournamentFlag = user.role === 'Admin' ||
          player.createdBy === user.userId ||
          user.assignedTournaments.includes(player.tournamentId);
        canAccessPlayerFlag = canAccessPlayer(
          user.userId,
          user.role,
          { _id: player._id, tournamentId: player.tournamentId, createdBy: player.createdBy },
          canAccessTournamentFlag
        );
      }
    } else {
      canAccessPlayerFlag = user.role === 'Admin' || player.createdBy === user.userId;
    }

    if (!canAccessPlayerFlag) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(player);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}

// PUT /api/players/[id] - Update player
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update players
    if (!canPerformAction(user.role, 'update', 'player')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const player = await playerDB.getById(id);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this player's tournament (mirrors GET logic)
    const tournament = player.tournamentId ? await tournamentDB.getById(player.tournamentId) : null;
    const hasTournamentAccess =
      user.role === 'Admin' ||
      (tournament && (tournament.createdBy === user.userId || user.assignedTournaments.includes(player.tournamentId!)));
    if (!hasTournamentAccess && player.createdBy !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updatedPlayer = await playerDB.update(id, body);
    if (!updatedPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(updatedPlayer);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

// DELETE /api/players/[id] - Delete player
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete players
    if (!canPerformAction(user.role, 'delete', 'player')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const player = await playerDB.getById(id);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Check if user can modify this player
    if (!canModifyResource(user.userId, user.role, player)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await playerDB.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'Player deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}
