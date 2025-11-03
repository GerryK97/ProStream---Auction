import { NextRequest, NextResponse } from 'next/server';
import { playerDB } from '@/lib/db-mongodb';

// GET /api/players - Get all players
export async function GET() {
  try {
    const players = await playerDB.getAll();
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

// POST /api/players - Create new player
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newPlayer = await playerDB.create(body);
    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
