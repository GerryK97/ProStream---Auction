import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { triggerBidPlaced } from '@/lib/pusher-server';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import { getNextTeamBid } from '@/lib/bidIncrementUtils';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// POST /api/auction/bid - Place a bid for the current player
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Authenticate request
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow Team role to bid; all other roles require auction manage permission
    if (user.role !== 'Team' && !canPerformAction(user.role, 'manage', 'auction')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tournamentId, teamId: bodyTeamId, amount } = await request.json();

    // Team-role users always bid as their assigned team (prevents spoofing)
    const teamId = user.role === 'Team' ? user.assignedTeams[0] : bodyTeamId;

    if (!tournamentId || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: tournamentId, amount' },
        { status: 400 }
      );
    }

    // Get auction state
    const auctionState = await AuctionStateModel.findOne({ tournamentId });
    if (!auctionState) {
      return NextResponse.json(
        { error: 'Auction state not found for this tournament' },
        { status: 404 }
      );
    }

    // Validate tournament is live
    const tournament = await TournamentModel.findOne({ _id: tournamentId }).lean();
    if (!tournament || (tournament as any).status !== 'Live') {
      return NextResponse.json(
        { error: 'Auction is not live' },
        { status: 400 }
      );
    }

    // Validate player
    if (!auctionState.currentPlayerId) {
      return NextResponse.json(
        { error: 'No player is currently up for auction' },
        { status: 400 }
      );
    }

    const player = await PlayerModel.findOne({ _id: auctionState.currentPlayerId }).lean();
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    if ((player as any).isSold) {
      return NextResponse.json(
        { error: 'Player is already sold' },
        { status: 400 }
      );
    }

    // Validate bid amount
    if (amount <= auctionState.currentBid) {
      return NextResponse.json(
        { error: 'Bid must be higher than the current bid' },
        { status: 400 }
      );
    }

    // Get the actual base price based on tournament strategy
    const actualBasePrice = getClassBasePrice(tournament as any, player as any);

    if (auctionState.currentBid === 0 && amount < actualBasePrice) {
      return NextResponse.json(
        { error: `The first bid must be at least the base price of ${actualBasePrice.toLocaleString()}` },
        { status: 400 }
      );
    }

    // In team bidding mode, validate that the submitted amount equals the next preset bid
    // (Team-role users only — admins/Tournament roles can set custom amounts)
    if ((tournament as any).biddingMode === 'team' && user.role === 'Team') {
      const bidIncrements = (tournament as any).bidIncrements ?? [];
      const expectedBid = getNextTeamBid(bidIncrements, auctionState.currentBid, actualBasePrice);
      if (amount !== expectedBid) {
        return NextResponse.json(
          { error: `Invalid bid amount for team bidding mode. Expected: ${expectedBid.toLocaleString()}` },
          { status: 400 }
        );
      }
    }

    // Update auction state (team will be assigned when selling)
    const newBid = {
      teamId: teamId || null,
      amount,
      timestamp: Date.now(),
    };

    const previousBid = auctionState.currentBid;

    const updatedState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      {
        $set: {
          currentBid: amount,
          currentAuctionStatus: 'Bidding',
        },
        $push: { history: newBid },
      },
      { new: true }
    ).lean();

    // Get winning team if teamId provided
    let winningTeam = null;
    if (teamId) {
      winningTeam = await TeamModel.findById(teamId).lean();
    }

    // Trigger Pusher event
    try {
      await triggerBidPlaced(tournamentId, {
        auctionState: updatedState as any,
        currentPlayer: player as any,
        winningTeam: winningTeam as any,
        currentBid: amount,
        previousBid,
        message: `New bid placed: ${amount.toLocaleString()}`,
      });
    } catch (pusherError) {
      console.error('Failed to trigger Pusher event:', pusherError);
    }

    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('Error placing bid:', error);
    return NextResponse.json(
      { error: 'Failed to place bid' },
      { status: 500 }
    );
  }
}
