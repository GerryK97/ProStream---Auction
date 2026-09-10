/**
 * transfer-schema.ts
 *
 * Drizzle definitions for the Auction → Scoreboard transfer.
 *
 * Two distinct groups live here:
 *
 *  1. `auction.scoreboard_transfer` — Auction-owned bookkeeping that maps a
 *     Mongo string _id to the serial integer id the Scoreboard assigned. This
 *     makes transfers idempotent and lets the UI show "already transferred".
 *
 *  2. Read/write handles for the Scoreboard's `public` tables. These mirror
 *     ProStream-Scoreboard/src/lib/db/schema.ts. They are duplicated rather
 *     than imported because the two apps are separate repos that happen to
 *     share one database. Any change to the Scoreboard schema must be
 *     reflected here.
 *
 * Deliberately kept OUT of `auction-schema.ts`: that file describes the full,
 * still-unapplied Mongo→Postgres migration. Mixing this in would make the only
 * table we actually need impossible to create without also creating that entire
 * unapplied schema.
 */

import {
  char,
  integer,
  pgEnum,
  pgSchema,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

// ─── 1. Auction-owned bookkeeping ─────────────────────────────────────────────

export const auctionSchema = pgSchema('auction');

export const scoreboardTransfer = auctionSchema.table(
  'scoreboard_transfer',
  {
    id: serial('id').primaryKey(),
    /** Auction (Mongo) tournament _id that was transferred. */
    auctionTournamentId: text('auction_tournament_id').notNull(),
    /** Scoreboard tournament this transfer created. */
    scoreboardTournamentId: integer('scoreboard_tournament_id').notNull(),
    /** 'tournament' | 'team' | 'player' */
    entityType: text('entity_type').notNull(),
    /** Auction (Mongo) _id of the entity. Equals the tournament id for 'tournament'. */
    auctionEntityId: text('auction_entity_id').notNull(),
    /** Scoreboard serial id the insert produced. */
    scoreboardEntityId: integer('scoreboard_entity_id').notNull(),
    transferredAt: timestamp('transferred_at').defaultNow().notNull(),
    transferredBy: text('transferred_by'),
  },
  (table) => ({
    // One row per auction entity per transfer target, so re-running updates
    // instead of duplicating.
    uniqueEntity: uniqueIndex('scoreboard_transfer_entity_idx').on(
      table.entityType,
      table.auctionEntityId,
      table.scoreboardTournamentId,
    ),
  }),
);

export type ScoreboardTransferRow = typeof scoreboardTransfer.$inferSelect;
export type NewScoreboardTransferRow = typeof scoreboardTransfer.$inferInsert;

// ─── 2. Scoreboard `public` tables (owned by ProStream-Scoreboard) ────────────

// Enum members verified against the live database on 2026-09-09 rather than
// copied from the Scoreboard source, because the deployed enums differ from a
// naive reading (e.g. tournament_status has no 'active'/'completed' members).
export const tournamentStatusEnum = pgEnum('tournament_status', [
  'upcoming',
  'group_stage',
  'knockout',
  'complete',
]);
export const matchFormatEnum = pgEnum('match_format', [
  'T20', 'ODI', 'T10', 'custom', 'Test', 'MultiDay',
]);
export const cricketModeEnum = pgEnum('cricket_mode', ['professional', 'gully']);
export const ballTypeEnum = pgEnum('ball_type', ['tennis', 'leather', 'synthetic']);
export const matchDisciplineEnum = pgEnum('match_discipline', ['soft', 'hard']);
export const statsModeEnum = pgEnum('stats_mode', ['basic', 'advanced']);
export const tournamentModelEnum = pgEnum('tournament_model', [
  'league', 'knockout',
]);
export const playerRoleEnum = pgEnum('player_role', [
  'batsman', 'bowler', 'allrounder', 'keeper',
]);
// batting_style / bowling_style are intentionally absent: the transfer does not
// write them, and both columns are nullable with their own defaults.

export const scoreboardTournaments = pgTable('tournaments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  shortName: varchar('short_name', { length: 20 }).notNull(),
  status: tournamentStatusEnum('status').notNull().default('upcoming'),
  tournamentModel: tournamentModelEnum('tournament_model').notNull().default('league'),
  format: matchFormatEnum('format').notNull().default('T20'),
  cricketMode: cricketModeEnum('cricket_mode').notNull().default('professional'),
  totalOvers: integer('total_overs').notNull().default(20),
  ballsPerOver: integer('balls_per_over').notNull().default(6),
  maxWickets: integer('max_wickets').notNull().default(10),
  ballType: ballTypeEnum('ball_type').notNull().default('tennis'),
  discipline: matchDisciplineEnum('discipline').notNull().default('soft'),
  statsMode: statsModeEnum('stats_mode').notNull().default('basic'),
  logoCloudinaryId: text('logo_cloudinary_id'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scoreboardTeams = pgTable('teams', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id').notNull(),
  name: text('name').notNull(),
  shortCode: char('short_code', { length: 3 }).notNull(),
  primaryColor: varchar('primary_color', { length: 7 }).notNull().default('#4F46E5'),
  logoCloudinaryId: text('logo_cloudinary_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scoreboardPlayers = pgTable('players', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull(),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  role: playerRoleEnum('role').notNull().default('batsman'),
  position: text('position'),
  headshotCloudinaryId: text('headshot_cloudinary_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
