/**
 * Update team budget for a tournament.
 * Sets initialBudget to NEW_BUDGET and adjusts currentBalance proportionally:
 *   newBalance = newBudget - totalSpent  (recalculated from actual sold players)
 *
 * Also updates the tournament's budgetPerTeam field.
 *
 * Usage: npx tsx scripts/update-team-budget.ts "Tournament Name" <newBudget>
 */
import { connectToDatabase } from '../src/lib/mongodb';
import { TournamentModel } from '../src/models/Tournament';
import { TeamModel } from '../src/models/Team';
import { PlayerModel } from '../src/models/Player';

async function run() {
  await connectToDatabase();

  const tournamentName = process.argv[2];
  const newBudget = Number(process.argv[3]);

  if (!tournamentName || isNaN(newBudget) || newBudget <= 0) {
    console.error('Usage: npx tsx scripts/update-team-budget.ts "Tournament Name" <newBudget>');
    process.exit(1);
  }

  const t = await TournamentModel.findOne({ name: { $regex: tournamentName, $options: 'i' } }).lean() as any;
  if (!t) { console.error('Tournament not found:', tournamentName); process.exit(1); }

  console.log('Tournament :', t.name);
  console.log('New budget : Rs.', newBudget.toLocaleString());
  console.log('');

  // Update tournament budget fields
  await TournamentModel.findByIdAndUpdate(t._id, {
    $set: { budgetPerTeam: newBudget, initialBudgetPerTeam: newBudget },
  });
  console.log('✓ Tournament budgetPerTeam updated to', newBudget);

  // Fetch teams and sold players
  const teams = await TeamModel.find({ tournamentId: String(t._id) }).sort({ name: 1 }).lean() as any[];
  const soldPlayers = await PlayerModel.find({ tournamentId: String(t._id), isSold: true }).lean() as any[];

  console.log('');
  for (const team of teams) {
    const myPlayers = soldPlayers.filter((p: any) => String(p.winningTeamId) === String(team._id));
    const totalSpent = myPlayers.reduce((s: number, p: any) => s + (p.finalPrice ?? 0), 0);
    const newBalance = newBudget - totalSpent;
    const oldBalance = team.currentBalance;
    const oldInitial = team.initialBudget;

    await TeamModel.findByIdAndUpdate(team._id, {
      $set: {
        initialBudget: newBudget,
        currentBalance: newBalance,
        playersPurchased: myPlayers.map((p: any) => String(p._id)),
      },
    });

    console.log('✓', team.name);
    console.log('    initialBudget:', oldInitial, '→', newBudget);
    console.log('    currentBalance:', oldBalance, '→', newBalance, '  (spent:', totalSpent + ')');
  }

  console.log('\n✅ Done. All', teams.length, 'teams updated to budget Rs.', newBudget.toLocaleString());
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
