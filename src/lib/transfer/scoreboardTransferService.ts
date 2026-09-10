/**
 * scoreboardTransferService.ts
 *
 * Executes an Auction → Scoreboard transfer.
 *
 * The Auction and Scoreboard apps share one Neon database (verified: identical
 * DATABASE_URL host in both repos), so this writes the Scoreboard's `public`
 * tables directly instead of going over HTTP. Everything happens inside ONE
 * transaction: a half-written tournament with three of eight squads would be
 * worse than no transfer at all.
 *
 * Reads come from MongoDB (Auction data still lives there); writes go to
 * Postgres. The plan is built by the pure `buildTransferPlan`, so what the
 * operator approves in the preview is exactly what is inserted.
 */

import { Pool, type PoolClient } from 'pg';
import type { TransferPlan } from './scoreboardTransferPlan';

const globalForTransfer = globalThis as typeof globalThis & {
  prostreamTransferPool?: Pool;
};

function getPool(): Pool {
  // Read DATABASE_URL lazily, not at module scope. Reading it at import time
  // makes the module throw for any importer loaded before the environment is
  // populated, which would take down the preview route as well.
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required for the Scoreboard transfer');
  const pool = globalForTransfer.prostreamTransferPool ?? new Pool({
    connectionString,
    application_name: 'prostream-auction-transfer',
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  globalForTransfer.prostreamTransferPool = pool;
  return pool;
}

export interface ExistingTransfer {
  scoreboardTournamentId: number;
  transferredAt: Date;
  transferredBy: string | null;
}

export interface TransferResult {
  scoreboardTournamentId: number;
  teamsCreated: number;
  playersCreated: number;
}

/**
 * Has this auction already been transferred? Used to warn before creating a
 * second Scoreboard tournament for the same auction.
 */
export async function findExistingTransfers(
  auctionTournamentId: string,
): Promise<ExistingTransfer[]> {
  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `SELECT scoreboard_tournament_id, transferred_at, transferred_by
         FROM auction.scoreboard_transfer
        WHERE auction_tournament_id = $1 AND entity_type = 'tournament'
        ORDER BY transferred_at DESC`,
      [auctionTournamentId],
    );
    return rows.map(r => ({
      scoreboardTournamentId: r.scoreboard_tournament_id,
      transferredAt: r.transferred_at,
      transferredBy: r.transferred_by,
    }));
  } catch (err: unknown) {
    // The bookkeeping table may not exist yet (migration not run). That must
    // not break the preview, so report "no previous transfers" instead.
    if (isUndefinedTableError(err)) return [];
    throw err;
  }
}

function isUndefinedTableError(err: unknown): boolean {
  // 42P01 undefined_table, 3F000 invalid_schema_name
  const code = (err as { code?: string })?.code;
  return code === '42P01' || code === '3F000';
}

/**
 * Write the plan to the Scoreboard in a single transaction.
 *
 * Creates a fresh tournament every time (per product decision), then its teams,
 * then each team's squad, recording an id mapping row for every entity.
 */
