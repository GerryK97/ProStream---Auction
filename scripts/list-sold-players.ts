import { connectToDatabase } from '../src/lib/mongodb';
import { TournamentModel } from '../src/models/Tournament';
import { TeamModel } from '../src/models/Team';
import { PlayerModel } from '../src/models/Player';

async function list() {
  await connectToDatabase();
  const name = process.argv[2] ?? 'Hatton Premier League 2026';
  const t = await TournamentModel.findOne({ name: { $regex: name, $options: 'i' } }).lean() as any;
  if (!t) { console.error('Tournament not found'); process.exit(1); }

  const teams = await TeamModel.find({ tournamentId: String(t._id) }).sort({ name: 1 }).lean() as any[];
  const soldPlayers = await PlayerModel.find({ tournamentId: String(t._id), isSold: true }).sort({ updatedAt: 1 }).lean() as any[];

  console.log('Tournament:', t.name);
  console.log('Total sold players:', soldPlayers.length);

  for (const team of teams) {
    const myPlayers = soldPlayers.filter((p: any) => String(p.winningTeamId) === String(team._id));
    const totalSpent = myPlayers.reduce((s: number, p: any) => s + (p.finalPrice ?? 0), 0);
    console.log('\n' + '='.repeat(52));
    console.log('Team : ' + team.name);
    console.log('Budget: ' + team.initialBudget + '  |  Balance: ' + team.currentBalance + '  |  Spent: ' + totalSpent);
    console.log('Players bought: ' + myPlayers.length);
    console.log('-'.repeat(52));
    if (myPlayers.length === 0) {
      console.log('  (no players sold yet)');
    } else {
      myPlayers.forEach((p: any, i: number) => {
        console.log('  ' + String(i + 1).padStart(2) + '. ' + p.name.padEnd(28) + 'Rs. ' + (p.finalPrice ?? 0).toLocaleString());
      });
      console.log('-'.repeat(52));
      console.log('       ' + 'Total spent'.padEnd(29) + 'Rs. ' + totalSpent.toLocaleString());
    }
  }
  console.log('\n' + '='.repeat(52));
  process.exit(0);
}
list().catch(e => { console.error(e); process.exit(1); });
