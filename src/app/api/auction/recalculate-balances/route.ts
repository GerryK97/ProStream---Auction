import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { authorizeAuctionMutation } from '@/lib/auctionAuthorization';

// POST /api/auction/recalculate-balances
// Recalculates currentBalance and playersPurchased for every team in a tournament
// by aggregating actual sold-player data — the only source of truth.
// Safe to run at any time; does not touch player records or auction state.
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { tournamentId } = await request.json();

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing required field: tournamentId' }, { status: 400 });
    }

    const access = await authorizeAuctionMutation(request, tournamentId);
    if (!access.authorized) return access.response;
    const tournament = access.tournament;

    const teams = await TeamModel.find({ tournamentId }).lean();
    if (!teams.length) {
      return NextResponse.json({ error: 'No teams found for this tournament' }, { status: 404 });
    }

    // Aggregate total spend and player list per team in one query
    const spendAgg: { _id: string; totalSpent: number; playerIds: string[] }[] =
      await PlayerModel.aggregate([
        { $match: { tournamentId, isSold: true, winningTeamId: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$winningTeamId',
            totalSpent: { $sum: '$finalPrice' },
            playerIds: { $push: { $toString: '$_id' } },
          },
        },
      ]);

    const spendByTeam = new Map(spendAgg.map(r => [r._id, r]));

    const results: { teamId: string; name: string; before: number; after: number; players: number }[] = [];

    await Promise.all(
      teams.map(async (team: any) => {
        const entry = spendByTeam.get(team._id);
        const totalSpent = entry?.totalSpent ?? 0;
        const playersPurchased = entry?.playerIds ?? [];
        const newBalance = (team.initialBudget ?? 0) - totalSpent;

        await TeamModel.findByIdAndUpdate(team._id, {
          $set: {
            currentBalance: newBalance,
            playersPurchased,
          },
        });

        results.push({
          teamId: team._id,
          name: team.name,
          before: team.currentBalance ?? 0,
          after: newBalance,
          players: playersPurchased.length,
        });
      })
    );

    return NextResponse.json({
      ok: true,
      tournament: (tournament as any).name,
      teamsUpdated: results.length,
      results,
    });
  } catch (error) {
    console.error('Error in /api/auction/recalculate-balances:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Recalculation failed: ${msg}` }, { status: 500 });
  }
}
