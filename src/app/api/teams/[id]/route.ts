import { NextRequest, NextResponse } from 'next/server';
import { teamDB } from '@/lib/db-mongodb';

// GET /api/teams/[id] - Get team by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const team = await teamDB.getById(params.id);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(team);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

// PUT /api/teams/[id] - Update team
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updatedTeam = await teamDB.update(params.id, body);
    if (!updatedTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(updatedTeam);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Delete team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await teamDB.delete(params.id);
    if (!success) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
