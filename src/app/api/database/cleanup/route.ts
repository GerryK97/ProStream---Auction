import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { AuctionStateModel } from '@/models/AuctionState';

// POST /api/database/cleanup - Clean up database (development only)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { action } = await request.json();

    if (action === 'reset-all-tournaments-to-draft') {
      // Reset all tournaments to Draft status
      const result = await TournamentModel.updateMany(
        {},
        { $set: { status: 'Draft' } }
      );

      return NextResponse.json({
        message: 'All tournaments reset to Draft status',
        modifiedCount: result.modifiedCount
      });
    }

    if (action === 'reset-all-players') {
      // Reset all players to unsold
      const playerResult = await PlayerModel.updateMany(
        { isSold: true },
        {
          $set: { isSold: false },
          $unset: { finalPrice: '', winningTeamId: '' }
        }
      );

      // Reset all teams budgets
      const teams = await TeamModel.find({}).lean();
      for (const team of teams) {
        await TeamModel.updateOne(
          { _id: team._id },
          {
            $set: {
              currentBalance: team.initialBudget,
              playersPurchased: []
            }
          }
        );
      }

      return NextResponse.json({
        message: 'All players and teams reset',
        playersReset: playerResult.modifiedCount,
        teamsReset: teams.length
      });
    }

    if (action === 'clear-auction-states') {
      // Clear all auction states
      const result = await AuctionStateModel.deleteMany({});

      return NextResponse.json({
        message: 'All auction states cleared',
        deletedCount: result.deletedCount
      });
    }

    if (action === 'full-cleanup') {
      // Full database cleanup

      // 1. Reset all tournaments to Draft
      await TournamentModel.updateMany(
        {},
        { $set: { status: 'Draft' } }
      );

      // 2. Reset all players to unsold
      await PlayerModel.updateMany(
        { isSold: true },
        {
          $set: { isSold: false },
          $unset: { finalPrice: '', winningTeamId: '' }
        }
      );

      // 3. Reset all teams budgets
      const teams = await TeamModel.find({}).lean();
      for (const team of teams) {
        await TeamModel.updateOne(
          { _id: team._id },
          {
            $set: {
              currentBalance: team.initialBudget,
              playersPurchased: []
            }
          }
        );
      }

      // 4. Clear all auction states
      await AuctionStateModel.deleteMany({});

      return NextResponse.json({
        message: 'Full database cleanup completed',
        details: {
          tournamentsReset: 'All to Draft',
          playersReset: 'All to unsold',
          teamsReset: teams.length,
          auctionStatesCleared: 'All'
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: reset-all-tournaments-to-draft, reset-all-players, clear-auction-states, or full-cleanup' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error cleaning up database:', error);
    return NextResponse.json(
      { error: 'Failed to clean up database' },
      { status: 500 }
    );
  }
}
