import { NextRequest, NextResponse } from 'next/server';
import { teamDB } from '@/lib/db-mongodb';
import { TeamModel } from '@/models/Team';
import { connectToDatabase } from '@/lib/mongodb';

// GET /api/teams - Get all teams (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');

    // If tournamentId is provided, filter by tournament
    if (tournamentId) {
      await connectToDatabase();
      const teams = await TeamModel.find({ tournamentId }).lean();
      return NextResponse.json(teams);
    }

    // Otherwise, return all teams
    const teams = await teamDB.getAll();
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
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
