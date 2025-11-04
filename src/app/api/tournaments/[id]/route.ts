import { NextRequest, NextResponse } from 'next/server';
import { tournamentDB } from '@/lib/db-mongodb';

// GET /api/tournaments/[id] - Get tournament by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournament = await tournamentDB.getById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(tournament);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}

// PUT /api/tournaments/[id] - Update tournament
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedTournament = await tournamentDB.update(id, body);
    if (!updatedTournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(updatedTournament);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/[id] - Delete tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await tournamentDB.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 }
    );
  }
}
