import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { getUserFromRequest } from '@/lib/request-helpers';

// GET /api/auction/live?tournamentId=<id>
// Bootstrap endpoint for Android app — returns tournament, auctionState,
// currentPlayer, all teams, and available players in one call.
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
    }

    const [tournament, auctionState, teams, players] = await Promise.all([
      TournamentModel.findById(tournamentId).lean(),
      AuctionStateModel.findOne({ tournamentId }).lean(),
      TeamModel.find({ tournamentId }).lean(),
      PlayerModel.find({ tournamentId }).lean(),
    ]);

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const currentPlayer = auctionState?.currentPlayerId
      ? players.find((p: any) => p._id.toString() === auctionState.currentPlayerId) ?? null
      : null;

    const availablePlayers = players.filter(
      (p: any) => !p.isSold && !p.isUnsold
    );

    return NextResponse.json({
      tournament,
      auctionState,
      currentPlayer,
      teams,
      players: availablePlayers,
    });
  } catch (error) {
    console.error('Error fetching live auction state:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
