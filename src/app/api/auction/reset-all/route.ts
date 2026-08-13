import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { triggerStateUpdate } from '@/lib/pusher-server';
import { authorizeAuctionMutation } from '@/lib/auctionAuthorization';

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

    const access = await authorizeAuctionMutation(request, tournamentId);
    if (!access.authorized) return access.response;

    // Reset all players to unsold
    await PlayerModel.updateMany(
      { tournamentId },
      {
        $set: {
          isSold: false,
          isUnsold: false,
        },
        $unset: {
          finalPrice: '',
          winningTeamId: '',
        },
      }
    );

    // Reset all teams' balances and purchased players — single bulkWrite round-trip
    const teams = await TeamModel.find({ tournamentId }).lean();
    if (teams.length > 0) {
      await TeamModel.bulkWrite(
        teams.map((team) => ({
          updateOne: {
            filter: { _id: team._id },
            update: { $set: { currentBalance: team.initialBudget, playersPurchased: [] } },
          },
        }))
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
      { returnDocument: 'after', upsert: true }
    ).lean();

    // Trigger Pusher event so all connected clients (overlays, other browsers) update in real-time
    try {
      const [tournament, freshPlayers, freshTeams] = await Promise.all([
        Promise.resolve(access.tournament),
        PlayerModel.find({ tournamentId }).lean(),
        TeamModel.find({ tournamentId }).lean(),
      ]);
      await triggerStateUpdate({
        tournament: tournament as any,
        auctionState: updatedState as any,
        players: freshPlayers as any,
        teams: freshTeams as any,
        message: 'All sales have been reset',
      });
    } catch (pusherError) {
      console.error('Failed to trigger Pusher event:', pusherError);
    }

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
