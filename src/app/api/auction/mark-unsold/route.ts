import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { triggerPlayerMarkedUnsold, triggerClassCompleted } from '@/lib/pusher-server';
import { serializePlayer } from '@/lib/cloudinaryUtils';

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

    // Mark player unsold + reset auction state in parallel (independent documents)
    // Explicit updatedAt ensures reliable timestamp comparison in the undo route
    const [updatedPlayer, updatedState] = await Promise.all([
      PlayerModel.findOneAndUpdate(
        { _id: currentPlayerId },
        { $set: { isUnsold: true, isSold: false, updatedAt: new Date() } },
        { new: true }
      ).lean(),
      AuctionStateModel.findOneAndUpdate(
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
        { new: true }
      ).lean(),
    ]);

    if (!updatedPlayer) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
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
            $push: { completedClasses: activeClass },
            $set: { currentAuctionClass: null },
          },
          { new: true }
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
