import { connectToDatabase } from '../src/lib/mongodb';
import { TournamentModel } from '../src/models/Tournament';
import { TeamModel } from '../src/models/Team';
import { PlayerModel } from '../src/models/Player';

async function run() {
  await connectToDatabase();

  const t = await TournamentModel.findOneAndUpdate(
    { name: /Hatton Premier League 2026/i },
    { $set: { squadSize: 13 } },
    { new: true }
  ).lean() as any;

  if (!t) { console.error('Tournament not found'); process.exit(1); }
  console.log('Updated:', t.name);
  console.log('New squadSize:', t.squadSize);
  console.log('basePricePerPlayer:', t.basePricePerPlayer);

  // Show impact: remaining slots per team with new squad size
  const teams = await TeamModel.find({ tournamentId: String(t._id) }).sort({ name: 1 }).lean() as any[];
  const soldPlayers = await PlayerModel.find({ tournamentId: String(t._id), isSold: true }).lean() as any[];

  console.log('\nTeam impact (squadSize 14 → 13):');
  for (const team of teams) {
    const bought = soldPlayers.filter((p: any) => String(p.winningTeamId) === String(team._id)).length;
    const remaining = 13 - bought;
    const reserved = Math.max(0, remaining - 1) * (t.basePricePerPlayer ?? 0);
    const maxBid = remaining <= 1 ? team.currentBalance : Math.max(0, team.currentBalance - reserved);
    console.log(`  ${team.name}: bought=${bought}  remaining=${remaining}  maxBid=${maxBid.toLocaleString()}`);
  }
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
