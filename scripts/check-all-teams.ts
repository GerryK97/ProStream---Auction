import { connectToDatabase } from '../src/lib/mongodb';
import { TournamentModel } from '../src/models/Tournament';
import { TeamModel } from '../src/models/Team';
import { PlayerModel } from '../src/models/Player';

async function check() {
  await connectToDatabase();
  const t = await TournamentModel.findOne({ name: /Hatton Premier League 2026/i }).lean() as any;
  const squadSize: number = t.squadSize ?? 0;
  const basePrice: number = t.basePricePerPlayer ?? 0;

  const teams = await TeamModel.find({ tournamentId: String(t._id) }).sort({ name: 1 }).lean() as any[];
  const allSold = await PlayerModel.find({ tournamentId: String(t._id), isSold: true }).lean() as any[];

  console.log(`Tournament : ${t.name}`);
  console.log(`Squad Size : ${squadSize}  |  Base Price: Rs. ${basePrice.toLocaleString()}`);
  console.log(`Total sold : ${allSold.length}\n`);
  console.log('='.repeat(80));

  let allOk = true;
  for (const team of teams) {
    const myPlayers = allSold.filter((p: any) => String(p.winningTeamId) === String(team._id));
    const totalSpent = myPlayers.reduce((s: number, p: any) => s + (p.finalPrice ?? 0), 0);
    const correctBalance = team.initialBudget - totalSpent;
    const bought = myPlayers.length;
    const remaining = squadSize - bought;

    // Max bid: if last slot, can spend full balance; else reserve (remaining-1) * basePrice
    const maxBid = remaining <= 1
      ? correctBalance
      : Math.max(0, correctBalance - (remaining - 1) * basePrice);

    const balanceOk = team.currentBalance === correctBalance;
    const storedCount = team.playersPurchased?.length ?? 0;
    const countOk = storedCount === bought;

    if (!balanceOk || !countOk) allOk = false;

    const status = (!balanceOk || !countOk) ? '⚠️ ' : '✓ ';
    console.log(`${status} ${team.name}`);
    console.log(`   Bought : ${bought}/${squadSize}  |  Remaining: ${remaining}`);
    console.log(`   Budget : Rs. ${team.initialBudget.toLocaleString()}  |  Spent: Rs. ${totalSpent.toLocaleString()}`);
    console.log(`   Balance (DB): Rs. ${team.currentBalance?.toLocaleString()}${!balanceOk ? `  ⚠️  should be Rs. ${correctBalance.toLocaleString()}` : '  ✓'}`);
    console.log(`   Max Bid    : Rs. ${maxBid.toLocaleString()}`);
    if (!countOk) console.log(`   playersPurchased array: ${storedCount} entries  ⚠️  should be ${bought}`);
    console.log('');
  }

  console.log('='.repeat(80));
  console.log(allOk ? '✅ All team balances are correct.' : '⚠️  Some teams need repair — run: npx tsx scripts/repair-team-balances.ts');
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
