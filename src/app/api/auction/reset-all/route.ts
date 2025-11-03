import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';

// POST /api/auction/reset-all - Reset all sales and restart the auction
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

    // Reset all players to unsold
    await PlayerModel.updateMany(
      { tournamentId },
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

    // Reset all teams' balances and purchased players
    const teams = await TeamModel.find({ tournamentId }).lean();
    for (const team of teams) {
      await TeamModel.findOneAndUpdate(
        { _id: team._id },
        {
          $set: {
            currentBalance: team.initialBudget,
            playersPurchased: [],
          },
        }
      );
    }

    // Reset auction state
    const updatedState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      {
        $set: {
          currentPlayerId: null,
          currentBid: 0,
          winningTeamId: null,
          currentAuctionStatus: 'Pending',
          history: [],
        },
      },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({
      message: 'All sales reset successfully',
      auctionState: updatedState,
    });
  } catch (error) {
    console.error('Error resetting all sales:', error);
    return NextResponse.json(
      { error: 'Failed to reset all sales' },
      { status: 500 }
    );
  }
}
