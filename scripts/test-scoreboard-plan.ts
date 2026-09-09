/**
 * Tests for the Auction → Scoreboard transfer planner.
 * Run: npm run test:scoreboard-plan
 */

import { strict as assert } from 'node:assert';
import { buildTransferPlan } from '../src/lib/transfer/scoreboardTransferPlan';
import type { Player, Team, Tournament } from '../src/types';

let passed = 0;
const check = (name: string, fn: () => void) => {
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (err) { console.error(`  FAIL ${name}`); throw err; }
};

const tournament = (over: Partial<Tournament> = {}): Tournament => ({
  _id: 't1',
  name: 'Talawakelle Premier League 2026',
  sport: 'cricket',
  squadSize: 11,
  status: 'Completed',
  ...over,
} as Tournament);

const team = (id: string, name: string, over: Partial<Team> = {}): Team => ({
  _id: id,
  tournamentId: 't1',
  name,
  shortCode: name.slice(0, 3).toUpperCase(),
  ...over,
} as Team);

const player = (id: string, name: string, over: Partial<Player> = {}): Player => ({
  _id: id,
  tournamentId: 't1',
  name,
  isSold: true,
  isUnsold: false,
  ...over,
} as Player);

console.log('\nHappy path');
check('builds teams with their squads', () => {
  const { plan, blockers } = buildTransferPlan(
    tournament(),
    [team('a', 'Alpha'), team('b', 'Bravo')],
    [
      player('p1', 'Kusal Mendis', { winningTeamId: 'a', position: 'Batsman' }),
      player('p2', 'Nuwan Pradeep', { winningTeamId: 'a', position: 'Bowler' }),
      player('p3', 'Angelo Mathews', { winningTeamId: 'b', position: 'All-rounder' }),
    ],
  );
  assert.equal(blockers.length, 0);
  assert.equal(plan.totals.teams, 2);
  assert.equal(plan.totals.players, 3);
  const alpha = plan.teams.find(t => t.name === 'Alpha')!;
  assert.equal(alpha.players.length, 2);
  assert.equal(alpha.players[0].role, 'batsman');
});

check('tournament defaults are a basic cricket tournament', () => {
  const { plan } = buildTransferPlan(tournament(), [team('a', 'Alpha')],
    [player('p1', 'X Y', { winningTeamId: 'a' })]);
  assert.equal(plan.tournament.format, 'T20');
  assert.equal(plan.tournament.cricketMode, 'professional');
  assert.equal(plan.tournament.statsMode, 'basic');
  assert.equal(plan.tournament.ballType, 'tennis');
  assert.equal(plan.tournament.status, 'upcoming');
});

check('long tournament name shortened within varchar(20)', () => {
  const { plan } = buildTransferPlan(tournament(), [team('a', 'A')],
    [player('p1', 'X Y', { winningTeamId: 'a' })]);
  assert.ok(plan.tournament.shortName.length <= 20, plan.tournament.shortName);
  assert.equal(plan.tournament.name, 'Talawakelle Premier League 2026');
});

console.log('\nUnsold players are dropped');
check('unsold and available players skipped with reasons', () => {
  const { plan } = buildTransferPlan(
    tournament(),
    [team('a', 'Alpha')],
    [
      player('p1', 'Sold Guy', { winningTeamId: 'a' }),
      player('p2', 'Unsold Guy', { isSold: false, isUnsold: true }),
      player('p3', 'Available Guy', { isSold: false, isUnsold: false }),
    ],
  );
  assert.equal(plan.totals.players, 1);
  assert.equal(plan.totals.skipped, 2);
  const reasons = plan.skippedPlayers.map(s => s.reason);
  assert.ok(reasons.some(r => r.includes('Unsold')));
  assert.ok(reasons.some(r => r.includes('Never sold')));
});

check('sold player without a team is skipped, not crashed on', () => {
  const { plan } = buildTransferPlan(tournament(), [team('a', 'Alpha')],
    [player('p1', 'Orphan', { winningTeamId: undefined })]);
  assert.equal(plan.totals.players, 0);
  assert.ok(plan.skippedPlayers[0].reason.includes('no winning team'));
});

check('unnamed player skipped (display_name is NOT NULL)', () => {
  const { plan } = buildTransferPlan(tournament(), [team('a', 'Alpha')],
    [player('p1', '   ', { winningTeamId: 'a' })]);
  assert.equal(plan.totals.players, 0);
  assert.ok(plan.skippedPlayers[0].reason.includes('no name'));
});

console.log('\nWarnings surface downgrades before writing');
check('inexact bowling style produces a warning', () => {
  const { plan } = buildTransferPlan(tournament(), [team('a', 'Alpha')],
    [player('p1', 'Medium Fast Guy', { winningTeamId: 'a', bowlingStyle: 'Right-arm Medium-fast' })]);
  const w = plan.warnings.find(w => w.field === 'Bowling style');
  assert.ok(w, 'expected a bowling-style warning');
  assert.equal(w!.subject, 'Medium Fast Guy');
  assert.ok(w!.note.includes('no Scoreboard equivalent'));
});

