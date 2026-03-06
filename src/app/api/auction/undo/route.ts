import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { triggerAuctionUndo } from '@/lib/pusher-server';

// POST /api/auction/undo - Undo the last player sale or unsold marking
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

    // Find the most recently acted-upon sold player
    const lastSoldPlayer = await PlayerModel.findOne({
      tournamentId,
      isSold: true,
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Find the most recently acted-upon unsold player
    const lastUnsoldPlayer = await PlayerModel.findOne({
      tournamentId,
      isUnsold: true,
      isSold: false,
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!lastSoldPlayer && !lastUnsoldPlayer) {
      return NextResponse.json(
        { error: 'No sold or unsold player found to undo' },
        { status: 400 }
      );
    }

    // Determine which action to undo:
    // - If only one type exists, undo that one
    // - If both exist, compare updatedAt timestamps; prefer undo-unsold on tie
    //   (marking unsold is always the more recent action when both are equal/null)
    let undoSale: boolean;
    if (lastSoldPlayer && !lastUnsoldPlayer) {
      undoSale = true;
    } else if (!lastSoldPlayer && lastUnsoldPlayer) {
      undoSale = false;
    } else {
      const soldAt   = new Date((lastSoldPlayer   as any).updatedAt ?? null).getTime();
      const unsoldAt = new Date((lastUnsoldPlayer as any).updatedAt ?? null).getTime();
      // Use strict greater-than so ties (both null → both 0) prefer undo-unsold
      undoSale = soldAt > unsoldAt;
    }

    if (undoSale) {
      // ── Undo a Sale ────────────────────────────────────────────────────────
      const { _id: playerId, winningTeamId, finalPrice } = lastSoldPlayer as any;

      if (!winningTeamId || finalPrice === undefined) {
        return NextResponse.json(
          { error: 'No sold player found to undo' },
          { status: 400 }
        );
      }

      // Unsell the player
      const restoredPlayer = await PlayerModel.findOneAndUpdate(
        { _id: playerId },
        {
          $set: { isSold: false },
          $unset: { finalPrice: '', winningTeamId: '' },
        },
        { new: true }
      ).lean();

      // Refund the team
      const updatedTeam = await TeamModel.findOneAndUpdate(
        { _id: winningTeamId },
        {
          $inc: { currentBalance: finalPrice },
          $pull: { playersPurchased: playerId },
        },
        { new: true }
      ).lean();

      // Get auction state
      let auctionState = await AuctionStateModel.findOne({ tournamentId }).lean();

      // If this was the current player being auctioned, reset the auction state
      if (auctionState && (auctionState as any).currentPlayerId?.toString() === playerId.toString()) {
        auctionState = await AuctionStateModel.findOneAndUpdate(
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
      }

      // Trigger Pusher event
      try {
        await triggerAuctionUndo(tournamentId, {
          restoredPlayer: restoredPlayer as any,
          updatedTeam: updatedTeam as any,
          refundedAmount: finalPrice,
          auctionState: auctionState as any,
          message: 'Last sale undone successfully',
        });
      } catch (pusherError) {
        console.error('Failed to trigger Pusher event:', pusherError);
      }

      return NextResponse.json({
        message: 'Last sale undone successfully',
        player: lastSoldPlayer,
        refundedAmount: finalPrice,
      });

    } else {
      // ── Undo an Unsold marking ─────────────────────────────────────────────
      const { _id: playerId } = lastUnsoldPlayer as any;

      // Restore player to available
      const restoredPlayer = await PlayerModel.findOneAndUpdate(
        { _id: playerId },
        { $set: { isUnsold: false } },
        { new: true }
      ).lean();

      const auctionState = await AuctionStateModel.findOne({ tournamentId }).lean();

      // Use targeted small-payload event (avoids Pusher's ~10KB limit)
      try {
        await triggerAuctionUndo(tournamentId, {
          restoredPlayer: restoredPlayer as any,
          updatedTeam: null,
          refundedAmount: 0,
          auctionState: auctionState as any,
          message: 'Unsold marking reversed',
        });
      } catch (pusherError) {
        console.error('Failed to trigger Pusher event:', pusherError);
      }

      return NextResponse.json({
        message: 'Unsold marking reversed successfully',
        player: restoredPlayer,
      });
    }

  } catch (error) {
    console.error('Error undoing action:', error);
    return NextResponse.json(
      { error: 'Failed to undo action' },
      { status: 500 }
    );
  }
}
