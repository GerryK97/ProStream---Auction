import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { triggerPlayerMarkedUnsold, triggerClassCompleted } from '@/lib/pusher-server';
import { serializePlayer } from '@/lib/cloudinaryUtils';
import { authorizeAuctionMutation } from '@/lib/auctionAuthorization';

// POST /api/auction/mark-unsold - Mark the current player as explicitly unsold and reset auction state
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
    if (access.tournament.status !== 'Live') {
      return NextResponse.json({ error: 'Auction is not live' }, { status: 400 });
    }

    // Find the current auction state to get which player is up for auction
    const auctionState = await AuctionStateModel.findOne({ tournamentId }).lean();
    const currentPlayerId = (auctionState as any)?.currentPlayerId;
    const activeClass = (auctionState as any)?.currentAuctionClass as string | null;

    if (!currentPlayerId) {
      return NextResponse.json(
        { error: 'No player currently up for auction' },
        { status: 400 }
      );
    }

    const actionAt = new Date();
    const updatedPlayer = await PlayerModel.findOneAndUpdate(
      {
        _id: currentPlayerId,
        tournamentId,
        isSold: false,
        isUnsold: { $ne: true },
      },
      { $set: { isUnsold: true, isSold: false, updatedAt: actionAt } },
      { returnDocument: 'after' }
    ).lean();

    if (!updatedPlayer) {
      return NextResponse.json({ error: 'Player is no longer available to mark unsold' }, { status: 409 });
    }

    const updatedState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId, currentPlayerId: String(currentPlayerId) },
      {
        $set: {
          currentPlayerId: null,
          currentBid: 0,
          winningTeamId: null,
          currentAuctionStatus: 'Pending',
          history: [],
        },
      },
      { returnDocument: 'after' }
    ).lean();

    if (!updatedState) {
      await PlayerModel.findOneAndUpdate(
        { _id: currentPlayerId, tournamentId, isUnsold: true, updatedAt: actionAt },
        { $set: { isUnsold: false, updatedAt: new Date() } },
      );
      return NextResponse.json(
        { error: 'Auction state changed before the player was marked unsold' },
        { status: 409 },
      );
    }

    // Check if the active class is now complete after marking this player unsold
    if (activeClass) {
      const remainingInClass = await PlayerModel.countDocuments({
        tournamentId,
        playerClass: activeClass,
        isSold: { $ne: true },
        isUnsold: { $ne: true },
      });
      if (remainingInClass === 0) {
        const finalState = await AuctionStateModel.findOneAndUpdate(
          { tournamentId },
          {
            $addToSet: { completedClasses: activeClass },
            $set: { currentAuctionClass: null },
          },
          { returnDocument: 'after' }
        ).lean();
        try {
          triggerClassCompleted(tournamentId, {
            completedClassCode: activeClass,
            completedClasses: (finalState as any)?.completedClasses ?? [activeClass],
            auctionState: finalState as any,
            message: `${activeClass} class auction completed`,
          }).catch((err) => console.error('[mark-unsold] classCompleted Pusher failed:', err));
        } catch (pusherError) {
          console.error('[mark-unsold] triggerClassCompleted failed:', pusherError);
        }
      }
    }

    // Broadcast a targeted event — just the updated player + auction state
    // (avoids full-state payload that can exceed Pusher's message size limit)
    try {
      triggerPlayerMarkedUnsold(tournamentId, {
        unsoldPlayer: serializePlayer(updatedPlayer as any) as any,
        auctionState: updatedState as any,
        message: 'Player marked as unsold',
      }).catch((err) => console.error('[mark-unsold] Pusher trigger failed:', err));
    } catch (pusherError) {
      console.error('Failed to trigger Pusher event:', pusherError);
    }

    return NextResponse.json({
      message: 'Player marked as unsold',
      auctionState: updatedState,
    });
  } catch (error) {
    console.error('Error marking player as unsold:', error);
    return NextResponse.json(
      { error: 'Failed to mark player as unsold' },
      { status: 500 }
    );
  }
}
