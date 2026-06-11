import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { triggerBidPlaced } from '@/lib/pusher-server';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// POST /api/auction/bid - Place a bid for the current player
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canPerformAction(user.role, 'manage', 'auction')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tournamentId, teamId: bodyTeamId, amount } = await request.json();
    const teamId = bodyTeamId;

    if (!tournamentId || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: tournamentId, amount' },
        { status: 400 }
      );
    }

    // ── Round-trip 1: fetch auction state + tournament in parallel ────────
    const [auctionState, tournament] = await Promise.all([
      AuctionStateModel.findOne({ tournamentId }),
      TournamentModel.findOne(
        { _id: tournamentId },
        { status: 1, playerBasePrice: 1, classPrices: 1, baseStrategy: 1 }
      ).lean(),
    ]);

    if (!auctionState) {
      return NextResponse.json({ error: 'Auction state not found for this tournament' }, { status: 404 });
    }
    if (!tournament || (tournament as any).status !== 'Live') {
      return NextResponse.json({ error: 'Auction is not live' }, { status: 400 });
    }
    if (!auctionState.currentPlayerId) {
      return NextResponse.json({ error: 'No player is currently up for auction' }, { status: 400 });
    }

    // ── Bid amount validation (cheap, no DB) ─────────────────────────────
    if (amount <= auctionState.currentBid) {
      return NextResponse.json({ error: 'Bid must be higher than the current bid' }, { status: 400 });
    }

    // ── Round-trip 2: fetch player + update state + lookup team — all parallel
    const previousBid = auctionState.currentBid;
    const newBid = { teamId: teamId || null, amount, timestamp: Date.now() };

    const [player, updatedState, winningTeam] = await Promise.all([
      PlayerModel.findOne(
        { _id: auctionState.currentPlayerId },
        { isSold: 1, playerClass: 1, basePrice: 1, name: 1, displayName: 1 }
      ).lean(),
      AuctionStateModel.findOneAndUpdate(
        { tournamentId },
        { $set: { currentBid: amount, currentAuctionStatus: 'Bidding' }, $push: { history: newBid } },
        { new: true }
      ).lean(),
      // Fetch full team document so BID_PLACED event carries currentBalance,
      // playersPurchased etc. — partial projection was stripping those fields
      // and causing "Can't Bid" / balance-0 on all teams after the first bid.
      teamId ? TeamModel.findById(teamId).lean() : Promise.resolve(null),
    ]);

    // Validate player (checked after parallel write — reject double-sold race)
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    if ((player as any).isSold) {
      return NextResponse.json({ error: 'Player is already sold' }, { status: 400 });
    }

    // Base price check (needs player, done after fetch)
    const actualBasePrice = getClassBasePrice(tournament as any, player as any);
    if (previousBid === 0 && amount < actualBasePrice) {
      return NextResponse.json(
        { error: `The first bid must be at least the base price of ${actualBasePrice.toLocaleString()}` },
        { status: 400 }
      );
    }

    // ── Fire Pusher without awaiting — overlay gets event asynchronously ──
    // The HTTP response returns to the app IMMEDIATELY.
    triggerBidPlaced(tournamentId, {
      auctionState: updatedState as any,
      currentPlayer: player as any,
      winningTeam: winningTeam as any,
      currentBid: amount,
      previousBid,
      message: `New bid placed: ${amount.toLocaleString()}`,
    }).catch((err) => console.error('[bid] Pusher trigger failed:', err));

    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('Error placing bid:', error);
    return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 });
  }
}
