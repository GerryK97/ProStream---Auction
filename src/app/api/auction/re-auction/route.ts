import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { triggerAuctionUndo } from '@/lib/pusher-server';
import { serializePlayer } from '@/lib/cloudinaryUtils';

// POST /api/auction/re-auction - Reset all unsold players back to available for re-auction
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

    // Find all unsold players for this tournament
    const unsoldPlayers = await PlayerModel.find({ tournamentId, isUnsold: true }).lean();

    if (unsoldPlayers.length === 0) {
      return NextResponse.json(
        { error: 'No unsold players to re-auction' },
        { status: 400 }
      );
    }

    // Reset all unsold players back to available
    await PlayerModel.updateMany(
      { tournamentId, isUnsold: true },
      { $set: { isUnsold: false } }
    );

    // Fetch updated player documents + current auction state
    // (avoids full-state payload that can exceed Pusher's 10KB message size limit)
    const [updatedPlayers, auctionState] = await Promise.all([
      PlayerModel.find({ tournamentId, _id: { $in: unsoldPlayers.map(p => p._id) } }).lean(),
      AuctionStateModel.findOne({ tournamentId }).lean(),
    ]);

    // Fire one auction:undo event per player — all in parallel (no dependency between them)
    await Promise.all(
      updatedPlayers.map((player) =>
        triggerAuctionUndo(tournamentId, {
          restoredPlayer: serializePlayer(player as any) as any,
          updatedTeam: null,
          refundedAmount: 0,
          auctionState: auctionState as any,
          message: 'Player moved back to available for re-auction',
        }).catch((pusherError) =>
          console.error('[re-auction] Pusher event failed for player:', (player as any)._id, pusherError)
        )
      )
    );

    return NextResponse.json({
      success: true,
      reAuctionedCount: unsoldPlayers.length,
      reAuctionedPlayerIds: unsoldPlayers.map(p => (p as any)._id.toString()),
      message: `${unsoldPlayers.length} player(s) are now available for re-auction`,
    });
  } catch (error) {
    console.error('Error re-auctioning players:', error);
    return NextResponse.json(
      { error: 'Failed to re-auction players' },
      { status: 500 }
    );
  }
}
