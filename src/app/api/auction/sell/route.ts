import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { triggerPlayerSold } from '@/lib/pusher-server';
import { getMinClassBasePrice } from '@/lib/playerClassUtils';

// POST /api/auction/sell - Sell the current player to the winning team
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { tournamentId, teamId } = await request.json();

    if (!tournamentId || !teamId) {
      return NextResponse.json(
        { error: 'Missing required fields: tournamentId, teamId' },
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

    // Validate
    if (!auctionState.currentPlayerId || auctionState.currentBid === 0) {
      return NextResponse.json(
        { error: 'No valid bid to sell' },
        { status: 400 }
      );
    }

    // Validate team exists
    const team = await TeamModel.findOne({ _id: teamId }).lean();
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Validate team has enough balance
    if (auctionState.currentBid > (team as any).currentBalance) {
      return NextResponse.json(
        { error: 'Team does not have enough balance for this player' },
        { status: 400 }
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

    // Validate bid does not exceed team's max affordable bid (reserve budget for remaining squad slots)
    const squadSize = (tournament as any)?.squadSize ?? 0;
    const basePrice = getMinClassBasePrice(tournament as any);
    const playersPurchased = (team as any).playersPurchased?.length ?? 0;
    const squadRemainingPlayers = squadSize - playersPurchased;
    const maxBid = squadRemainingPlayers <= 1
      ? ((team as any).currentBalance ?? 0)
      : Math.max(0, ((team as any).currentBalance ?? 0) - (squadRemainingPlayers - 1) * basePrice);

    if (auctionState.currentBid > maxBid) {
      return NextResponse.json(
        {
          error: `Cannot sell to ${(team as any).name} — bid of ₹${auctionState.currentBid.toLocaleString('en-IN')} exceeds their max bid of ₹${maxBid.toLocaleString('en-IN')} (balance needed for remaining squad slots)`,
        },
        { status: 400 }
      );
    }

    const { currentPlayerId, currentBid } = auctionState;

    // Update player to sold
    // Explicit updatedAt ensures reliable timestamp comparison in the undo route
    const updatedPlayer = await PlayerModel.findOneAndUpdate(
      { _id: currentPlayerId },
      {
        $set: {
          isSold: true,
          finalPrice: currentBid,
          winningTeamId: teamId,
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!updatedPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Update team balance and players purchased
    const updatedTeam = await TeamModel.findOneAndUpdate(
      { _id: teamId },
      {
        $inc: { currentBalance: -currentBid },
        $push: { playersPurchased: currentPlayerId },
      },
      { new: true }
    ).lean();

    if (!updatedTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Update auction state to Sold
    const updatedState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      {
        $set: {
          currentAuctionStatus: 'Sold',
        },
      },
      { new: true }
    ).lean();

    // Count remaining unsold players
    const remainingPlayers = await PlayerModel.countDocuments({
      tournamentId,
      isSold: false,
    });

    // Trigger Pusher event
    try {
      await triggerPlayerSold(tournamentId, {
        soldPlayer: updatedPlayer as any,
        winningTeam: updatedTeam as any,
        finalPrice: currentBid,
        remainingPlayers,
        remainingBudget: (updatedTeam as any).currentBalance,
        auctionState: updatedState as any,
        message: `${(updatedPlayer as any).name} sold to ${(updatedTeam as any).name} for ${currentBid.toLocaleString()}`,
      });
    } catch (pusherError) {
      console.error('Failed to trigger Pusher event:', pusherError);
    }

    return NextResponse.json({
      auctionState: updatedState,
      player: updatedPlayer,
      team: updatedTeam,
    });
  } catch (error) {
    console.error('Error selling player:', error);
    return NextResponse.json(
      { error: 'Failed to sell player' },
      { status: 500 }
    );
  }
}
