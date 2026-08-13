import { after, NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { TournamentModel } from '@/models/Tournament';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { triggerBidPlaced } from '@/lib/pusher-server';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import {
  authenticateAuctionManager,
  authorizeAuctionTournament,
} from '@/lib/auctionAuthorization';
import { getTeamAuctionCapacity } from '@/lib/auctionRules';
import { serializePlayer } from '@/lib/cloudinaryUtils';

// POST /api/auction/bid - Place a bid for the current player
export async function POST(request: NextRequest) {
  try {
    const { tournamentId, teamId: rawTeamId, amount } = await request.json();
    const teamId = typeof rawTeamId === 'string' && rawTeamId.trim() ? rawTeamId : null;

    if (!tournamentId || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing or invalid fields: tournamentId, amount' },
        { status: 400 },
      );
    }

    // MongoDB and a cold auth-cache lookup are independent. Start them together
    // so a serverless cold invocation pays the slower operation once instead of
    // waiting for two sequential network handshakes.
    const [, authentication] = await Promise.all([
      connectToDatabase(),
      authenticateAuctionManager(request),
    ]);
    if (!authentication.authorized) return authentication.response;

    // Keep the bid hot path to one parallel Mongo round-trip after cached auth.
    const [auctionState, rawTournament] = await Promise.all([
      AuctionStateModel.findOne({ tournamentId }),
      TournamentModel.findById(tournamentId).lean(),
    ]);
    const access = authorizeAuctionTournament(
      authentication.user,
      rawTournament as Record<string, any> | null,
    );
    if (!access.authorized) return access.response;
    const tournament = access.tournament;

    if (tournament.status !== 'Live') {
      return NextResponse.json({ error: 'Auction is not live' }, { status: 400 });
    }
    if (tournament.biddingMode === 'team' && !teamId) {
      return NextResponse.json({ error: 'A team is required for team bidding' }, { status: 400 });
    }

    if (!auctionState) {
      return NextResponse.json({ error: 'Auction state not found for this tournament' }, { status: 404 });
    }
    if (!auctionState.currentPlayerId) {
      return NextResponse.json({ error: 'No player is currently up for auction' }, { status: 400 });
    }
    if (auctionState.currentAuctionStatus === 'Sold') {
      return NextResponse.json({ error: 'The current player has already been sold' }, { status: 409 });
    }
    if (amount <= auctionState.currentBid) {
      return NextResponse.json({ error: 'Bid must be higher than the current bid' }, { status: 400 });
    }

    // Validate every entity and affordability rule before mutating auction state.
    // This prevents invalid opening bids and full-squad bids from becoming authoritative.
    const [player, team, playersBought] = await Promise.all([
      PlayerModel.findOne(
        { _id: auctionState.currentPlayerId, tournamentId },
        { isSold: 1, playerClass: 1, basePrice: 1, name: 1, displayName: 1 },
      ).lean(),
      teamId ? TeamModel.findOne({ _id: teamId, tournamentId }).lean() : Promise.resolve(null),
      teamId
        ? PlayerModel.countDocuments({ tournamentId, isSold: true, winningTeamId: teamId })
        : Promise.resolve(0),
    ]);

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    if ((player as any).isSold) {
      return NextResponse.json({ error: 'Player is already sold' }, { status: 400 });
    }

    const actualBasePrice = getClassBasePrice(tournament as any, player as any);
    if (auctionState.currentBid === 0 && amount < actualBasePrice) {
      return NextResponse.json(
        { error: `The first bid must be at least the base price of ${actualBasePrice.toLocaleString()}` },
        { status: 400 },
      );
    }

    if (teamId) {
      if (!team) {
        return NextResponse.json({ error: 'Team not found in this tournament' }, { status: 404 });
      }

      const capacity = getTeamAuctionCapacity(team as any, tournament as any, playersBought);
      if (capacity.isSquadFull) {
        return NextResponse.json({ error: 'This team already has a full squad' }, { status: 400 });
      }
      if (amount > capacity.maxBid) {
        return NextResponse.json(
          {
            error: `Bid exceeds ${(team as any).name}'s maximum affordable bid of ${capacity.maxBid.toLocaleString()}`,
          },
          { status: 400 },
        );
      }
    }

    const previousBid = auctionState.currentBid;
    const previousLeaderId = (auctionState as any).winningTeamId ?? null;
    const currentPlayerId = String(auctionState.currentPlayerId);
    const now = Date.now();
    const eventHistory = [
      ...(previousBid > 0 ? [{ teamId: previousLeaderId, amount: previousBid, timestamp: now - 1 }] : []),
      { teamId, amount, timestamp: now },
    ];

    // Compare-and-swap on both player and bid. A player selection or competing bid
    // that lands after validation cannot accidentally receive this stale bid.
    const updatedState = await AuctionStateModel.findOneAndUpdate(
      {
        tournamentId,
        currentPlayerId,
        currentBid: previousBid,
        currentAuctionStatus: { $ne: 'Sold' },
      },
      {
        $set: {
          currentBid: amount,
          winningTeamId: teamId,
          currentAuctionStatus: 'Bidding',
          history: [],
        },
        $inc: { revision: 1 },
      },
      { returnDocument: 'after' },
    ).lean();

    if (!updatedState) {
      return NextResponse.json(
        { error: 'Auction state changed before this bid was applied. Refresh and try again.' },
        { status: 409 },
      );
    }

    const eventAuctionState = {
      ...(updatedState as any),
      history: eventHistory,
    };

    // Fire-and-forget Pusher for bids. The operator panel already applies an
    // optimistic local update, and overlays receive the WebSocket event as soon
    // as Pusher accepts it. Do not block the bid HTTP response on Pusher REST RTT.
    const pusherDelivery = triggerBidPlaced(tournamentId, {
      auctionState: eventAuctionState as any,
      currentPlayer: serializePlayer(player as any) as any,
      winningTeam: null,
      currentBid: amount,
      previousBid,
      message: `New bid placed: ${amount.toLocaleString()}`,
    }).catch((err) => console.error('[bid] Pusher trigger failed:', err));
    // Start publishing immediately, but register the in-flight promise with
    // Next's request lifecycle so Vercel does not freeze the function before
    // Pusher acknowledges delivery after the HTTP response has been returned.
    after(() => pusherDelivery);

    return NextResponse.json(eventAuctionState);
  } catch (error) {
    console.error('Error placing bid:', error);
    return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 });
  }
}
