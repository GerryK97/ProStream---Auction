import mongoose, { type ClientSession } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { triggerStateUpdate } from '@/lib/pusher-server';
import { authorizeAuctionMutation } from '@/lib/auctionAuthorization';
import { getTeamAuctionCapacity } from '@/lib/auctionRules';

class AuctionResultEditError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function recalculateTeamFromSoldPlayers(
  tournamentId: string,
  teamId: string,
  session: ClientSession,
) {
  const team = await TeamModel.findOne({ _id: teamId, tournamentId })
    .session(session)
    .lean();
  const soldPlayers = await PlayerModel.find(
    { tournamentId, isSold: true, winningTeamId: teamId },
    { _id: 1, finalPrice: 1 },
  ).session(session).lean();

  if (!team) {
    throw new AuctionResultEditError('An affected team no longer belongs to this tournament', 409);
  }

  const totalSpent = soldPlayers.reduce(
    (sum, soldPlayer) => sum + Number((soldPlayer as any).finalPrice ?? 0),
    0,
  );
  await TeamModel.findOneAndUpdate(
    { _id: teamId, tournamentId },
    {
      $set: {
        currentBalance: Number((team as any).initialBudget ?? 0) - totalSpent,
        playersPurchased: soldPlayers.map((soldPlayer) => String((soldPlayer as any)._id)),
      },
    },
    { session },
  );
}

// PATCH /api/auction/edit-player-result
// Edit a sold or unsold player's status, final price, or winning team.
export async function PATCH(request: NextRequest) {
  let mongoSession: ClientSession | null = null;

  try {
    await connectToDatabase();
    const { tournamentId, playerId, status, finalPrice, winningTeamId } = await request.json();

    if (!tournamentId || !playerId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: tournamentId, playerId, status' },
        { status: 400 },
      );
    }
    if (!['sold', 'unsold', 'available'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be sold, unsold, or available' },
        { status: 400 },
      );
    }

    const access = await authorizeAuctionMutation(request, tournamentId);
    if (!access.authorized) return access.response;
    const tournament = access.tournament;

    let updatedPlayer: Record<string, any> | null = null;
    let playerName = 'Player';
    mongoSession = await mongoose.startSession();

    // The player result and every affected team derivation are one transaction.
    // Concurrent edits either retry on a write conflict or roll back together.
    await mongoSession.withTransaction(async () => {
      const player = await PlayerModel.findOne({ _id: playerId, tournamentId })
        .session(mongoSession!)
        .lean();
      if (!player) {
        throw new AuctionResultEditError('Player not found', 404);
      }

      playerName = String((player as any).name ?? 'Player');
      const previousTeamId = (player as any).isSold && (player as any).winningTeamId
        ? String((player as any).winningTeamId)
        : null;
      const previousPrice = Number((player as any).finalPrice ?? 0);
      let playerUpdate: Record<string, any>;
      let targetTeamId: string | null = null;

      if (status === 'sold') {
        const newPrice = Number(finalPrice);
        if (!winningTeamId || !Number.isFinite(newPrice) || newPrice <= 0) {
          throw new AuctionResultEditError(
            'A valid finalPrice and winningTeamId are required when status is sold',
            400,
          );
        }

        const newTeam = await TeamModel.findOne({ _id: winningTeamId, tournamentId })
          .session(mongoSession!)
          .lean();
        const purchasedCount = await PlayerModel.countDocuments({
          tournamentId,
          isSold: true,
          winningTeamId: String(winningTeamId),
          _id: { $ne: playerId },
        }).session(mongoSession!);
        if (!newTeam) {
          throw new AuctionResultEditError('Winning team not found in this tournament', 404);
        }

        // This player's previous price is refunded by the source-of-truth rebuild
        // when it already belongs to the same team.
        const effectiveBalance = Number((newTeam as any).currentBalance ?? 0)
          + (previousTeamId === String(winningTeamId) ? previousPrice : 0);
        const capacity = getTeamAuctionCapacity(
          { ...(newTeam as any), currentBalance: effectiveBalance },
          tournament as any,
          purchasedCount,
        );

        if (capacity.isSquadFull) {
          throw new AuctionResultEditError('Winning team already has a full squad', 400);
        }
        if (newPrice > capacity.maxBid) {
          throw new AuctionResultEditError(
            `Final price exceeds the team's maximum affordable bid of ${capacity.maxBid.toLocaleString()}`,
            400,
          );
        }

        targetTeamId = String(winningTeamId);
        playerUpdate = {
          isSold: true,
          isUnsold: false,
          finalPrice: newPrice,
          winningTeamId: targetTeamId,
          updatedAt: new Date(),
        };
      } else if (status === 'unsold') {
        playerUpdate = {
          isSold: false,
          isUnsold: true,
          finalPrice: null,
          winningTeamId: null,
          updatedAt: new Date(),
        };
      } else {
        playerUpdate = {
          isSold: false,
          isUnsold: false,
          finalPrice: null,
          winningTeamId: null,
          updatedAt: new Date(),
        };
      }

      const playerVersion = (player as any).updatedAt;
      updatedPlayer = await PlayerModel.findOneAndUpdate(
        {
          _id: playerId,
          tournamentId,
          ...(playerVersion ? { updatedAt: playerVersion } : {
            isSold: Boolean((player as any).isSold),
            isUnsold: Boolean((player as any).isUnsold),
            finalPrice: (player as any).finalPrice ?? null,
            winningTeamId: (player as any).winningTeamId ?? null,
          }),
        },
        { $set: playerUpdate },
        { returnDocument: 'after', session: mongoSession! },
      ).lean() as Record<string, any> | null;
      if (!updatedPlayer) {
        throw new AuctionResultEditError('Player changed before the edit was saved', 409);
      }

      const affectedTeamIds = [
        ...new Set([previousTeamId, targetTeamId].filter(Boolean) as string[]),
      ];
      for (const affectedTeamId of affectedTeamIds) {
        await recalculateTeamFromSoldPlayers(tournamentId, affectedTeamId, mongoSession!);
      }
    });

    const [updatedPlayers, updatedTeams, auctionState] = await Promise.all([
      PlayerModel.find({ tournamentId }).lean(),
      TeamModel.find({ tournamentId }).lean(),
      AuctionStateModel.findOne({ tournamentId }).lean(),
    ]);

    try {
      await triggerStateUpdate({
        tournament: tournament as any,
        auctionState: auctionState as any,
        players: updatedPlayers as any[],
        teams: updatedTeams as any[],
        message: `Player result updated: ${playerName} → ${status}`,
      });
    } catch (pusherError) {
      console.error('[edit-player-result] Pusher error:', pusherError);
    }

    return NextResponse.json({ ok: true, player: updatedPlayer, teams: updatedTeams });
  } catch (error) {
    if (error instanceof AuctionResultEditError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error in /api/auction/edit-player-result:', error);
    return NextResponse.json({ error: 'Failed to update player result' }, { status: 500 });
  } finally {
    await mongoSession?.endSession();
  }
}
