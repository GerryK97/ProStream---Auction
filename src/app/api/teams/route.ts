import { NextRequest, NextResponse } from 'next/server';
import { teamDB } from '@/lib/db-mongodb';

// GET /api/teams - Get all teams
export async function GET() {
  try {
    const teams = await teamDB.getAll();
    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create new team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newTeam = await teamDB.create(body);
    return NextResponse.json(newTeam, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
