-- Auction → Scoreboard transfer bookkeeping.
--
-- Maps Auction (Mongo, string _id) entities to the serial integer ids the
-- Scoreboard assigns, so a transfer can be re-run safely and the UI can show
-- whether an auction has already been transferred.
--
-- Intentionally standalone and idempotent. The other files in drizzle/auction
-- describe the full Mongo→Postgres migration, which is NOT applied to the live
-- database; this table must be creatable without pulling that in.
--
-- Touches only the `auction` schema. Scoreboard's `public` tables are never
-- altered here.

CREATE SCHEMA IF NOT EXISTS auction;

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
);

-- One row per auction entity per target tournament: re-running a transfer
-- updates the mapping instead of duplicating squads.
CREATE UNIQUE INDEX IF NOT EXISTS scoreboard_transfer_entity_idx
  ON auction.scoreboard_transfer (entity_type, auction_entity_id, scoreboard_tournament_id);

-- Fast lookup for "has this auction already been transferred?"
CREATE INDEX IF NOT EXISTS scoreboard_transfer_auction_idx
  ON auction.scoreboard_transfer (auction_tournament_id);
