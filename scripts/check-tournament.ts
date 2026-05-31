import { connectToDatabase } from '../src/lib/mongodb';
import { TournamentModel } from '../src/models/Tournament';
import { TeamModel } from '../src/models/Team';
import { PlayerModel } from '../src/models/Player';

async function check() {
  await connectToDatabase();
  const t = await TournamentModel.findOne({ name: /Hatton Premier League 2026/i }).lean() as any;
  console.log('Tournament:', t.name);
  console.log('  squadSize          :', t.squadSize);
  console.log('  basePricePerPlayer :', t.basePricePerPlayer);
  console.log('  initialBudgetPerTeam:', t.initialBudgetPerTeam);
  console.log('  totalPlayers       :', t.totalPlayers);

  const teams = await TeamModel.find({ tournamentId: String(t._id) }).sort({ name: 1 }).lean() as any[];
  const soldPlayers = await PlayerModel.find({ tournamentId: String(t._id), isSold: true }).lean() as any[];

  console.log('\nTeams:');
  for (const team of teams) {
    const bought = soldPlayers.filter((p: any) => String(p.winningTeamId) === String(team._id)).length;
    const remaining = (t.squadSize ?? 0) - bought;
    console.log('  ' + team.name);
    console.log('    initialBudget:', team.initialBudget, '| currentBalance:', team.currentBalance, '| bought:', bought, '| remaining slots:', remaining);
  }
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
