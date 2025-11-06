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

    // Find the last sold player in the tournament (by finding most recent sold player)
    // We'll use finalPrice as a proxy for when it was sold (higher IDs = more recent)
    const lastSoldPlayer = await PlayerModel.findOne({
      tournamentId,
      isSold: true,
    })
      .sort({ _id: -1 }) // Get most recently inserted sold player
      .lean();

    if (!lastSoldPlayer || !(lastSoldPlayer as any).winningTeamId || (lastSoldPlayer as any).finalPrice === undefined) {
      return NextResponse.json(
        { error: 'No sold player found to undo' },
        { status: 400 }
      );
    }

    const { _id: playerId, winningTeamId, finalPrice } = lastSoldPlayer as any;

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

    // Get auction state
    const auctionState = await AuctionStateModel.findOne({ tournamentId });

    // If this was the current player being auctioned, reset the auction state
    if (auctionState && auctionState.currentPlayerId?.toString() === playerId.toString()) {
      await AuctionStateModel.findOneAndUpdate(
        { tournamentId },
        {
          $set: {
            currentBid: 0,
            winningTeamId: null,
            currentAuctionStatus: 'Pending',
            history: [],
          },
        }
      );
    }

    return NextResponse.json({
      message: 'Last sale undone successfully',
      player: lastSoldPlayer,
      refundedAmount: finalPrice,
    });
  } catch (error) {
    console.error('Error undoing sale:', error);
    return NextResponse.json(
      { error: 'Failed to undo sale' },
      { status: 500 }
    );
  }
}
