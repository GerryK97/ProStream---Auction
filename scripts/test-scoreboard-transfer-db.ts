/**
 * Integration test for the Auction → Scoreboard transfer write path.
 *
 * Runs against the REAL database but writes only inside a transaction that is
 * always ROLLED BACK, so nothing is persisted. This is the only way to prove
 * the enum values, NOT NULL columns and char(3) constraints actually accept our
 * mapped output - a pure unit test cannot catch a schema mismatch.
 *
 * Run: npm run test:scoreboard-transfer-db
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import { strict as assert } from 'node:assert';
import { buildTransferPlan } from '../src/lib/transfer/scoreboardTransferPlan';

config({ path: '.env.local' });
config({ path: '.env' });

let passed = 0;
const check = (name: string, fn: () => void) => {
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (err) { console.error(`  FAIL ${name}`); throw err; }
};

// A deliberately awkward auction: long name, 6-char and colliding short codes,
// unmappable bowling styles, missing data, unsold players.
const tournament = {
  _id: 'test-auction-1',
  name: 'Talawakelle Premier League 2026',
  sport: 'cricket',
  logoURL: 'https://res.cloudinary.com/diitsd6nz/image/upload/v1/prostream-auction/logos/tpl.png',
} as any;

const teams = [
  { _id: 'team-a', name: 'Kandy Warriors', shortCode: 'KANDYX',
    logoURL: 'https://res.cloudinary.com/diitsd6nz/image/upload/c_fill,w_200/v9/prostream-auction/logos/kandy.png' },
  { _id: 'team-b', name: 'Kandy Kings', shortCode: 'KAN' },
  { _id: 'team-c', name: 'Colombo Lions', shortCode: 'COL' },
] as any[];

const players = [
  { _id: 'p1', name: 'Kumar Chokshanada Sangakkara', isSold: true, winningTeamId: 'team-a',
    position: 'Wicket Keeper Batsman', battingStyle: 'Left-handed',
    photoURL: 'https://res.cloudinary.com/diitsd6nz/image/upload/c_fill,w_400/v9/prostream-auction/players/kumar.jpg' },
  { _id: 'p2', name: 'Nuwan Pradeep', isSold: true, winningTeamId: 'team-a',
    position: 'Bowler', bowlingStyle: 'Right-arm Medium-fast' },      // no exact target
  { _id: 'p3', name: 'Rangana Herath', isSold: true, winningTeamId: 'team-b',
    position: 'Bowler', battingStyle: 'Left-handed', bowlingStyle: 'Left-arm Orthodox' },
  { _id: 'p4', name: 'Wanindu Hasaranga', isSold: true, winningTeamId: 'team-b',
    position: 'Bowling All-rounder', bowlingStyle: 'Leg-spin' },      // arm assumed
  { _id: 'p5', name: 'Unsold Fellow', isSold: false, isUnsold: true, position: 'Batsman' },
  { _id: 'p6', name: 'Minimal Guy', isSold: true, winningTeamId: 'team-c' }, // no styles at all
] as any[];

async function main() {
  const { plan, blockers } = buildTransferPlan(tournament, teams, players);

  console.log('\nPlan sanity');
  check('no blockers for a valid cricket auction', () => assert.equal(blockers.length, 0));
  check('unsold player excluded', () => {
    assert.equal(plan.totals.players, 5);
    assert.ok(plan.skippedPlayers.some(s => s.name === 'Unsold Fellow'));
  });
  check('adjustments reported', () => {
    // Short code KANDYX is truncated; the keeper-batsman position is narrowed.
    assert.ok(plan.warnings.some(w => w.note.includes('truncated')));
    assert.ok(plan.warnings.some(w => w.field === 'Position'));
    // Styles are out of scope, so they must not appear as warnings at all.
    assert.equal(plan.warnings.filter(w => /batting|bowling/i.test(w.field)).length, 0);
  });
  check('short codes unique and 3 chars', () => {
    const codes = plan.teams.map(t => t.shortCode);
    assert.equal(new Set(codes).size, codes.length, `collision: ${codes}`);
    codes.forEach(c => assert.equal(c.length, 3));
  });

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10_000,
    application_name: 'prostream-auction-transfer-test',
  });
  const client = await pool.connect();

  try {
    console.log('\nReal database write (rolled back)');
    await client.query('BEGIN');

    const t = plan.tournament;
    const { rows: tRows } = await client.query(
      `INSERT INTO public.tournaments
         (name, short_name, status, tournament_model, format, cricket_mode,
          total_overs, balls_per_over, max_wickets, ball_type, discipline,
          stats_mode, logo_cloudinary_id, created_by)
       VALUES ($1,$2,$3,'league',$4,$5,$6,6,10,$7,$8,$9,$10,NULL)
       RETURNING id, short_name`,
      [t.name, t.shortName, t.status, t.format, t.cricketMode, t.totalOvers,
       t.ballType, t.discipline, t.statsMode, t.logoCloudinaryId],
    );
    const tournamentId = tRows[0].id;
    check('tournament row accepted by live schema', () => {
      assert.ok(Number.isInteger(tournamentId));
      assert.ok(tRows[0].short_name.length <= 20);
    });

    let teamCount = 0;
    let playerCount = 0;

    for (const team of plan.teams) {
      const { rows: teamRows } = await client.query(
        `INSERT INTO public.teams (tournament_id, name, short_code, logo_cloudinary_id)
         VALUES ($1,$2,$3,$4) RETURNING id, short_code`,
        [tournamentId, team.name, team.shortCode, team.logoCloudinaryId],
      );
      teamCount++;

      for (const p of team.players) {
        await client.query(
          `INSERT INTO public.players
             (team_id, name, display_name, role, position, headshot_cloudinary_id)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [teamRows[0].id, p.name, p.displayName, p.role, p.position,
           p.headshotCloudinaryId],
        );
        playerCount++;
      }
    }

    check('all teams inserted', () => assert.equal(teamCount, 3));
    check('all sold players inserted', () => assert.equal(playerCount, 5));

    // Read back through the real relations to confirm the squads are intact.
    const { rows: readback } = await client.query(
      `SELECT t.name AS team, t.short_code, p.display_name, p.role, p.position,
              p.batting_style, p.bowling_style, p.headshot_cloudinary_id
         FROM public.teams t
         LEFT JOIN public.players p ON p.team_id = t.id
        WHERE t.tournament_id = $1
        ORDER BY t.name, p.display_name`,
      [tournamentId],
    );

    check('squads read back correctly', () => {
      const rows = readback.filter(r => r.display_name);
      assert.equal(rows.length, 5);
      const keeper = rows.find(r => r.display_name === 'K Sangakkara');
      assert.ok(keeper, 'expected abbreviated display name');
      assert.equal(keeper.role, 'keeper');
      assert.equal(keeper.headshot_cloudinary_id, 'prostream-auction/players/kumar');
    });

    check('position text preserved alongside the mapped role', () => {
      const r = readback.find(r => (r.display_name ?? '').includes('Hasaranga'));
      assert.ok(r);
      assert.equal(r.role, 'allrounder');
      assert.equal(r.position, 'Bowling All-rounder');
    });

    check('batting/bowling NOT written - columns fall back to defaults', () => {
      const rows = readback.filter(r => r.display_name);
      // batting_style defaults to 'right-hand'; bowling_style has no default.
      for (const r of rows) {
        assert.equal(r.batting_style, 'right-hand', `${r.display_name} batting_style`);
        assert.equal(r.bowling_style, null, `${r.display_name} bowling_style`);
      }
    });

    check('player with only a name still inserts', () => {
      const r = readback.find(r => (r.display_name ?? '').includes('Minimal'));
      assert.ok(r);
      assert.equal(r.role, 'batsman');
    });

    // Bookkeeping table round-trip.
    await client.query('CREATE SCHEMA IF NOT EXISTS auction');
    await client.query(`
      CREATE TABLE IF NOT EXISTS auction.scoreboard_transfer (
        id serial PRIMARY KEY,
        auction_tournament_id text NOT NULL,
        scoreboard_tournament_id integer NOT NULL,
        entity_type text NOT NULL,
        auction_entity_id text NOT NULL,
        scoreboard_entity_id integer NOT NULL,
        transferred_at timestamp NOT NULL DEFAULT now(),
        transferred_by text,
        CONSTRAINT scoreboard_transfer_entity_type_check
          CHECK (entity_type IN ('tournament','team','player'))
      )`);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS scoreboard_transfer_entity_idx
        ON auction.scoreboard_transfer (entity_type, auction_entity_id, scoreboard_tournament_id)`);

    await client.query(
      `INSERT INTO auction.scoreboard_transfer
         (auction_tournament_id, scoreboard_tournament_id, entity_type, auction_entity_id, scoreboard_entity_id)
       VALUES ($1,$2,'tournament',$1,$2)`,
      [tournament._id, tournamentId],
    );
    const dupe = await client.query(
      `INSERT INTO auction.scoreboard_transfer
         (auction_tournament_id, scoreboard_tournament_id, entity_type, auction_entity_id, scoreboard_entity_id)
       VALUES ($1,$2,'tournament',$1,$2)
       ON CONFLICT (entity_type, auction_entity_id, scoreboard_tournament_id)
       DO UPDATE SET transferred_at = now()
       RETURNING id`,
      [tournament._id, tournamentId],
    );
    check('mapping upsert is idempotent (no duplicate row)', () => {
      assert.equal(dupe.rows.length, 1);
    });
    const { rows: countRows } = await client.query(
      `SELECT count(*)::int AS n FROM auction.scoreboard_transfer WHERE auction_tournament_id = $1`,
      [tournament._id],
    );
    check('exactly one mapping row after re-insert', () => assert.equal(countRows[0].n, 1));

    await client.query('ROLLBACK');
    console.log('\n  (transaction rolled back - database unchanged)');

    // Prove the rollback worked.
    const { rows: after } = await client.query(
      `SELECT count(*)::int AS n FROM public.tournaments WHERE id = $1`, [tournamentId],
    );
    check('rollback left no trace', () => assert.equal(after[0].n, 0));

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`\n${passed} assertions passed.\n`);
}

main().catch(err => { console.error('\n', err); process.exit(1); });
