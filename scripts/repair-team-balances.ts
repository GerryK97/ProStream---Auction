/**
 * Repair Script: Recalculate team balances from actual sold player data
 *
 * Purpose: Fix team `currentBalance` and `playersPurchased` that may have
 * drifted out of sync due to undo operations or other issues.
 *
 * The correct state is derived entirely from the Player collection:
 *   currentBalance    = initialBudget - SUM(finalPrice of sold players for this team)
 *   playersPurchased  = [_id strings of sold players for this team]
 *
 * Usage:
 *   npx tsx scripts/repair-team-balances.ts
 *   npx tsx scripts/repair-team-balances.ts "Hatton Premier League 2026"
 *
 * Safety: Idempotent - safe to run multiple times. Prints a preview before saving.
 */

import { connectToDatabase } from '../src/lib/mongodb';
import { TournamentModel } from '../src/models/Tournament';
import { TeamModel } from '../src/models/Team';
import { PlayerModel } from '../src/models/Player';

async function repairTeamBalances(tournamentName?: string) {
  console.log('🔧 Starting team balance repair...\n');

  await connectToDatabase();
  console.log('✓ Connected to MongoDB\n');

  // Find the tournament
  const query = tournamentName
    ? { name: { $regex: tournamentName, $options: 'i' } }
    : {};

  const tournaments = await TournamentModel.find(query).lean();

  if (tournaments.length === 0) {
    console.error(`❌ No tournament found${tournamentName ? ` matching "${tournamentName}"` : ''}`);
    process.exit(1);
  }

  for (const tournament of tournaments) {
    const tId = String(tournament._id);
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📋 Tournament: ${tournament.name} (${tId})`);
    console.log(`${'═'.repeat(60)}`);

    // Fetch all teams and sold players for this tournament
    const teams = await TeamModel.find({ tournamentId: tId }).lean();
    const soldPlayers = await PlayerModel.find({ tournamentId: tId, isSold: true }).lean();

    console.log(`   Teams: ${teams.length} | Sold players: ${soldPlayers.length}\n`);

    // Build a map: teamId → { ids[], totalSpent }
    const teamSales = new Map<string, { ids: string[]; totalSpent: number }>();
    for (const team of teams) {
      teamSales.set(String(team._id), { ids: [], totalSpent: 0 });
    }

    for (const player of soldPlayers) {
      const tid = String((player as any).winningTeamId);
      if (!teamSales.has(tid)) continue; // orphaned — skip
      const entry = teamSales.get(tid)!;
      entry.ids.push(String(player._id));
      entry.totalSpent += (player as any).finalPrice ?? 0;
    }

    // Print comparison and apply fixes
    let changed = 0;
    for (const team of teams) {
      const teamIdStr = String(team._id);
      const sales = teamSales.get(teamIdStr)!;
      const initialBudget = (team as any).initialBudget ?? 0;
      const correctBalance = initialBudget - sales.totalSpent;
      const currentBalance = (team as any).currentBalance ?? 0;
      const currentPurchased = ((team as any).playersPurchased ?? []).length;

      const balanceDrift = currentBalance !== correctBalance;
      const purchasedDrift = currentPurchased !== sales.ids.length;

      if (balanceDrift || purchasedDrift) {
        console.log(`  ⚠️  ${team.name}`);
        if (balanceDrift)
          console.log(`     Balance:   ${currentBalance} → ${correctBalance}  (spent: ${sales.totalSpent})`);
        if (purchasedDrift)
          console.log(`     Players:   ${currentPurchased} → ${sales.ids.length}`);

        await TeamModel.findByIdAndUpdate(team._id, {
          $set: {
            currentBalance: correctBalance,
            playersPurchased: sales.ids,
          },
        });
        changed++;
      } else {
        console.log(`  ✓  ${team.name}  (balance: ${currentBalance}, players: ${currentPurchased}) — OK`);
      }
    }

    console.log(`\n  → ${changed} team(s) corrected`);
  }

  console.log('\n✅ Repair complete.\n');
  process.exit(0);
}

const arg = process.argv[2];
repairTeamBalances(arg).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
