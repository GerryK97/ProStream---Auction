import { NextRequest, NextResponse } from 'next/server';
import { playerDB } from '@/lib/db-mongodb';
import { PlayerModel } from '@/models/Player';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// GET /api/players - Get players accessible to the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to read players
    if (!canPerformAction(user.role, 'read', 'player')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');

    // If tournamentId is provided, filter by tournament
    if (tournamentId) {
      await connectToDatabase();
      const players = await PlayerModel.find({ tournamentId }).lean();
      // Filter players the user has access to
      const userAccessiblePlayers = players.filter(player =>
        user.role === 'Admin' || player.createdBy === user.userId || player.tournamentId === tournamentId
      );
      return NextResponse.json(userAccessiblePlayers);
    }

    // Otherwise, return players accessible to the user
    const players = await playerDB.getAllForUser(
      user.userId,
      user.role,
      [] // No specific tournament filter, will return all accessible players
    );
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
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create players
    if (!canPerformAction(user.role, 'create', 'player')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const newPlayer = await playerDB.create(body, user.userId);
    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
