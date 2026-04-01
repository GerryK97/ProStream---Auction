import { connectToDatabase } from '../src/lib/mongodb';
import { TournamentModel } from '../src/models/Tournament';
import { TeamModel } from '../src/models/Team';
import { PlayerModel } from '../src/models/Player';

async function check() {
  await connectToDatabase();
  const name = process.argv[2] ?? 'Hatton Premier League 2026';
  const t = await TournamentModel.findOne({ name: { $regex: name, $options: 'i' } }).lean() as any;
  if (!t) { console.error('Tournament not found:', name); process.exit(1); }

  const squadSize: number = t.squadSize ?? 0;
  const basePrice: number = t.basePricePerPlayer ?? 0;
  const teams = await TeamModel.find({ tournamentId: String(t._id) }).sort({ name: 1 }).lean() as any[];
  const allSold = await PlayerModel.find({ tournamentId: String(t._id), isSold: true }).lean() as any[];

  console.log(`Tournament : ${t.name}`);
  console.log(`Squad Size : ${squadSize}  |  Base Price: Rs. ${basePrice.toLocaleString()}  |  Budget: Rs. ${(t.budgetPerTeam ?? teams[0]?.initialBudget ?? 0).toLocaleString()}`);
  console.log(`Total sold : ${allSold.length}\n`);
  console.log('='.repeat(80));

  let allOk = true;
  for (const team of teams) {
    const myPlayers = allSold.filter((p: any) => String(p.winningTeamId) === String(team._id));
    const totalSpent = myPlayers.reduce((s: number, p: any) => s + (p.finalPrice ?? 0), 0);
    const correctBalance = team.initialBudget - totalSpent;
    const bought = myPlayers.length;
    const remaining = squadSize > 0 ? squadSize - bought : '—';
    const maxBid = typeof remaining === 'number'
      ? (remaining <= 1 ? correctBalance : Math.max(0, correctBalance - (remaining - 1) * basePrice))
      : correctBalance;

    const balanceOk = team.currentBalance === correctBalance;
    const storedCount = team.playersPurchased?.length ?? 0;
    const countOk = storedCount === bought;
    if (!balanceOk || !countOk) allOk = false;

    const status = (!balanceOk || !countOk) ? '⚠️ ' : '✓ ';
    console.log(`${status} ${team.name}`);
    console.log(`   Players : ${bought}${squadSize > 0 ? '/' + squadSize : ''}  |  Remaining: ${remaining}`);
    console.log(`   Spent   : Rs. ${totalSpent.toLocaleString()}  |  Balance: Rs. ${team.currentBalance?.toLocaleString()}${!balanceOk ? `  ⚠️  should be Rs. ${correctBalance.toLocaleString()}` : '  ✓'}`);
    if (squadSize > 0) console.log(`   Max Bid  : Rs. ${maxBid.toLocaleString()}`);
    if (!countOk) console.log(`   playersPurchased: ${storedCount} stored  ⚠️  should be ${bought}`);
    console.log('');
  }

  console.log('='.repeat(80));
  if (allOk) {
    console.log('✅ All team balances are correct.');
  } else {
    console.log('⚠️  Some teams need repair — run: npx tsx scripts/repair-team-balances.ts "' + name + '"');
  }
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
