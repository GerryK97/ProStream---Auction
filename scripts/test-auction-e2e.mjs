/**
 * test-auction-e2e.mjs
 *
 * End-to-end test of the auction bidding and sold operations, driving the real
 * HTTP API exactly the way the Expo app does (same routes, same payloads, same
 * Bearer auth via /api/auth/login).
 *
 * Everything is created fresh and torn down at the end:
 *   - one disposable Admin user
 *   - one disposable tournament, 3 teams, 4 players
 * Nothing touches existing tournaments.
 *
 * Run against a local server:
 *   cd ProStream---Auction && npm run dev
 *   node scripts/test-auction-e2e.mjs
 *
 * Or against another origin:
 *   AUCTION_API_BASE_URL=https://auction.prostream.lk node scripts/test-auction-e2e.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  for (const file of ['../.env.local', '../.env']) {
    try {
      const raw = readFileSync(resolve(__dirname, file), 'utf-8');
      for (const line of raw.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const idx = t.indexOf('=');
        if (idx < 0) continue;
        const k = t.slice(0, idx).trim();
        const v = t.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[k]) process.env[k] = v;
      }
    } catch {}
  }
}
loadEnv();

const BASE = (process.env.AUCTION_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const STAMP = Date.now();
const TID = `e2e-${STAMP}`;
const USERNAME = `e2e_bot_${STAMP}`;
const PASSWORD = `E2e!${STAMP}aB`;

let passed = 0, failed = 0;
const results = [];
function check(name, cond, detail = '') {
  if (cond) { passed++; results.push(['ok', name, '']); console.log(`  ok    ${name}`); }
  else { failed++; results.push(['FAIL', name, detail]); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
}

let token = null;
async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

const mongo = new MongoClient(process.env.MONGODB_URI);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });

async function seed() {
  await mongo.connect();
  const db = mongo.db();

  // Disposable Admin user in Neon (shared users table).
  const hash = await bcrypt.hash(PASSWORD, 10);
  const userId = `e2e_${STAMP}`;
  await pool.query(
    `INSERT INTO public.users (id, username, email, password_hash, display_name, role, status)
     VALUES ($1,$2,$3,$4,$5,'Admin','Active')`,
    [userId, USERNAME, `${USERNAME}@e2e.local`, hash, 'E2E Bot'],
  );

  // Tournament: simple flat base price so the maths is easy to assert.
  await db.collection('tournaments').insertOne({
    _id: TID,
    name: `E2E Auction ${STAMP}`,
    year: 2026,
    sport: 'cricket',
    status: 'Live',
    squadSize: 3,
    basePricePerPlayer: 1000,
    basePriceStrategy: 'tournament-level',
    usePlayerClasses: false,
    biddingMode: 'team',
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 3 teams. TeamC is deliberately poor to exercise the affordability guard.
  const teams = [
    { _id: `${TID}-teamA`, name: 'Team Alpha', shortCode: 'ALP', initialBudget: 100000, currentBalance: 100000 },
    { _id: `${TID}-teamB`, name: 'Team Bravo', shortCode: 'BRV', initialBudget: 100000, currentBalance: 100000 },
    { _id: `${TID}-teamC`, name: 'Team Cheap', shortCode: 'CHP', initialBudget: 3000,  currentBalance: 3000  },
  ].map(t => ({ ...t, tournamentId: TID, playersPurchased: [], createdBy: userId, createdAt: new Date(), updatedAt: new Date() }));
  await db.collection('teams').insertMany(teams);

  const players = ['P1', 'P2', 'P3', 'P4'].map((n, i) => ({
    _id: `${TID}-p${i + 1}`,
    tournamentId: TID,
    playerNo: String(i + 1).padStart(3, '0'),
    name: `E2E Player ${n}`,
    position: 'Batsman',
    isSold: false,
    isUnsold: false,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  await db.collection('players').insertMany(players);

  await db.collection('auctionstates').insertOne({
    _id: `${TID}-state`,
    tournamentId: TID,
    currentPlayerId: null,
    currentBid: 0,
    winningTeamId: null,
    currentAuctionStatus: 'Pending',
    history: [],
    completedClasses: [],
    revision: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { userId, teams, players };
}

async function cleanup(userId) {
  try {
    const db = mongo.db();
    await Promise.all([
      db.collection('tournaments').deleteOne({ _id: TID }),
      db.collection('teams').deleteMany({ tournamentId: TID }),
      db.collection('players').deleteMany({ tournamentId: TID }),
      db.collection('auctionstates').deleteMany({ tournamentId: TID }),
    ]);
    await pool.query('DELETE FROM public.users WHERE id = $1', [userId]);
  } catch (e) {
    console.error('  cleanup warning:', e.message);
  } finally {
    await mongo.close().catch(() => {});
    await pool.end().catch(() => {});
  }
}

async function main() {
  console.log(`\nAuction bidding & sold E2E — ${BASE}\n`);
  const { userId, teams, players } = await seed();
  const [teamA, teamB, teamC] = teams;

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    console.log('Auth');
    const login = await call('POST', '/api/auth/login', { username: USERNAME, password: PASSWORD });
    token = login.data?.token;
    check('login returns a bearer token', login.status === 200 && !!token, `status=${login.status}`);
    if (!token) throw new Error('cannot continue without a token');

    // ── Bootstrap (what the app loads on open) ────────────────────────────────
    console.log('\nBootstrap');
    const boot = await call('GET', `/api/auction/live?tournamentId=${TID}`);
    check('live bootstrap returns 200', boot.status === 200, `status=${boot.status}`);
    check('bootstrap carries all 3 teams', (boot.data?.teams?.length ?? 0) === 3);
    // The app loads players from /api/players (live is a light bootstrap that
    // only carries the current player).
    const bootPlayers = await call('GET', `/api/players?tournamentId=${TID}`);
    check('players endpoint returns all 4', (bootPlayers.data?.length ?? 0) === 4,
      `got ${bootPlayers.data?.length}`);

    // ── Select a player ───────────────────────────────────────────────────────
    console.log('\nSelect player');
    const sel = await call('POST', '/api/auction/select-player', { tournamentId: TID, playerId: players[0]._id });
    check('select-player succeeds', sel.status === 200, `status=${sel.status} ${JSON.stringify(sel.data)}`);
    check('state points at the selected player', sel.data?.auctionState?.currentPlayerId === players[0]._id);
    check('bid resets to 0 on selection', sel.data?.auctionState?.currentBid === 0);

    // ── Bid validation ────────────────────────────────────────────────────────
    console.log('\nBid validation');
    const belowBase = await call('POST', '/api/auction/bid', { tournamentId: TID, teamId: teamA._id, amount: 500 });
    check('first bid below base price is rejected', belowBase.status === 400, `status=${belowBase.status}`);

    const zero = await call('POST', '/api/auction/bid', { tournamentId: TID, teamId: teamA._id, amount: 0 });
    check('zero bid is rejected', zero.status === 400, `status=${zero.status}`);

    const negative = await call('POST', '/api/auction/bid', { tournamentId: TID, teamId: teamA._id, amount: -5000 });
    check('negative bid is rejected', negative.status === 400, `status=${negative.status}`);

    // ── Valid bidding sequence ────────────────────────────────────────────────
    console.log('\nBidding');
    const bid1 = await call('POST', '/api/auction/bid', { tournamentId: TID, teamId: teamA._id, amount: 1000 });
    check('first bid at base price accepted', bid1.status === 200, `status=${bid1.status} ${JSON.stringify(bid1.data)}`);
    check('currentBid = 1000', bid1.data?.currentBid === 1000, `got ${bid1.data?.currentBid}`);
    check('winning team = Alpha', bid1.data?.winningTeamId === teamA._id);
    check('status flips to Bidding', bid1.data?.currentAuctionStatus === 'Bidding');

    const same = await call('POST', '/api/auction/bid', { tournamentId: TID, teamId: teamB._id, amount: 1000 });
    check('equal bid is rejected (must exceed)', same.status === 400, `status=${same.status}`);

    const lower = await call('POST', '/api/auction/bid', { tournamentId: TID, teamId: teamB._id, amount: 900 });
    check('lower bid is rejected', lower.status === 400, `status=${lower.status}`);

    const bid2 = await call('POST', '/api/auction/bid', { tournamentId: TID, teamId: teamB._id, amount: 2500 });
    check('higher counter-bid accepted', bid2.status === 200, `status=${bid2.status}`);
    check('currentBid = 2500', bid2.data?.currentBid === 2500);
    check('lead moves to Bravo', bid2.data?.winningTeamId === teamB._id);

    // ── Affordability guard ───────────────────────────────────────────────────
    // TeamCheap has 3000 and squadSize 3, so reserve for 2 more slots at base
    // 1000 leaves maxBid = 3000 - 2000 = 1000. A 2600 bid must be refused.
    console.log('\nAffordability');
    const tooRich = await call('POST', '/api/auction/bid', { tournamentId: TID, teamId: teamC._id, amount: 2600 });
    check('bid beyond team budget is rejected', tooRich.status === 400, `status=${tooRich.status}`);
    check('rejection explains the max affordable bid',
      /maximum affordable/i.test(tooRich.data?.error ?? ''), tooRich.data?.error);

    // ── Concurrency (two bids racing on the same amount) ──────────────────────
    console.log('\nConcurrency');
    const [r1, r2] = await Promise.all([
      call('POST', '/api/auction/bid', { tournamentId: TID, teamId: teamA._id, amount: 4000 }),
      call('POST', '/api/auction/bid', { tournamentId: TID, teamId: teamB._id, amount: 4000 }),
    ]);
    const oks = [r1, r2].filter(r => r.status === 200).length;
    check('exactly one of two racing equal bids wins', oks === 1, `statuses=${r1.status},${r2.status}`);
    check('the loser gets a clean 4xx (not a 500)',
      [r1, r2].every(r => r.status === 200 || (r.status >= 400 && r.status < 500)),
      `statuses=${r1.status},${r2.status}`);

    const afterRace = await call('GET', `/api/auction/state/${TID}`);
    check('state is consistent after the race', afterRace.data?.currentBid === 4000, `got ${afterRace.data?.currentBid}`);

    // ── Bid correction ────────────────────────────────────────────────────────
    console.log('\nBid correction');
    // Regression guard: in team-bidding mode the server requires teamId. The
    // clients must send the current leader, which is what resolveLeadingTeamId
    // now supplies in the Expo panel.
    const noTeam = await call('POST', '/api/auction/bid/correct', { tournamentId: TID, amount: 3500 });
    check('server still requires teamId in team mode (documents the contract)',
      noTeam.status === 400, `status=${noTeam.status}`);

    const leadNow = (await call('GET', `/api/auction/state/${TID}`)).data?.winningTeamId;
    const corrected = await call('POST', '/api/auction/bid/correct',
      { tournamentId: TID, amount: 3500, teamId: leadNow });
    check('correction with teamId succeeds', corrected.status === 200,
      `status=${corrected.status} ${JSON.stringify(corrected.data)}`);
    check('currentBid corrected to 3500', corrected.data?.currentBid === 3500, `got ${corrected.data?.currentBid}`);

    // ── Sell ──────────────────────────────────────────────────────────────────
    console.log('\nSell');
    // Take the leader from authoritative state, not from the correction
    // response, so a correction that does not return the team cannot break this.
    const stateBeforeSell = (await call('GET', `/api/auction/state/${TID}`)).data;
    const leaderId = stateBeforeSell?.winningTeamId;
    check('a winning team is set before selling', !!leaderId, `got ${leaderId}`);
    const preTeam = (await call('GET', `/api/teams?tournamentId=${TID}`)).data?.find(t => t._id === leaderId);
    const preBalance = preTeam?.currentBalance ?? 0;

    const sold = await call('POST', '/api/auction/sell', { tournamentId: TID, teamId: leaderId });
    check('sell succeeds', sold.status === 200, `status=${sold.status} ${JSON.stringify(sold.data)}`);

    const afterPlayers = (await call('GET', `/api/players?tournamentId=${TID}`)).data ?? [];
    const afterTeams = (await call('GET', `/api/teams?tournamentId=${TID}`)).data ?? [];
    const soldPlayer = afterPlayers.find(p => p._id === players[0]._id);
    check('player marked sold', soldPlayer?.isSold === true);
    check('final price recorded as 3500', soldPlayer?.finalPrice === 3500, `got ${soldPlayer?.finalPrice}`);
    check('winning team recorded', soldPlayer?.winningTeamId === leaderId);

    const postTeam = afterTeams.find(t => t._id === leaderId);
    check('team balance debited by exactly the sale price',
      postTeam?.currentBalance === preBalance - 3500,
      `before=${preBalance} after=${postTeam?.currentBalance}`);
    check('player added to the squad',
      (postTeam?.playersPurchased ?? []).includes(players[0]._id));

    // ── Double-sell protection ────────────────────────────────────────────────
    console.log('\nDouble-sell protection');
    const resell = await call('POST', '/api/auction/sell', { tournamentId: TID, teamId: leaderId });
    check('selling the same player twice is refused', resell.status >= 400, `status=${resell.status}`);

    const teamsAfterResell = (await call('GET', `/api/teams?tournamentId=${TID}`)).data;
    const leaderAfter = teamsAfterResell?.find(t => t._id === leaderId);
    check('balance not double-debited',
      leaderAfter?.currentBalance === preBalance - 3500,
      `got ${leaderAfter?.currentBalance}`);

    // ── Bidding on a sold player ──────────────────────────────────────────────
    const bidOnSold = await call('POST', '/api/auction/bid', { tournamentId: TID, teamId: teamA._id, amount: 9000 });
    check('bidding after sale is refused', bidOnSold.status >= 400, `status=${bidOnSold.status}`);

    // ── Mark unsold ───────────────────────────────────────────────────────────
    console.log('\nMark unsold');
    await call('POST', '/api/auction/select-player', { tournamentId: TID, playerId: players[1]._id });
    const unsold = await call('POST', '/api/auction/mark-unsold', { tournamentId: TID });
    check('mark-unsold succeeds', unsold.status === 200, `status=${unsold.status}`);
    const unsoldPlayers = (await call('GET', `/api/players?tournamentId=${TID}`)).data ?? [];
    const afterUnsold = await call('GET', `/api/auction/live?tournamentId=${TID}`);
    const up = unsoldPlayers.find(p => p._id === players[1]._id);
    check('player flagged unsold', up?.isUnsold === true);
    check('player not flagged sold', up?.isSold !== true);
    check('board cleared after unsold', !afterUnsold.data?.auctionState?.currentPlayerId);

    // ── Undo a sale ───────────────────────────────────────────────────────────
    console.log('\nUndo');
    const undo = await call('POST', '/api/auction/undo', { tournamentId: TID });
    check('undo succeeds', undo.status === 200, `status=${undo.status} ${JSON.stringify(undo.data)}`);

    const undoPlayers = (await call('GET', `/api/players?tournamentId=${TID}`)).data ?? [];
    const undonePlayer = undoPlayers.find(p => p._id === players[1]._id);
    check('most recent action (unsold) was reverted', undonePlayer?.isUnsold !== true,
      `isUnsold=${undonePlayer?.isUnsold}`);

    // ── Final integrity ─────────────────────────��─────────────────────────────
    console.log('\nFinal integrity');
    const finalTeams = (await call('GET', `/api/teams?tournamentId=${TID}`)).data ?? [];
    const finalPlayers = (await call('GET', `/api/players?tournamentId=${TID}`)).data ?? [];
    const spend = finalPlayers.filter(p => p.isSold).reduce((s, p) => s + (p.finalPrice ?? 0), 0);
    const debited = finalTeams.reduce((s, t) => s + ((t.initialBudget ?? 0) - (t.currentBalance ?? 0)), 0);
    check('total debited equals total sale value', spend === debited, `spend=${spend} debited=${debited}`);
    check('no team balance went negative', finalTeams.every(t => (t.currentBalance ?? 0) >= 0));
    check('squad sizes within limit', finalTeams.every(t => (t.playersPurchased?.length ?? 0) <= 3));

  } finally {
    await cleanup(userId);
  }

  console.log(`\n${'─'.repeat(58)}`);
  console.log(`${passed} passed, ${failed} failed`);
  if (failed) {
    console.log('\nFailures:');
    results.filter(r => r[0] === 'FAIL').forEach(r => console.log(`  • ${r[1]}${r[2] ? ` — ${r[2]}` : ''}`));
  }
  console.log('');
  process.exit(failed ? 1 : 0);
}

main().catch(async (err) => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
