import { connectToDatabase } from '../src/lib/mongodb';
import { TournamentModel } from '../src/models/Tournament';
import { TeamModel } from '../src/models/Team';
import { PlayerModel } from '../src/models/Player';

async function check() {
  await connectToDatabase();
  const teamName = process.argv[2] ?? 'AAMINA SUPERMART';
  const t = await TournamentModel.findOne({ name: /Hatton Premier League 2026/i }).lean() as any;
  const team = await TeamModel.findOne({ tournamentId: String(t._id), name: { $regex: teamName, $options: 'i' } }).lean() as any;
  if (!team) { console.error('Team not found'); process.exit(1); }

  const soldPlayers = await PlayerModel.find({
    tournamentId: String(t._id),
    isSold: true,
    winningTeamId: String(team._id),
  }).lean() as any[];

  console.log('Team:', team.name);
  console.log('initialBudget      :', team.initialBudget);
  console.log('currentBalance (DB):', team.currentBalance);
  console.log('playersPurchased   :', team.playersPurchased?.length ?? 0, 'entries');
  team.playersPurchased?.forEach((id: string) => console.log('  -', id));

  console.log('\nActual sold players (isSold=true):', soldPlayers.length);
  soldPlayers.forEach((p: any, i: number) => {
    console.log('  ' + (i + 1) + '. ' + p.name + ' | finalPrice: ' + (p.finalPrice ?? 0) + ' | _id: ' + p._id);
  });

  const totalSpent = soldPlayers.reduce((s: number, p: any) => s + (p.finalPrice ?? 0), 0);
  const correctBalance = team.initialBudget - totalSpent;
  console.log('\nTotal spent (actual) :', totalSpent);
  console.log('Correct balance      :', correctBalance);
  if (team.currentBalance !== correctBalance) {
    console.log('⚠️  Balance drift: off by', team.currentBalance - correctBalance, '(DB has', team.currentBalance, ', should be', correctBalance + ')');
  } else {
    console.log('✓ Balance is correct');
  }
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
