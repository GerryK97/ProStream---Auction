import { NextRequest, NextResponse } from 'next/server';
import { masterPlayerDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction, canAccessMasterPlayer, canModifyResource } from '@/lib/permissions';

// GET /api/master-players/[id] - Get master player by ID
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

    // Check if user has permission to read master players
    if (!canPerformAction(user.role, 'read', 'masterPlayer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const player = await masterPlayerDB.getById(id);
    if (!player) {
      return NextResponse.json(
        { error: 'Master player not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this master player
    if (!canAccessMasterPlayer(user.userId, user.role, player)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error fetching master player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master player' },
      { status: 500 }
    );
  }
}

// PUT /api/master-players/[id] - Update master player (propagates to all tournament instances)
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

    // Check if user has permission to update master players
    if (!canPerformAction(user.role, 'update', 'masterPlayer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const player = await masterPlayerDB.getById(id);
    if (!player) {
      return NextResponse.json(
        { error: 'Master player not found' },
        { status: 404 }
      );
    }

    // Check if user can modify this master player
    if (!canModifyResource(user.userId, user.role, player)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updatedPlayer = await masterPlayerDB.update(id, body);
    if (!updatedPlayer) {
      return NextResponse.json(
        { error: 'Master player not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error('Error updating master player:', error);
    return NextResponse.json(
      { error: 'Failed to update master player' },
      { status: 500 }
    );
  }
}

// DELETE /api/master-players/[id] - Delete master player (cascade deletes all tournament instances)
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

    // Check if user has permission to delete master players
    if (!canPerformAction(user.role, 'delete', 'masterPlayer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const player = await masterPlayerDB.getById(id);
    if (!player) {
      return NextResponse.json(
        { error: 'Master player not found' },
        { status: 404 }
      );
    }

    // Check if user can modify this master player
    if (!canModifyResource(user.userId, user.role, player)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check usage in tournaments
    const tournamentIds = await masterPlayerDB.getUsageInTournaments(id);
    if (tournamentIds.length > 0) {
      console.warn(
        `Cascade deleting master player ${id} from ${tournamentIds.length} tournament(s)`
      );
    }

    const success = await masterPlayerDB.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Master player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Master player deleted successfully',
      cascadeDeleted: tournamentIds.length,
    });
  } catch (error) {
    console.error('Error deleting master player:', error);
    return NextResponse.json(
      { error: 'Failed to delete master player' },
      { status: 500 }
    );
  }
}
