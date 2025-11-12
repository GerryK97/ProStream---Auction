import { NextRequest, NextResponse } from 'next/server';
import { masterTeamDB } from '@/lib/db-mongodb';

// GET /api/master-teams - Get all master teams
export async function GET() {
  try {
    const teams = await masterTeamDB.getAll();
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching master teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master teams' },
      { status: 500 }
    );
  }
}

// POST /api/master-teams - Create new master team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newTeam = await masterTeamDB.create(body);
    return NextResponse.json(newTeam, { status: 201 });
  } catch (error: any) {
    console.error('Error creating master team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create master team' },
      { status: 400 }
    );
  }
}
