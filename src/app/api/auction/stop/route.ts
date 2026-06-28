import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { PlayerModel } from '@/models/Player';
import { AuctionStateModel } from '@/models/AuctionState';
import { triggerAuctionStopped } from '@/lib/pusher-server';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// POST /api/auction/stop - Stop auction (can be incomplete or complete)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage auctions
    if (!canPerformAction(user.role, 'manage', 'auction')) {
      return NextResponse.json({
        error: `Your role (${user.role}) does not have permission to stop auctions.`
      }, { status: 403 });
    }

    await connectToDatabase();
    const { tournamentId } = await request.json();

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Missing required field: tournamentId' },
        { status: 400 }
      );
    }

    // Get tournament
    const tournament = await TournamentModel.findById(tournamentId).lean();
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this tournament
    const hasAccess = user.role === 'Admin' ||
                     (user.role === 'Tournament' && (tournament as any).createdBy === user.userId);

    if (!hasAccess) {
      return NextResponse.json({
        error: 'You do not have permission to manage this tournament.'
      }, { status: 403 });
    }

    // Check if tournament is live or paused
    if ((tournament as any).status !== 'Live' && (tournament as any).status !== 'Paused') {
      return NextResponse.json(
        { error: 'Tournament is not in Live or Paused status' },
        { status: 400 }
      );
    }

    // Count total players and sold players — parallel (no dependency)
    const [totalPlayers, soldPlayers] = await Promise.all([
      PlayerModel.countDocuments({ tournamentId }),
      PlayerModel.countDocuments({ tournamentId, isSold: true }),
    ]);

    // Determine status: Completed if all sold, Stopped otherwise
    const newStatus = soldPlayers === totalPlayers ? 'Completed' : 'Stopped';

    // Update tournament status + fetch auction state — parallel (independent)
    const [updatedTournament, auctionState] = await Promise.all([
      TournamentModel.findByIdAndUpdate(
        tournamentId,
        { $set: { status: newStatus } },
        { returnDocument: 'after' }
      ).lean(),
      AuctionStateModel.findOne({ tournamentId }).lean(),
    ]);

    // Trigger Pusher event
    try {
      await triggerAuctionStopped({
        tournament: updatedTournament as any,
        auctionState: auctionState as any,
        message: `Auction ${newStatus.toLowerCase()} successfully`,
      });
    } catch (pusherError) {
      console.error('Failed to trigger Pusher event:', pusherError);
    }

    return NextResponse.json({
      message: `Auction ${newStatus.toLowerCase()} successfully`,
      tournament: updatedTournament,
      stats: {
        totalPlayers,
        soldPlayers,
        remainingPlayers: totalPlayers - soldPlayers,
        isComplete: soldPlayers === totalPlayers
      }
    });
  } catch (error) {
    console.error('Error stopping auction:', error);
    return NextResponse.json(
      { error: 'Failed to stop auction' },
      { status: 500 }
    );
  }
}