check('short-code truncation produces a warning', () => {
  const { plan } = buildTransferPlan(tournament(),
    [team('a', 'Alpha', { shortCode: 'ALPHAX' })],
    [player('p1', 'X Y', { winningTeamId: 'a' })]);
  const w = plan.warnings.find(w => w.field === 'Short code');
  assert.ok(w);
  assert.ok(w!.note.includes('truncated'));
});

check('duplicate short codes resolved and warned', () => {
  const { plan } = buildTransferPlan(tournament(),
    [team('a', 'Kandy A', { shortCode: 'KAN' }), team('b', 'Kandy B', { shortCode: 'KAN' })],
    [player('p1', 'X Y', { winningTeamId: 'a' }), player('p2', 'A B', { winningTeamId: 'b' })]);
  const codes = plan.teams.map(t => t.shortCode);
  assert.equal(new Set(codes).size, 2, `codes collided: ${codes}`);
  assert.ok(plan.warnings.some(w => w.note.includes('already used')));
});

check('empty squad warns but does not block', () => {
  const { plan, blockers } = buildTransferPlan(tournament(),
    [team('a', 'Alpha'), team('b', 'Empty')],
    [player('p1', 'X Y', { winningTeamId: 'a' })]);
  assert.equal(blockers.length, 0);
  assert.ok(plan.warnings.some(w => w.subject === 'Empty' && w.field === 'Squad'));
});

console.log('\nBlockers stop invalid transfers');
check('non-cricket sport is blocked', () => {
  const { blockers } = buildTransferPlan(tournament({ sport: 'football' }),
    [team('a', 'Alpha')], [player('p1', 'X Y', { winningTeamId: 'a' })]);
  assert.ok(blockers.some(b => b.code === 'NOT_CRICKET'));
});

check('no teams is blocked', () => {
  const { blockers } = buildTransferPlan(tournament(), [], []);
  assert.ok(blockers.some(b => b.code === 'NO_TEAMS'));
});

check('no sold players is blocked', () => {
  const { blockers } = buildTransferPlan(tournament(), [team('a', 'Alpha')],
    [player('p1', 'Unsold', { isSold: false, isUnsold: true })]);
  assert.ok(blockers.some(b => b.code === 'NO_SOLD_PLAYERS'));
});

check('missing sport defaults to cricket (not blocked)', () => {
  const { blockers } = buildTransferPlan(tournament({ sport: undefined }),
    [team('a', 'Alpha')], [player('p1', 'X Y', { winningTeamId: 'a' })]);
  assert.equal(blockers.length, 0);
});

console.log('\nImages carry across without re-upload');
check('player photo and team logo normalised to public_ids', () => {
  const { plan } = buildTransferPlan(tournament(),
    [team('a', 'Alpha', { logoURL: 'https://res.cloudinary.com/diitsd6nz/image/upload/v123/prostream-auction/logos/alpha.png' })],
    [player('p1', 'X Y', {
      winningTeamId: 'a',
      photoURL: 'https://res.cloudinary.com/diitsd6nz/image/upload/c_fill,w_400/v9/prostream-auction/players/xy.jpg',
    })]);
  assert.equal(plan.teams[0].logoCloudinaryId, 'prostream-auction/logos/alpha');
  assert.equal(plan.teams[0].players[0].headshotCloudinaryId, 'prostream-auction/players/xy');
});

check('falls back to secondary image when photoURL missing', () => {
  const { plan } = buildTransferPlan(tournament(), [team('a', 'Alpha')],
    [player('p1', 'X Y', { winningTeamId: 'a', secondaryImageURL: 'prostream-auction/players/secondary' })]);
  assert.equal(plan.teams[0].players[0].headshotCloudinaryId, 'prostream-auction/players/secondary');
});

check('missing images are null, not empty strings', () => {
  const { plan } = buildTransferPlan(tournament(), [team('a', 'Alpha')],
    [player('p1', 'X Y', { winningTeamId: 'a' })]);
  assert.equal(plan.teams[0].logoCloudinaryId, null);
  assert.equal(plan.teams[0].players[0].headshotCloudinaryId, null);
});

console.log('\nDeterminism');
check('same input produces identical plan', () => {
  const t = tournament();
  const teams = [team('b', 'Bravo', { shortCode: 'XYZ' }), team('a', 'Alpha', { shortCode: 'XYZ' })];
  const players = [player('p1', 'One Man', { winningTeamId: 'a' }), player('p2', 'Two Man', { winningTeamId: 'b' })];
  const first = JSON.stringify(buildTransferPlan(t, teams, players).plan);
  const second = JSON.stringify(buildTransferPlan(t, teams, players).plan);
  assert.equal(first, second);
});

console.log(`\n${passed} assertions passed.\n`);
