import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { AuctionStateModel } from '@/models/AuctionState';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { getUserFromRequest } from '@/lib/request-helpers';

// GET /api/auction/live?tournamentId=xxx
// Returns full live auction bootstrap data for the mobile app.
export async function GET(request: NextRequest) {
  try {
    const tournamentId = request.nextUrl.searchParams.get('tournamentId');
    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const tournament = await TournamentModel.findById(tournamentId).lean();
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Ensure or create auction state
    let auctionState = await AuctionStateModel.findOne({ tournamentId }).lean();
    if (!auctionState) {
      auctionState = await AuctionStateModel.create({
        tournamentId,
        currentPlayerId: null,
        currentBid: 0,
        winningTeamId: null,
        currentAuctionStatus: 'Pending',
        history: [],
      });
    }

    const [teams, totalPlayers, soldPlayers] = await Promise.all([
      TeamModel.find({ tournamentId }).lean(),
      PlayerModel.countDocuments({ tournamentId }),
      PlayerModel.countDocuments({ tournamentId, isSold: true }),
    ]);

    const currentPlayer = (auctionState as any).currentPlayerId
      ? await PlayerModel.findById((auctionState as any).currentPlayerId).lean()
      : null;

    const auctionProgress = totalPlayers > 0
      ? Math.round((soldPlayers / totalPlayers) * 100)
      : 0;

    return NextResponse.json({
      tournament: { ...(tournament as any), auctionProgress },
      auctionState,
      currentPlayer: currentPlayer ?? null,
      teams,
    });
  } catch (error) {
    console.error('Error fetching live auction data:', error);
    return NextResponse.json({ error: 'Failed to fetch auction data' }, { status: 500 });
  }
}
