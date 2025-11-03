import { NextRequest, NextResponse } from 'next/server';
import { tournamentDB } from '@/lib/db-mongodb';

// GET /api/tournaments - Get all tournaments
export async function GET() {
  try {
    const tournaments = await tournamentDB.getAll();
    return NextResponse.json(tournaments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

// POST /api/tournaments - Create new tournament
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newTournament = await tournamentDB.create(body);
    return NextResponse.json(newTournament, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}
