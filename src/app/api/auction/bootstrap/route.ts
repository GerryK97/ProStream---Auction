import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { getUserFromRequest } from '@/lib/request-helpers';

/**
 * GET /api/auction/bootstrap?tournamentId=xxx[&token=xxx]
 *
 * Returns tournament + auctionState + players + teams in a single request,
 * requiring only one Neon PG auth call instead of four. Used by usePusherAuction
 * for initial load and reconnect refreshes. Replaces the four-parallel-fetch pattern
 * that still incurred 4× Neon PG round-trips even though requests ran in parallel.
 *
 * Latency saved: ~150–600 ms per initial load / visibility-change refresh.
 */
export async function GET(request: NextRequest) {
  try {
    const tournamentId = request.nextUrl.searchParams.get('tournamentId');
    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
    }

    // Single Neon PG round-trip for auth (cached by request-helpers in-process LRU)
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // All four data sources fetched in a single parallel round — one Neon PG auth total
    const [tournament, auctionState, players, teams] = await Promise.all([
      TournamentModel.findById(tournamentId).lean(),
      AuctionStateModel.findOneAndUpdate(
        { tournamentId },
        {
          $setOnInsert: {
            tournamentId,
            currentPlayerId: null,
            currentBid: 0,
            winningTeamId: null,
            currentAuctionStatus: 'Pending',
            history: [],
          },
        },
        { upsert: true, new: true }
      ).lean(),
      PlayerModel.find({ tournamentId }).lean(),
      TeamModel.find({ tournamentId }).lean(),
    ]);

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return NextResponse.json({ tournament, auctionState, players, teams });
  } catch (error) {
    console.error('[bootstrap] Error:', error);
    return NextResponse.json({ error: 'Failed to load bootstrap data' }, { status: 500 });
  }
}
