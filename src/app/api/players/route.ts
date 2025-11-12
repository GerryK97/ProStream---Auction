import { NextRequest, NextResponse } from 'next/server';
import { playerDB } from '@/lib/db-mongodb';
import { PlayerModel } from '@/models/Player';
import { connectToDatabase } from '@/lib/mongodb';

// GET /api/players - Get all players (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');

    // If tournamentId is provided, filter by tournament
    if (tournamentId) {
      await connectToDatabase();
      const players = await PlayerModel.find({ tournamentId }).lean();
      return NextResponse.json(players);
    }

    // Otherwise, return all players
    const players = await playerDB.getAll();
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
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
