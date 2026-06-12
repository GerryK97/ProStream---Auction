import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { TournamentModel } from '@/models/Tournament';
import { PlayerModel } from '@/models/Player';
import { triggerBidPlaced } from '@/lib/pusher-server';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import { serializePlayer } from '@/lib/cloudinaryUtils';

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

    // ── Round-trip 2: fetch player + update state — both parallel
    const previousBid = auctionState.currentBid;
    const now = Date.now();
    const previousLeaderId = (auctionState as any).winningTeamId ?? null;
    const eventHistory = [
      ...(previousBid > 0 ? [{ teamId: previousLeaderId, amount: previousBid, timestamp: now - 1 }] : []),
      { teamId: teamId || null, amount, timestamp: now },
    ];

    const [player, updatedState] = await Promise.all([
      PlayerModel.findOne(
        { _id: auctionState.currentPlayerId },
        { isSold: 1, playerClass: 1, basePrice: 1, name: 1, displayName: 1 }
      ).lean(),
      AuctionStateModel.findOneAndUpdate(
        { tournamentId, currentBid: { $lt: amount } },
        {
          $set: {
            currentBid: amount,
            winningTeamId: teamId || null,
            currentAuctionStatus: 'Bidding',
            history: [],
          },
        },
        { new: true }
      ).lean(),
    ]);

    // Validate player (checked after parallel write — reject double-sold race)
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    if ((player as any).isSold) {
      return NextResponse.json({ error: 'Player is already sold' }, { status: 400 });
    }

    if (!updatedState) {
      return NextResponse.json({ error: 'Bid was superseded by a newer bid' }, { status: 409 });
    }

    // Base price check (needs player, done after fetch)
    const actualBasePrice = getClassBasePrice(tournament as any, player as any);
    if (previousBid === 0 && amount < actualBasePrice) {
      return NextResponse.json(
        { error: `The first bid must be at least the base price of ${actualBasePrice.toLocaleString()}` },
        { status: 400 }
      );
    }

    const eventAuctionState = {
      ...(updatedState as any),
      history: eventHistory,
    };

    // ── Await Pusher for bids — overlay must receive this in real time ──
    // Web operator already does optimistic UI locally, so the small Pusher
    // round-trip is acceptable and prevents serverless/local requests from
    // finishing before the event is actually delivered.
    await triggerBidPlaced(tournamentId, {
      auctionState: eventAuctionState as any,
      currentPlayer: serializePlayer(player as any) as any,
      // Teams are already loaded in clients; auctionState.winningTeamId and
      // history[-1].teamId identify the leader. Avoid a team DB read + payload.
      winningTeam: null,
      currentBid: amount,
      previousBid,
      message: `New bid placed: ${amount.toLocaleString()}`,
    });

    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('Error placing bid:', error);
    return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 });
  }
}
