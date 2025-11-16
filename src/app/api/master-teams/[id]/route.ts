import { NextRequest, NextResponse } from 'next/server';
import { masterTeamDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction, canAccessMasterTeam, canModifyResource } from '@/lib/permissions';

// GET /api/master-teams/[id] - Get master team by ID
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

    // Check if user has permission to read master teams
    if (!canPerformAction(user.role, 'read', 'masterTeam')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const team = await masterTeamDB.getById(id);
    if (!team) {
      return NextResponse.json(
        { error: 'Master team not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this master team
    if (!canAccessMasterTeam(user.userId, user.role, team)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error fetching master team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master team' },
      { status: 500 }
    );
  }
}

// PUT /api/master-teams/[id] - Update master team (propagates to all tournament instances)
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

    // Check if user has permission to update master teams
    if (!canPerformAction(user.role, 'update', 'masterTeam')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const team = await masterTeamDB.getById(id);
    if (!team) {
      return NextResponse.json(
        { error: 'Master team not found' },
        { status: 404 }
      );
    }

    // Check if user can modify this master team
    if (!canModifyResource(user.userId, user.role, team)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updatedTeam = await masterTeamDB.update(id, body);
    if (!updatedTeam) {
      return NextResponse.json(
        { error: 'Master team not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Error updating master team:', error);
    return NextResponse.json(
      { error: 'Failed to update master team' },
      { status: 500 }
    );
  }
}

// DELETE /api/master-teams/[id] - Delete master team (cascade deletes all tournament instances)
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

    // Check if user has permission to delete master teams
    if (!canPerformAction(user.role, 'delete', 'masterTeam')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const team = await masterTeamDB.getById(id);
    if (!team) {
      return NextResponse.json(
        { error: 'Master team not found' },
        { status: 404 }
      );
    }

    // Check if user can modify this master team
    if (!canModifyResource(user.userId, user.role, team)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check usage in tournaments
    const tournamentIds = await masterTeamDB.getUsageInTournaments(id);
    if (tournamentIds.length > 0) {
      console.warn(
        `Cascade deleting master team ${id} from ${tournamentIds.length} tournament(s)`
      );
    }

    const success = await masterTeamDB.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Master team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Master team deleted successfully',
      cascadeDeleted: tournamentIds.length,
    });
  } catch (error) {
    console.error('Error deleting master team:', error);
    return NextResponse.json(
      { error: 'Failed to delete master team' },
      { status: 500 }
    );
  }
}
