import { NextRequest, NextResponse } from 'next/server';
import { masterTeamDB } from '@/lib/db-mongodb';

// GET /api/master-teams/[id] - Get master team by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const team = await masterTeamDB.getById(id);
    if (!team) {
      return NextResponse.json(
        { error: 'Master team not found' },
        { status: 404 }
      );
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
    const { id } = await params;
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
    const { id } = await params;

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
