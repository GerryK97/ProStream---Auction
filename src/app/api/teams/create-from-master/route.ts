import { NextRequest, NextResponse } from 'next/server';
import { teamDB } from '@/lib/db-mongodb';

// POST /api/teams/create-from-master - Create tournament team from master team
export async function POST(request: NextRequest) {
  try {
    const { masterTeamId, tournamentId } = await request.json();

    if (!masterTeamId || !tournamentId) {
      return NextResponse.json(
        { error: 'masterTeamId and tournamentId are required' },
        { status: 400 }
      );
    }

    const newTeam = await teamDB.createFromMaster(masterTeamId, tournamentId);
    return NextResponse.json(newTeam, { status: 201 });
  } catch (error: any) {
    console.error('Error creating team from master:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create team from master' },
      { status: 400 }
    );
  }
}
