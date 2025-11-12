import { NextRequest, NextResponse } from 'next/server';
import { masterPlayerDB } from '@/lib/db-mongodb';

// GET /api/master-players - Get all master players
export async function GET() {
  try {
    const players = await masterPlayerDB.getAll();
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching master players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master players' },
      { status: 500 }
    );
  }
}

// POST /api/master-players - Create new master player
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newPlayer = await masterPlayerDB.create(body);
    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating master player:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create master player' },
      { status: 400 }
    );
  }
}