export async function executeTransfer(
  auctionTournamentId: string,
  plan: TransferPlan,
  userId: string | null,
): Promise<TransferResult> {
  const pool = getPool();
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    // Guard: the bookkeeping table must exist before we write anything to the
    // Scoreboard, otherwise we could create a tournament we cannot track.
    await ensureTransferTable(client);

    const t = plan.tournament;
    const { rows: tournamentRows } = await client.query(
      `INSERT INTO public.tournaments
         (name, short_name, status, tournament_model, format, cricket_mode,
          total_overs, balls_per_over, max_wickets, ball_type, discipline,
          stats_mode, logo_cloudinary_id, created_by)
       VALUES ($1,$2,$3,'league',$4,$5,$6,6,10,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        t.name,
        t.shortName,
        t.status,
        t.format,
        t.cricketMode,
        t.totalOvers,
        t.ballType,
        t.discipline,
        t.statsMode,
        t.logoCloudinaryId,
        userId,
      ],
    );
    const scoreboardTournamentId: number = tournamentRows[0].id;

    await recordMapping(client, {
      auctionTournamentId,
      scoreboardTournamentId,
      entityType: 'tournament',
      auctionEntityId: auctionTournamentId,
      scoreboardEntityId: scoreboardTournamentId,
      userId,
    });

    let teamsCreated = 0;
    let playersCreated = 0;

    for (const team of plan.teams) {
      const { rows: teamRows } = await client.query(
        `INSERT INTO public.teams
           (tournament_id, name, short_code, logo_cloudinary_id)
         VALUES ($1,$2,$3,$4)
         RETURNING id`,
        [scoreboardTournamentId, team.name, team.shortCode, team.logoCloudinaryId],
      );
      const scoreboardTeamId: number = teamRows[0].id;
      teamsCreated++;

      await recordMapping(client, {
        auctionTournamentId,
        scoreboardTournamentId,
        entityType: 'team',
        auctionEntityId: team.auctionTeamId,
        scoreboardEntityId: scoreboardTeamId,
        userId,
      });

      for (const player of team.players) {
        // Only name, display name, role (the Auction's "position"), the raw
        // position text and the primary photo are transferred. batting_style
        // and bowling_style are omitted so Postgres applies its own defaults.
        const { rows: playerRows } = await client.query(
          `INSERT INTO public.players
             (team_id, name, display_name, role, position, headshot_cloudinary_id)
           VALUES ($1,$2,$3,$4,$5,$6)
           RETURNING id`,
          [
            scoreboardTeamId,
            player.name,
            player.displayName,
            player.role,
            player.position,
            player.headshotCloudinaryId,
          ],
        );
        playersCreated++;

        await recordMapping(client, {
          auctionTournamentId,
          scoreboardTournamentId,
          entityType: 'player',
          auctionEntityId: player.auctionPlayerId,
          scoreboardEntityId: playerRows[0].id,
          userId,
        });
      }
    }

    await client.query('COMMIT');
    return { scoreboardTournamentId, teamsCreated, playersCreated };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Create the bookkeeping table on demand so a missing migration cannot half-transfer. */
async function ensureTransferTable(client: PoolClient): Promise<void> {
  await client.query('CREATE SCHEMA IF NOT EXISTS auction');
  await client.query(`
    CREATE TABLE IF NOT EXISTS auction.scoreboard_transfer (
      id                       serial PRIMARY KEY,
      auction_tournament_id    text        NOT NULL,
      scoreboard_tournament_id integer     NOT NULL,
      entity_type              text        NOT NULL,
      auction_entity_id        text        NOT NULL,
      scoreboard_entity_id     integer     NOT NULL,
      transferred_at           timestamp   NOT NULL DEFAULT now(),
      transferred_by           text,
      CONSTRAINT scoreboard_transfer_entity_type_check
        CHECK (entity_type IN ('tournament', 'team', 'player'))
    )
  `);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS scoreboard_transfer_entity_idx
      ON auction.scoreboard_transfer (entity_type, auction_entity_id, scoreboard_tournament_id)
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS scoreboard_transfer_auction_idx
      ON auction.scoreboard_transfer (auction_tournament_id)
  `);
}

async function recordMapping(
  client: PoolClient,
  args: {
    auctionTournamentId: string;
    scoreboardTournamentId: number;
    entityType: 'tournament' | 'team' | 'player';
    auctionEntityId: string;
    scoreboardEntityId: number;
    userId: string | null;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO auction.scoreboard_transfer
       (auction_tournament_id, scoreboard_tournament_id, entity_type,
        auction_entity_id, scoreboard_entity_id, transferred_by)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (entity_type, auction_entity_id, scoreboard_tournament_id)
     DO UPDATE SET scoreboard_entity_id = EXCLUDED.scoreboard_entity_id,
                   transferred_at = now(),
                   transferred_by = EXCLUDED.transferred_by`,
    [
      args.auctionTournamentId,
      args.scoreboardTournamentId,
      args.entityType,
      args.auctionEntityId,
      args.scoreboardEntityId,
      args.userId,
    ],
  );
}
