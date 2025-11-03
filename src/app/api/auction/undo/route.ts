import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';

// POST /api/auction/undo - Undo the last player sale
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { tournamentId } = await request.json();

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Missing required field: tournamentId' },
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

    if (!auctionState.currentPlayerId) {
      return NextResponse.json(
        { error: 'No player to undo' },
        { status: 400 }
      );
    }

    // Get the sold player
    const player = await PlayerModel.findOne({
      _id: auctionState.currentPlayerId,
      isSold: true,
    }).lean();

    if (!player || !player.winningTeamId || player.finalPrice === undefined) {
      return NextResponse.json(
        { error: 'No sold player found to undo' },
        { status: 400 }
      );
    }

    const { _id: playerId, winningTeamId, finalPrice } = player;

    // Unsell the player
    await PlayerModel.findOneAndUpdate(
      { _id: playerId },
      {
        $set: {
          isSold: false,
        },
        $unset: {
          finalPrice: '',
          winningTeamId: '',
        },
      }
    );

    // Refund the team
    await TeamModel.findOneAndUpdate(
      { _id: winningTeamId },
      {
        $inc: { currentBalance: finalPrice },
        $pull: { playersPurchased: playerId },
      }
    );

    // Reset auction state for this player
    const updatedState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      {
        $set: {
          currentBid: 0,
          winningTeamId: null,
          currentAuctionStatus: 'Pending',
          history: [],
        },
      },
      { new: true }
    ).lean();

    return NextResponse.json({
      message: 'Last sale undone successfully',
      auctionState: updatedState,
    });
  } catch (error) {
    console.error('Error undoing sale:', error);
    return NextResponse.json(
      { error: 'Failed to undo sale' },
      { status: 500 }
    );
  }
}
