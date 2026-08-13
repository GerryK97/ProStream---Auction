import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { triggerBidPlaced } from '@/lib/pusher-server';
import { serializePlayer } from '@/lib/cloudinaryUtils';
import { authorizeAuctionMutation } from '@/lib/auctionAuthorization';
import { getTeamAuctionCapacity } from '@/lib/auctionRules';

// POST /api/auction/bid/correct
// Corrects the current bid to any positive amount — bypasses the "must be higher" rule.
// Used by bid handlers to undo accidental over-bids during a live auction.
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { tournamentId, amount, teamId } = await request.json();

    if (!tournamentId || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing or invalid fields: tournamentId, amount (must be > 0)' },
        { status: 400 }
      );
    }

    const access = await authorizeAuctionMutation(request, tournamentId);
    if (!access.authorized) return access.response;
    const tournament = access.tournament;

    const auctionState = await AuctionStateModel.findOne({ tournamentId });
    if (!auctionState) {
      return NextResponse.json(
        { error: 'Auction state not found for this tournament' },
        { status: 404 }
      );
    }

    if (tournament.status !== 'Live') {
      return NextResponse.json({ error: 'Auction is not live' }, { status: 400 });
    }

    if (!auctionState.currentPlayerId) {
      return NextResponse.json(
        { error: 'No player is currently up for auction' },
        { status: 400 }
      );
    }

    const normalizedTeamId = typeof teamId === 'string' && teamId.trim() ? teamId : null;
    if (tournament.biddingMode === 'team' && !normalizedTeamId) {
      return NextResponse.json({ error: 'A team is required for team bidding' }, { status: 400 });
    }

    const [player, team, playersBought] = await Promise.all([
      PlayerModel.findOne({ _id: auctionState.currentPlayerId, tournamentId }).lean(),
      normalizedTeamId
        ? TeamModel.findOne({ _id: normalizedTeamId, tournamentId }).lean()
        : Promise.resolve(null),
      normalizedTeamId
        ? PlayerModel.countDocuments({ tournamentId, isSold: true, winningTeamId: normalizedTeamId })
        : Promise.resolve(0),
    ]);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    if ((player as any).isSold) {
      return NextResponse.json({ error: 'Player is already sold' }, { status: 400 });
    }

    if (normalizedTeamId) {
      if (!team) {
        return NextResponse.json({ error: 'Team not found in this tournament' }, { status: 404 });
      }
      const capacity = getTeamAuctionCapacity(team as any, tournament as any, playersBought);
      if (capacity.isSquadFull || amount > capacity.maxBid) {
        return NextResponse.json(
          { error: capacity.isSquadFull ? 'This team already has a full squad' : 'Corrected bid exceeds the team maximum' },
          { status: 400 },
        );
      }
    }

    const previousBid = auctionState.currentBid;
    const now = Date.now();
    const previousLeaderId = (auctionState as any).winningTeamId ?? null;
    const eventHistory = [
      ...(previousBid > 0 ? [{ teamId: previousLeaderId, amount: previousBid, timestamp: now - 1 }] : []),
      { teamId: normalizedTeamId, amount, timestamp: now },
    ];

    const updatedState = await AuctionStateModel.findOneAndUpdate(
      {
        tournamentId,
        currentPlayerId: String(auctionState.currentPlayerId),
        currentBid: previousBid,
        currentAuctionStatus: { $ne: 'Sold' },
      },
      {
        $set: {
          currentBid: amount,
          winningTeamId: normalizedTeamId,
          currentAuctionStatus: 'Bidding',
          history: [],
        },
      },
      { returnDocument: 'after' }
    ).lean();

    if (!updatedState) {
      return NextResponse.json(
        { error: 'Auction state changed before the correction was applied' },
        { status: 409 },
      );
    }

    const eventAuctionState = {
      ...(updatedState as any),
      history: eventHistory,
    };

    triggerBidPlaced(tournamentId, {
      auctionState: eventAuctionState as any,
      currentPlayer: serializePlayer(player as any) as any,
      winningTeam: null,
      currentBid: amount,
      previousBid,
      message: `Bid corrected to: ${amount.toLocaleString()}`,
    }).catch((err) => console.error('[bid/correct] Pusher trigger failed:', err));

    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('Error correcting bid:', error);
    return NextResponse.json({ error: 'Failed to correct bid' }, { status: 500 });
  }
}
