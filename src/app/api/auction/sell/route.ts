import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { triggerPlayerSold, triggerClassCompleted } from '@/lib/pusher-server';
import { getMinClassBasePrice } from '@/lib/playerClassUtils';
import { serializeTeam, serializePlayer } from '@/lib/cloudinaryUtils';

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

    // Fetch auction state, team, tournament, and squad count in parallel
    const [auctionState, team, tournament, playersBought] = await Promise.all([
      AuctionStateModel.findOne({ tournamentId }),
      TeamModel.findOne({ _id: teamId }).lean(),
      TournamentModel.findOne({ _id: tournamentId }).lean(),
      PlayerModel.countDocuments({ tournamentId, isSold: true, winningTeamId: String(teamId) }),
    ]);

    if (!auctionState) {
      return NextResponse.json(
        { error: 'Auction state not found for this tournament' },
        { status: 404 }
      );
    }

    // Validate
    if (!auctionState.currentPlayerId || auctionState.currentBid === 0) {
      return NextResponse.json(
        { error: 'No valid bid to sell' },
        { status: 400 }
      );
    }

    // Validate team exists
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Validate team has enough balance
    if (auctionState.currentBid > (team as any).currentBalance) {
      return NextResponse.json(
        { error: 'Team does not have enough balance for this player' },
        { status: 400 }
      );
    }

    // Validate tournament is live
    if (!tournament || (tournament as any).status !== 'Live') {
      return NextResponse.json(
        { error: 'Auction is not live' },
        { status: 400 }
      );
    }

    // Validate bid does not exceed team's max affordable bid (reserve budget for remaining squad slots)
    const squadSize = (tournament as any)?.squadSize ?? 0;
    const basePrice = getMinClassBasePrice(tournament as any);
    const squadRemainingPlayers = squadSize - playersBought;
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

    // Atomic idempotency guard — filter includes isSold: false so only one concurrent
    // request can ever succeed. If null, another request already sold this player.
    // Explicit updatedAt ensures reliable timestamp comparison in the undo route.
    const updatedPlayer = await PlayerModel.findOneAndUpdate(
      { _id: currentPlayerId, isSold: false },
      {
        $set: {
          isSold: true,
          finalPrice: currentBid,
          winningTeamId: teamId,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    ).lean();

    if (!updatedPlayer) {
      return NextResponse.json({ error: 'Player is already sold' }, { status: 409 });
    }

    // Safe subtraction: the atomic isSold guard above ensures exactly one sell ever succeeds
    const newBalance = (team as any).currentBalance - currentBid;

    // Update team balance and auction state in parallel
    const [updatedTeam, updatedState] = await Promise.all([
      TeamModel.findOneAndUpdate(
        { _id: teamId },
        {
          $set: { currentBalance: newBalance },
          $addToSet: { playersPurchased: String(currentPlayerId) },
        },
        { returnDocument: 'after' }
      ).lean(),
      AuctionStateModel.findOneAndUpdate(
        { tournamentId },
        { $set: { currentAuctionStatus: 'Sold' } },
        { returnDocument: 'after' }
      ).lean(),
    ]);

    if (!updatedTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Count remaining players — run both countDocuments in parallel
    const activeClass = (auctionState as any).currentAuctionClass as string | null;
    const [remainingPlayers, remainingInClass] = await Promise.all([
      PlayerModel.countDocuments({ tournamentId, isSold: false }),
      activeClass
        ? PlayerModel.countDocuments({ tournamentId, playerClass: activeClass, isSold: { $ne: true }, isUnsold: { $ne: true } })
        : Promise.resolve(1), // sentinel — non-zero means class not complete
    ]);

    // Check if the active class is now complete after this sale
    if (activeClass && remainingInClass === 0) {
      const finalState = await AuctionStateModel.findOneAndUpdate(
        { tournamentId },
        {
          $push: { completedClasses: activeClass },
          $set: { currentAuctionClass: null },
        },
        { returnDocument: 'after' }
      ).lean();
      triggerClassCompleted(tournamentId, {
        completedClassCode: activeClass,
        completedClasses: (finalState as any)?.completedClasses ?? [activeClass],
        auctionState: finalState as any,
        message: `${activeClass} class auction completed`,
      }).catch((err) => console.error('[sell] classCompleted Pusher failed:', err));
    }

    // Await Pusher for sold events — overlays must receive sold-player and team
    // balance changes in real time. Fire-and-forget promises can be dropped when
    // a serverless function returns, which leaves OBS overlays stale until a hard
    // refresh fetches the updated Mongo state.
    await triggerPlayerSold(tournamentId, {
      soldPlayer: serializePlayer(updatedPlayer as any) as any,
      winningTeam: serializeTeam(updatedTeam as any) as any,
      finalPrice: currentBid,
      remainingPlayers,
      remainingBudget: (updatedTeam as any).currentBalance,
      auctionState: updatedState as any,
      message: `${(updatedPlayer as any).name} sold to ${(updatedTeam as any).name} for ${currentBid.toLocaleString()}`,
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
