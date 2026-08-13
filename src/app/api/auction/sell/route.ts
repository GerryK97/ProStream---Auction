import { after, NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { triggerPlayerSold, triggerClassCompleted } from '@/lib/pusher-server';
import { authorizeAuctionMutation } from '@/lib/auctionAuthorization';
import { getTeamAuctionCapacity } from '@/lib/auctionRules';
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
        { status: 400 },
      );
    }

    const access = await authorizeAuctionMutation(request, tournamentId);
    if (!access.authorized) return access.response;
    const tournament = access.tournament;

    const [auctionState, team, playersBought] = await Promise.all([
      AuctionStateModel.findOne({ tournamentId }),
      TeamModel.findOne({ _id: teamId, tournamentId }).lean(),
      PlayerModel.countDocuments({ tournamentId, isSold: true, winningTeamId: String(teamId) }),
    ]);

    if (!auctionState) {
      return NextResponse.json(
        { error: 'Auction state not found for this tournament' },
        { status: 404 },
      );
    }
    if (tournament.status !== 'Live') {
      return NextResponse.json({ error: 'Auction is not live' }, { status: 400 });
    }
    if (
      !auctionState.currentPlayerId
      || auctionState.currentBid <= 0
      || auctionState.currentAuctionStatus === 'Sold'
    ) {
      return NextResponse.json({ error: 'No valid bid to sell' }, { status: 400 });
    }
    if (!team) {
      return NextResponse.json({ error: 'Team not found in this tournament' }, { status: 404 });
    }

    if (
      tournament.biddingMode === 'team'
      && String((auctionState as any).winningTeamId ?? '') !== String(teamId)
    ) {
      return NextResponse.json(
        { error: 'The selected team is not the current winning bidder' },
        { status: 409 },
      );
    }

    const capacity = getTeamAuctionCapacity(team as any, tournament as any, playersBought);
    if (capacity.isSquadFull) {
      return NextResponse.json({ error: 'Cannot sell to a team with a full squad' }, { status: 400 });
    }
    if (auctionState.currentBid > capacity.maxBid) {
      return NextResponse.json(
        {
          error: `Cannot sell to ${(team as any).name}: bid of ₹${auctionState.currentBid.toLocaleString('en-IN')} exceeds their max bid of ₹${capacity.maxBid.toLocaleString('en-IN')}`,
        },
        { status: 400 },
      );
    }

    const currentPlayerId = String(auctionState.currentPlayerId);
    const currentBid = auctionState.currentBid;
    const reserveAfterPurchase = Math.max(0, capacity.remainingSlots - 1)
      * getMinClassBasePrice(tournament as any);
    const minimumRequiredBalance = currentBid + reserveAfterPurchase;

    // Claim the player first. The isSold guard makes duplicate sell requests idempotent.
    const updatedPlayer = await PlayerModel.findOneAndUpdate(
      { _id: currentPlayerId, tournamentId, isSold: false },
      {
        $set: {
          isSold: true,
          isUnsold: false,
          finalPrice: currentBid,
          winningTeamId: teamId,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' },
    ).lean();

    if (!updatedPlayer) {
      return NextResponse.json({ error: 'Player is already sold or no longer available' }, { status: 409 });
    }

    // Deduct atomically and re-check balance/squad capacity at write time. If this
    // guard fails, restore the player so a partial sale cannot remain in the database.
    const updatedTeam = await TeamModel.findOneAndUpdate(
      {
        _id: teamId,
        tournamentId,
        // Re-check the complete reserve invariant at write time, not only the
        // immediate purchase price. Concurrent spending cannot consume the
        // budget required to fill the remaining squad slots.
        currentBalance: { $gte: minimumRequiredBalance },
        playersPurchased: { $ne: currentPlayerId },
        $expr: {
          $lt: [
            { $size: { $ifNull: ['$playersPurchased', []] } },
            tournament.squadSize,
          ],
        },
      },
      {
        $inc: { currentBalance: -currentBid },
        $addToSet: { playersPurchased: currentPlayerId },
      },
      { returnDocument: 'after' },
    ).lean();

    if (!updatedTeam) {
      await PlayerModel.findOneAndUpdate(
        {
          _id: currentPlayerId,
          tournamentId,
          isSold: true,
          winningTeamId: teamId,
          finalPrice: currentBid,
        },
        {
          $set: { isSold: false, isUnsold: false, updatedAt: new Date() },
          $unset: { finalPrice: '', winningTeamId: '' },
        },
      );
      return NextResponse.json(
        { error: 'Team balance or squad changed before the sale completed. Refresh and try again.' },
        { status: 409 },
      );
    }

    const updatedState = await AuctionStateModel.findOneAndUpdate(
      {
        tournamentId,
        currentPlayerId,
        currentBid,
        currentAuctionStatus: { $ne: 'Sold' },
      },
      { $set: { currentAuctionStatus: 'Sold', winningTeamId: teamId } },
      { returnDocument: 'after' },
    ).lean();

    if (!updatedState) {
      await Promise.all([
        PlayerModel.findOneAndUpdate(
          {
            _id: currentPlayerId,
            tournamentId,
            isSold: true,
            winningTeamId: teamId,
            finalPrice: currentBid,
          },
          {
            $set: { isSold: false, isUnsold: false, updatedAt: new Date() },
            $unset: { finalPrice: '', winningTeamId: '' },
          },
        ),
        TeamModel.findOneAndUpdate(
          { _id: teamId, tournamentId, playersPurchased: currentPlayerId },
          {
            $inc: { currentBalance: currentBid },
            $pull: { playersPurchased: currentPlayerId },
          },
        ),
      ]);
      return NextResponse.json(
        { error: 'Auction state changed before the sale completed. Refresh and try again.' },
        { status: 409 },
      );
    }

    // Defer Pusher + class-completion work. The operator UI already applied an
    // optimistic sell, so do not make the HTTP response wait for countDocuments
    // or the Pusher REST round-trip.
    const deferredPostSellWork = async () => {
      try {
        const activeClass = (auctionState as any).currentAuctionClass as string | null;
        const [remainingPlayers, remainingInClass] = await Promise.all([
          PlayerModel.countDocuments({ tournamentId, isSold: false }),
          activeClass
            ? PlayerModel.countDocuments({
              tournamentId,
              playerClass: activeClass,
              isSold: { $ne: true },
              isUnsold: { $ne: true },
            })
            : Promise.resolve(1),
        ]);

        await triggerPlayerSold(tournamentId, {
          soldPlayer: serializePlayer(updatedPlayer as any) as any,
          winningTeam: serializeTeam(updatedTeam as any) as any,
          finalPrice: currentBid,
          remainingPlayers,
          remainingBudget: (updatedTeam as any).currentBalance,
          auctionState: updatedState as any,
          message: `${(updatedPlayer as any).name} sold to ${(updatedTeam as any).name} for ${currentBid.toLocaleString()}`,
        });

        if (activeClass && remainingInClass === 0) {
          const finalState = await AuctionStateModel.findOneAndUpdate(
            { tournamentId },
            {
              $addToSet: { completedClasses: activeClass },
              $set: { currentAuctionClass: null },
            },
            { returnDocument: 'after' },
          ).lean();
          triggerClassCompleted(tournamentId, {
            completedClassCode: activeClass,
            completedClasses: (finalState as any)?.completedClasses ?? [activeClass],
            auctionState: finalState as any,
            message: `${activeClass} class auction completed`,
          }).catch((err) => console.error('[sell] classCompleted Pusher failed:', err));
        }
      } catch (err) {
        console.error('[sell] Deferred post-sell work failed:', err);
      }
    };
    after(deferredPostSellWork);

    return NextResponse.json({
      auctionState: updatedState,
      player: updatedPlayer,
      team: updatedTeam,
    });
  } catch (error) {
    console.error('Error selling player:', error);
    return NextResponse.json(
      { error: 'Failed to sell player' },
      { status: 500 },
    );
  }
}
