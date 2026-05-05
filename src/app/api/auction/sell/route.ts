import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { triggerPlayerSold } from '@/lib/pusher-server';
import { getMinClassBasePrice } from '@/lib/playerClassUtils';

// POST /api/auction/sell - Sell the current player to the winning team
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { tournamentId, teamId } = await request.json();

    if (!tournamentId || !teamId) {
      return NextResponse.json(
        { error: 'Missing required fields: tournamentId, teamId' },
        { status: 400 }
      );
    }

    // Parallelise the three independent reads that gate every sell.
    // Cuts ~2 round-trips of latency on the hot path.
    const [auctionState, team, tournament] = await Promise.all([
      AuctionStateModel.findOne({ tournamentId }),
      TeamModel.findOne({ _id: teamId }).lean(),
      TournamentModel.findOne({ _id: tournamentId }).lean(),
    ]);

    if (!auctionState) {
      return NextResponse.json(
        { error: 'Auction state not found for this tournament' },
        { status: 404 }
      );
    }

    if (!auctionState.currentPlayerId || auctionState.currentBid === 0) {
      return NextResponse.json(
        { error: 'No valid bid to sell' },
        { status: 400 }
      );
    }

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (auctionState.currentBid > (team as any).currentBalance) {
      return NextResponse.json(
        { error: 'Team does not have enough balance for this player' },
        { status: 400 }
      );
    }

    if (!tournament || (tournament as any).status !== 'Live') {
      return NextResponse.json(
        { error: 'Auction is not live' },
        { status: 400 }
      );
    }

    // Validate bid does not exceed team's max affordable bid (reserve budget for remaining squad slots)
    const squadSize = (tournament as any)?.squadSize ?? 0;
    const basePrice = getMinClassBasePrice(tournament as any);
    const playersPurchased = (team as any).playersPurchased?.length ?? 0;
    const squadRemainingPlayers = squadSize - playersPurchased;
    const maxBid = squadRemainingPlayers <= 1
      ? ((team as any).currentBalance ?? 0)
      : Math.max(0, ((team as any).currentBalance ?? 0) - (squadRemainingPlayers - 1) * basePrice);

    if (auctionState.currentBid > maxBid) {
      return NextResponse.json(
        {
          error: `Cannot sell to ${(team as any).name} — bid of ₹${auctionState.currentBid.toLocaleString('en-IN')} exceeds their max bid of ₹${maxBid.toLocaleString('en-IN')} (balance needed for remaining squad slots)`,
        },
        { status: 400 }
      );
    }

    const { currentPlayerId, currentBid } = auctionState;

    // Parallelise the three independent writes plus the remaining-players count.
    // All four operate on different documents/collections and don't depend on
    // each other's results — values needed for each are already in scope.
    // Explicit updatedAt on the player ensures reliable timestamp comparison
    // in the undo route.
    const [updatedPlayer, updatedTeam, updatedState, remainingPlayers] = await Promise.all([
      PlayerModel.findOneAndUpdate(
        { _id: currentPlayerId },
        {
          $set: {
            isSold: true,
            finalPrice: currentBid,
            winningTeamId: teamId,
            updatedAt: new Date(),
          },
        },
        { new: true }
      ).lean(),
      TeamModel.findOneAndUpdate(
        { _id: teamId },
        {
          $inc: { currentBalance: -currentBid },
          $push: { playersPurchased: currentPlayerId },
        },
        { new: true }
      ).lean(),
      AuctionStateModel.findOneAndUpdate(
        { tournamentId },
        { $set: { currentAuctionStatus: 'Sold' } },
        { new: true }
      ).lean(),
      // currentPlayer is being marked sold in the same Promise.all, so we
      // subtract it from the count rather than relying on countDocuments
      // racing with the player update.
      PlayerModel.countDocuments({
        tournamentId,
        isSold: false,
        _id: { $ne: currentPlayerId },
      }),
    ]);

    if (!updatedPlayer) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    if (!updatedTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Fire-and-forget Pusher trigger so the HTTP response returns immediately;
    // the client has already applied an optimistic update and the broadcast is
    // for other connected clients.
    triggerPlayerSold(tournamentId, {
      soldPlayer: updatedPlayer as any,
      winningTeam: updatedTeam as any,
      finalPrice: currentBid,
      remainingPlayers,
      remainingBudget: (updatedTeam as any).currentBalance,
      auctionState: updatedState as any,
      message: `${(updatedPlayer as any).name} sold to ${(updatedTeam as any).name} for ${currentBid.toLocaleString()}`,
    }).catch((pusherError) => {
      console.error('Failed to trigger Pusher event:', pusherError);
    });

    return NextResponse.json({
      auctionState: updatedState,
      player: updatedPlayer,
      team: updatedTeam,
    });
  } catch (error) {
    console.error('Error selling player:', error);
    return NextResponse.json(
      { error: 'Failed to sell player' },
      { status: 500 }
    );
  }
}
