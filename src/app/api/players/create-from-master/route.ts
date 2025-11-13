import { NextRequest, NextResponse } from 'next/server';
import { playerDB } from '@/lib/db-mongodb';

// POST /api/players/create-from-master - Create tournament player from master player
export async function POST(request: NextRequest) {
  try {
    const { masterPlayerId, tournamentId, playerClass } = await request.json();

    if (!masterPlayerId || !tournamentId) {
      return NextResponse.json(
        { error: 'masterPlayerId and tournamentId are required' },
        { status: 400 }
      );
    }

    const newPlayer = await playerDB.createFromMaster(masterPlayerId, tournamentId, playerClass);
    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating player from master:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create player from master' },
      { status: 400 }
    );
  }
}
