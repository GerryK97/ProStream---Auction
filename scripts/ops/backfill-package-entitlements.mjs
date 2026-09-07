#!/usr/bin/env node
/**
 * Backfills package entitlements for tournaments that already have overlays.
 *
 * Existing customers bought overlays under the old per-overlay pricing. Under
 * the new single-package model an entitlement is what caps player counts, so
 * without this every already-running auction over 150 players would suddenly
 * refuse new players and appear to demand another payment.
 *
 * The backfilled limit is always at least the tournament's current player
 * count, rounded up to the block boundary, so nothing breaks and nobody is
 * re-billed. `pricePaid` records what was actually charged historically.
 *
 *   --dry-run   Report what would change. No writes. (default)
 *   --apply     Write the entitlements.
 */
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
if (!apply && !args.has('--dry-run')) {
  console.log('No mode given; defaulting to --dry-run.\n');
}

const INCLUDED_PLAYERS = 150;
const BLOCK_SIZE = 50;

function resolvePlayerLimit(playerCount) {
  if (!Number.isFinite(playerCount) || playerCount <= INCLUDED_PLAYERS) return INCLUDED_PLAYERS;
  return INCLUDED_PLAYERS + Math.ceil((playerCount - INCLUDED_PLAYERS) / BLOCK_SIZE) * BLOCK_SIZE;
}

const mongo = new MongoClient(process.env.MONGODB_URI, { readPreference: 'primary' });
await mongo.connect();

try {
  const db = mongo.db();

  const playerCounts = await db.collection('players').aggregate([
    { $group: { _id: '$tournamentId', players: { $sum: 1 } } },
  ]).toArray();
  const playersByTournament = new Map(playerCounts.map(r => [r._id, r.players]));

  // Any tournament that ever had an overlay generated has already paid under
  // the old model, including revoked ones: revoking did not refund.
  const sessions = await db.collection('overlaysessions').find({}, {
    projection: { tournamentId: 1, overlayType: 1, priceCharged: 1, createdBy: 1, createdAt: 1, isActive: 1 },
  }).toArray();

  const byTournament = new Map();
  for (const session of sessions) {
    if (!byTournament.has(session.tournamentId)) byTournament.set(session.tournamentId, []);
    byTournament.get(session.tournamentId).push(session);
  }

  const tournaments = await db.collection('tournaments')
    .find({ _id: { $in: [...byTournament.keys()] } }, { projection: { name: 1, status: 1, createdBy: 1, packageEntitlement: 1 } })
    .toArray();

  const planned = [];
  let skippedExisting = 0;

  for (const tournament of tournaments) {
    if (tournament.packageEntitlement) { skippedExisting += 1; continue; }

    const tournamentSessions = byTournament.get(tournament._id) ?? [];
    const players = playersByTournament.get(tournament._id) ?? 0;
    const playerLimit = resolvePlayerLimit(players);

    const pricePaid = tournamentSessions.reduce((total, s) => total + (Number(s.priceCharged) || 0), 0);
    const earliest = tournamentSessions.reduce(
      (oldest, s) => (!oldest || new Date(s.createdAt) < new Date(oldest.createdAt) ? s : oldest),
      null,
    );

    // Prefer a variant the tournament actually uses so regenerating keeps the
    // same output the operator already has configured in OBS.
    const usedTypes = new Set(tournamentSessions.map(s => s.overlayType));
    const overlayVariant = usedTypes.has('fullscreen2') && !usedTypes.has('fullscreen')
      ? 'fullscreen2'
      : 'fullscreen';

    const purchasedBy = earliest?.createdBy ?? tournament.createdBy ?? 'system-backfill';

    planned.push({
      _id: tournament._id,
      name: tournament.name,
      status: tournament.status,
      players,
      playerLimit,
      pricePaid,
      overlayVariant,
      purchasedBy,
      purchasedAt: earliest?.createdAt ? new Date(earliest.createdAt) : new Date(),
      hasActive: tournamentSessions.some(s => s.isActive),
    });
  }

  planned.sort((a, b) => b.players - a.players);

  console.log(`Tournaments with overlay history: ${byTournament.size}`);
  console.log(`Already have an entitlement (skipped): ${skippedExisting}`);
  console.log(`To backfill: ${planned.length}`);
  console.log(`Of those, over the ${INCLUDED_PLAYERS}-player base: ${planned.filter(p => p.players > INCLUDED_PLAYERS).length}\n`);

  console.table(planned.slice(0, 15).map(p => ({
    tournament: `${p.name} [${p.status}]`,
    players: p.players,
    grantedLimit: p.playerLimit,
    headroom: p.playerLimit - p.players,
    historicalPaid: p.pricePaid,
    variant: p.overlayVariant,
    live: p.hasActive,
  })));

  // Every granted limit must cover the current squad, or an existing auction
  // would immediately be over its own cap.
  const wouldBreak = planned.filter(p => p.playerLimit < p.players);
  if (wouldBreak.length > 0) {
    throw new Error(`Refusing to continue: ${wouldBreak.length} tournament(s) would be granted a limit below their current player count.`);
  }
  console.log('Safety check passed: every granted limit covers the current player count.');

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to write these entitlements.');
  } else {
    let written = 0;
    for (const p of planned) {
      const result = await db.collection('tournaments').updateOne(
        { _id: p._id, packageEntitlement: { $exists: false } },
        {
          $set: {
            packageEntitlement: {
              playerLimit: p.playerLimit,
              pricePaid: p.pricePaid,
              overlayVariant: p.overlayVariant,
              purchasedAt: p.purchasedAt,
              purchasedBy: p.purchasedBy,
              billedUserId: p.purchasedBy,
              playerCountAtPurchase: p.players,
            },
          },
        },
      );
      if (result.modifiedCount > 0) written += 1;
    }
    console.log(`\nBackfill complete. Entitlements written: ${written}.`);
  }
} finally {
  await mongo.close();
}
