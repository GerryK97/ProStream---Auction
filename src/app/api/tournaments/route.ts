import { NextRequest, NextResponse } from 'next/server';
import { tournamentDB } from '@/lib/db-mongodb';
import { verifyAuth } from '@/lib/api-auth';
import { getAccessibleTournamentIds } from '@/lib/authorization';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

// GET /api/tournaments - Get all tournaments (filtered by user access)
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth.authenticated) {
      return auth.error;
    }

    const user = auth.user!;
    const tournaments = await tournamentDB.getAll();

    // Filter tournaments based on user access
    let accessibleTournaments = tournaments;

    if (user.role !== 'admin') {
      // Non-admin users can only see tournaments they're assigned to
      accessibleTournaments = tournaments.filter((t) =>
        user.assignedTournaments.includes(t._id)
      );
    }

    return NextResponse.json(accessibleTournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

// POST /api/tournaments - Create new tournament
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth.authenticated) {
      return auth.error;
    }

    const user = auth.user!;
    const body = await request.json();

    // Add createdBy field with current user's ID
    const tournamentData = {
      ...body,
      createdBy: user.id,
    };

    const newTournament = await tournamentDB.create(tournamentData);

    // Auto-assign creator to the tournament
    await connectToDatabase();
    await UserModel.findByIdAndUpdate(
      user.id,
      {
        $addToSet: { assignedTournaments: newTournament._id },
      },
      { new: true }
    );

    return NextResponse.json(newTournament, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}
