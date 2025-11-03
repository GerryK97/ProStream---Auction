import { NextRequest, NextResponse } from 'next/server';
import { playerDB } from '@/lib/db-mongodb';

// GET /api/players/[id] - Get player by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = await playerDB.getById(id);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
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
    const { id } = await params;
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
    const { id } = await params;
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
