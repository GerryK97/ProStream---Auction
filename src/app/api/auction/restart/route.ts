import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { PlayerModel } from '@/models/Player';
import { AuctionStateModel } from '@/models/AuctionState';
import { triggerAuctionRestarted } from '@/lib/pusher-server';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canAccessTournament, canPerformAction } from '@/lib/permissions';

// POST /api/auction/restart - Restart a stopped auction
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
        error: `Your role (${user.role}) does not have permission to restart auctions.`
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
    const hasAccess = canAccessTournament(
      user.userId,
      user.role,
      tournament as any,
      user.assignedTournaments,
    );

    if (!hasAccess) {
      return NextResponse.json({
        error: 'You do not have permission to manage this tournament.'
      }, { status: 403 });
    }

    // Check if tournament is stopped
    if ((tournament as any).status !== 'Stopped') {
      return NextResponse.json(
        { error: 'Only stopped auctions can be restarted' },
        { status: 400 }
      );
    }

    // Non-Admin: auto-stop other live tournaments + count unsold players — parallel
    const [, unsoldPlayers] = await Promise.all([
      user.role !== 'Admin'
        ? TournamentModel.updateMany(
            { status: 'Live', _id: { $ne: tournamentId }, createdBy: user.userId },
            { $set: { status: 'Stopped' } }
          )
        : Promise.resolve(null),
      PlayerModel.countDocuments({ tournamentId, isSold: false }),
    ]);

    if (unsoldPlayers === 0) {
      return NextResponse.json(
        { error: 'All players have been sold. Cannot restart auction.' },
        { status: 400 }
      );
    }

    // Update tournament to Live + fetch auction state — parallel (independent)
    const [updatedTournament, auctionState] = await Promise.all([
      TournamentModel.findByIdAndUpdate(
        tournamentId,
        { $set: { status: 'Live' } },
        { returnDocument: 'after' }
      ).lean(),
      AuctionStateModel.findOne({ tournamentId }).lean(),
    ]);

    // Trigger Pusher event
    try {
      await triggerAuctionRestarted({
        tournament: updatedTournament as any,
        auctionState: auctionState as any,
        message: 'Auction restarted successfully',
      });
    } catch (pusherError) {
      console.error('Failed to trigger Pusher event:', pusherError);
    }

    return NextResponse.json({
      message: 'Auction restarted successfully',
      tournament: updatedTournament,
      unsoldPlayers
    });
  } catch (error) {
    console.error('Error restarting auction:', error);
    return NextResponse.json(
      { error: 'Failed to restart auction' },
      { status: 500 }
    );
  }
}
