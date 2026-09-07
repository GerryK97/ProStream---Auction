# Auction MongoDB → PostgreSQL Migration Plan

## Status

Both Dokploy apps (Scoreboard, Auction) share one PostgreSQL database
(`prostream-postgres`, `public` schema) for `users`/`wallets`. That database is
**not** the one Vercel and local development use: those point at Neon, which is
currently authoritative. See "Prerequisite: reconcile the two PostgreSQL
databases" below — that gap must be closed before this migration starts.

Auction's own data — tournaments, teams, players, live bidding state, overlays,
invoicing — still lives entirely in MongoDB Atlas. This plan migrates that
remaining data.

**Not started. This is the plan only.** Estimated 3–5 weeks of focused work.
Do not begin until the shared-Postgres switch has run stable for at least a
week and the real production cutover (Vercel → Dokploy) is complete, so this
migration is not competing with that cutover for attention or risk budget.

## Scope (measured 2026-09-05)

| Item | Count |
|---|---|
| Total API routes | 101 |
| Routes touching MongoDB | 58 |
| Routes with atomic `findOneAndUpdate` (money/state-critical) | 16 |
| Mongoose models | 10 (User already migrated to Postgres) |
| Files touching Mongo (`connectToDatabase`/models) | ~66 |

**Already an advantage:** no `ObjectId` anywhere — every model uses
`_id: { type: String }`. IDs migrate as `text` columns with zero remapping.

## Decision: separate `auction` schema

Same database, new schema (`auction`), not `public`. Scoreboard already owns
`tournaments`/`teams`/`players` in `public` for a different purpose (cricket
identity vs. auction lifecycle) — these are different entities with the same
English name and must not collide. One database still means one backup and
one connection pool to operate.

## Prerequisite: reconcile the two PostgreSQL databases (measured 2026-09-07)

The Vercel and Dokploy deployments share one MongoDB but do **not** share one
PostgreSQL. Dokploy runs its own `prostream-postgres`, while Vercel and local
development use Neon. Neon is currently authoritative (it serves live traffic
through Vercel), and Dokploy froze behind on 2026-09-04.

Measured divergence:

| | Neon (authoritative) | Dokploy | Gap |
|---|---|---|---|
| users | 66 | 57 | 9 |
| wallet_transactions | 273 (max id 288) | 253 (max id 268) | 20 |
| money received | 147,500 | 142,500 | 5,000 |

The divergence is a clean lag, not a fork:

- No row exists only in Dokploy.
- All 253 shared ledger rows are identical field for field.
- Transaction ids split cleanly at 268, so there are no id collisions.
- The 9 Neon-only users hold zero balance and own no tournaments.
- No Mongo `createdBy` value references a user missing from Dokploy, so the
  `auction` schema (which stores `created_by` as plain `text`, with no foreign
  key into `users`) cannot orphan against either database.

`scripts/ops/sync-users-wallets.mjs` (`npm run db:sync-users:dry-run` /
`db:sync-users:apply`) fast-forwards the target. It is additive and
fail-closed: it refuses to run unless the target is a strict subset, never
edits or deletes an existing ledger row, inserts wallets before their
transactions, corrects balances only after those transactions land, and resets
the sequences so future inserts cannot collide. `SOURCE_SCHEMA`/`TARGET_SCHEMA`
allow rehearsing against a scratch copy first.

**Tournament access is merged, not overwritten.** Both deployments were
granting access while they ran in parallel, so `assigned_tournaments` is a set
where each side may hold grants the other lacks. Measured on 2026-09-07:
Dokploy held 3 grants absent from Neon, one of them a real tournament
(`livecast` → TALAWAKELLE PREMIER LEAGUE 2026). Copying source over target
would have silently revoked it. The tool therefore writes the union to both
databases and verifies afterwards that no access set still diverges.

Rehearsed 2026-09-07 against a scratch schema seeded to reproduce Dokploy's
exact lag, including those target-only grants: 9 users, 1 wallet, and 20
transactions copied, 8 balances corrected, 2 access sets merged, ending at
273/273 transactions with 0 ledger mismatches, 0 divergent access sets, and
matching total balances. Re-running reported "already in sync", and injecting a
target-only row correctly aborted the run.

**Order of operations.** Sync users/wallets and complete the Vercel → Dokploy
cutover *before* migrating auction data. Migrating first would leave two live
user tables drifting apart again, which is what produced this gap.

## Model → table mapping

| Model | Target | Complexity | Notes |
|---|---|---|---|
| `Customer` | `auction.customers` | low | Flat, `address` → `jsonb` |
| `AuctionState` | `auction.auction_state` | **critical** | Live bidding CAS target. `history[]` (bid log) → child table `auction.bid_history`, not `jsonb` — it needs to stay queryable and unbounded-append-safe |
| `Player` | `auction.players` | medium | `stats` (`Map`) → `jsonb`. All 7 indexes carry over as real Postgres indexes |
| `Team` | `auction.teams` | **money** | `currentBalance` gets `CHECK (current_balance >= 0)`. `officials[]` → child table `auction.team_officials`. `playersPurchased[]` → derive from `players.winning_team_id`, do not duplicate as an array |
| `Tournament` | `auction.tournaments` | **high** | 141 lines. `playerClasses[]`, `bidIncrements[]`, `directQuickBids[]`, `playerCardTemplates[]` → child tables (queried individually elsewhere). `playerProfileFields`, `teamOfficialsConfig`, `overlayControlSettings` → `jsonb` (config blobs, read-whole, not filtered) |
| `Invoice` / `Quotation` | `auction.invoices`, `auction.quotations` | financial | `items[]` → child table `line_items` (needed for reporting/tax). Confirm retention/audit obligations before dropping Mongo copies |
| `OverlayConfig` / `Scene` / `History` / `Analytics` | `auction.overlay_*` | **high** | 208-line model, 15 array/object fields. `position`, `size`, `animations`, `parameters` → `jsonb` (presentation config, not queried by field). `displayRules[]` → `jsonb` array (small, always read together) |
| `OverlayLibrary` | `auction.overlay_library` | low | `parameterSchema` (Map) → `jsonb` |
| `OverlaySession` | `auction.overlay_sessions` | low | Flat, direct mapping |

Rule of thumb carried over from the Scoreboard migration: **money and
integrity → real columns + constraints; presentation config → `jsonb`.**

## Why Postgres makes the money path safer

`sell/route.ts` today runs three separate atomic Mongo updates (claim player →
deduct balance/add to squad → mark auction state sold) with **hand-written
compensation code** to manually undo a partial failure at any of the three
steps. That compensation logic exists only because Mongo has no
multi-document transaction available in this access pattern.

In Postgres this becomes one `BEGIN ... COMMIT` block. If any check fails,
`ROLLBACK` undoes all three writes atomically — the ~60 lines of manual
compensation in `sell/route.ts` (and the equivalent in `bid/route.ts`,
`mark-unsold/route.ts`, `undo/route.ts`) are deleted, not ported.

Example target shape for the sell path:

```sql
BEGIN;
UPDATE auction.players
   SET is_sold = true, final_price = $bid, winning_team_id = $team
 WHERE id = $player AND tournament_id = $t AND is_sold = false
RETURNING *;                                   -- 0 rows → ROLLBACK, 409

UPDATE auction.teams
   SET current_balance = current_balance - $bid
 WHERE id = $team AND tournament_id = $t
   AND current_balance >= $minimumRequiredBalance
   AND (SELECT count(*) FROM auction.players
         WHERE winning_team_id = $team AND tournament_id = $t) < $squadSize
RETURNING *;                                   -- 0 rows → ROLLBACK, 409

UPDATE auction.auction_state
   SET current_auction_status = 'Sold', winning_team_id = $team
 WHERE tournament_id = $t AND current_player_id = $player
   AND current_bid = $bid AND current_auction_status <> 'Sold'
RETURNING *;                                   -- 0 rows → ROLLBACK, 409
COMMIT;
```

`CHECK (current_balance >= 0)` on `auction.teams` makes an over-spend
impossible at the database level, independent of application code.

## Phases

### D-A — Schema ✅ COMPLETE

- Drizzle schema: `src/lib/pg/auction-schema.ts` (22 tables)
- Migration SQL: `drizzle/auction/0000_auction_schema_initial.sql`
- Config: `drizzle.config.ts`, `schemaFilter: ['auction']` so these migrations
  can never touch the shared `public` tables Scoreboard owns
- Test: `scripts/ops/test-auction-schema.sh` (`npm run test:auction-schema`)

Verified against a disposable PostgreSQL 18 container — 22 tables, 16 check
constraints, 63 indexes, `public` schema untouched. All 10 checks pass:

| Check | Result |
|---|---|
| 22 tables created in `auction` schema | PASS |
| `public` schema untouched | PASS |
| Overspend rejected (`teams_balance_non_negative`) | PASS |
| Sold player without price/buyer rejected | PASS |
| Player both sold and unsold rejected | PASS |
| Negative bid rejected | PASS |
| Valid sale committed | PASS |
| Balance correctly deducted | PASS |
| **Failed sale left balance unchanged** | PASS |
| **Failed sale left price unchanged** | PASS |

The last two are the point of the whole migration: a multi-step sale that
fails partway rolls back atomically with no partial state and no compensation
code. Nothing has been applied to the real `prostream-postgres` database.

### D-B — Guarded ETL + isolated trial ✅ COMPLETE
1. One guarded Node script reads all Mongo documents, transforms them, and
   inserts them into Postgres in a single all-or-nothing transaction.
2. Run against a **scratch** copy of the Postgres database (same pattern as
   the Neon-to-Dokploy trial: create, populate, verify, discard).
3. Reconcile: row count per collection must match Mongo document count
   exactly. Spot-check money fields (`currentBalance`, `finalPrice`) and a
   sample of `jsonb` blobs for shape correctness.
4. This phase can run repeatedly against fresh Mongo Atlas exports without
   touching production, exactly like the earlier Neon trial-then-final
   pattern.

#### Isolated Dokploy trial result (2026-09-05)

The `prostream_trial` database was verified empty, with 23 `auction` tables
and no `public` tables, before import. A fresh read validated **5,449 Mongo
documents** with plan fingerprint
`7e4df836a7a9f74d5ce8f564af9f6003c6202026775a9514315b012ee9db09ea`.
The guarded import and a separate fresh-source `--verify` pass both succeeded.

The resulting trial includes 48 tournaments, 342 teams, 3,850 referentially
valid players, 44 auction states, 44 bid-history rows, 147 overlay sessions,
6 invoices, 3 quotations, and 984 archived legacy records. Counts for every
target table matched the deterministic import plan. The ETL also compared all
money rows and configured `jsonb` shapes exactly, not by sampling. Independent
PostgreSQL checks confirmed zero negative team balances, invalid sold/unsold
player states, negative bids, unvalidated constraints, or public-schema tables.

Two duplicate `10,000` quick-bid buttons in separate source tournaments were
explicitly normalized to one button per tournament. They are behaviorally
identical at runtime and cannot coexist under the target's
`(tournament_id, amount)` key. The first value is retained and each redundant
source child is reported in the deterministic ETL normalizations. The same run
also reported four inert `{ upTo: 0, increment: 0 }` bid-bracket placeholders,
1,279 legacy player-class/current-class conversions, and 984 historical
documents archived because their relational parent no longer exists.

This was an isolated rehearsal only. The production `prostream-postgres`
database, application routing, and MongoDB source were not changed.

#### Guarded rehearsal tooling

`scripts/ops/auction-mongo-to-postgres.mjs` maps every remaining Mongo
collection to the `auction` schema, including embedded child arrays. It is
deliberately fail-closed:

- `npm run db:auction:etl:dry-run` reads and validates Mongo only. It does not
  open PostgreSQL or write anything.
- `npm run db:auction:etl:apply` needs an explicitly named, empty scratch
  database (`AUCTION_ETL_DATABASE_URL`) whose name contains `scratch`, `trial`,
  `test`, `dev`, or `local`, plus both exact-name and write confirmations. It
  has no `TRUNCATE`, `DELETE`, or upsert path.
- `npm run db:auction:etl:verify` compares every target table count, every
  money row, and every migrated `jsonb` shape to a fresh Mongo read. It makes
  no changes.

The required environment variables for an isolated rehearsal are:

```sh
export AUCTION_ETL_DATABASE_URL='postgresql://.../auction_trial'
export AUCTION_ETL_CONFIRM_TARGET='auction_trial'
export AUCTION_ETL_CONFIRM_APPLY='IMPORT_INTO_EMPTY_SCRATCH'
npm run db:auction:etl:dry-run
npm run db:auction:etl:apply
npm run db:auction:etl:verify
```

`MONGODB_URI` is always the source and is used read-only. The tool refuses a
target equal to `DATABASE_URL`, so this procedure cannot use the app's normal
database URL by mistake. `npm run test:auction-etl` tests field mapping,
embedded child-table expansion, BSON `Map` to `jsonb` conversion, millisecond
bid history timestamps, and invalid money/state rejection without accessing a
real database.

The rehearsal reports, rather than silently discarding, legacy `{ upTo: 0,
increment: 0 }` bid-bracket placeholders. They are inert in the existing
runtime because non-negative bids never match a `currentBid < 0` range, but
cannot be imported as valid rows because they duplicate the child-table key and
violate the positive-increment constraint. A slab with no meaningful positive
rows still fails validation and must be repaired explicitly.

#### Legacy records with deleted parents

The production source contains historical records whose tournament was deleted
without a Mongo cascade. These must not be dropped or attached to invented live
parents. Migration `0001_milky_golden_guardian.sql` therefore adds
`auction.migration_legacy_records`: the ETL stores each original document as
`jsonb` with its source collection, source ID, and missing-parent reason. The
live relational tables receive only referentially valid records, while the raw
historical record remains queryable and fully reconciled. Legacy player-class
labels are mapped to their tournament's configured class code, with every
mapping reported by the dry run.

During ETL review, `bid_history.bid_at_epoch_ms` was corrected from PostgreSQL
`integer` to `bigint`: a modern millisecond epoch is about 1.7 trillion and
would otherwise overflow before any migration could safely run.

### D-C — Port the 16 CAS routes first (about 1–1.5 weeks)
Priority order, most money-critical first:
1. `bid/route.ts`, `bid/correct/route.ts` — sets the live price
2. `sell/route.ts` — moves money and squad slots
3. `mark-unsold/route.ts`, `undo/route.ts` — reverses `sell`
4. `select-class/route.ts`, `select-player/route.ts`, `start/route.ts`,
   `reset/route.ts`, `reset-all/route.ts`, `bootstrap/route.ts`,
   `state/[tournamentId]/route.ts`, `live/route.ts`
5. `tournaments/[id]/status/route.ts`, `overlay/sessions/[token]/route.ts`

Each route gets a concurrency test: two simultaneous requests against the
same row, assert exactly one succeeds and the loser gets a clean `409`
(mirrors the existing `scripts/check-realtime-bid-guards.js` pattern already
in this repo — extend it rather than replacing it).

### D-D — Port remaining ~42 Mongo routes (about 1–1.5 weeks)
Overlay CRUD, invoicing, customer management, team/player CRUD outside the
auction hot path. Lower risk, standard CRUD conversion.

### D-E — Dual-read verification (about 3–4 days)
For a short window, read from both Mongo and Postgres on selected routes and
log any mismatch without changing the response. This catches ETL or
application-logic bugs against real production traffic before Mongo is
retired, without risking a wrong answer being served.

### D-F — Cutover (maintenance window)
1. Final ETL run from live Mongo into the real `prostream-postgres`
   `auction` schema (same rehearsed procedure as the Neon cutover: pause
   writes briefly, fresh export, restore, verify row counts, reopen).
2. Point Auction's Mongo-backed routes at Postgres.
3. Keep MongoDB Atlas read-only for 30 days before deleting the cluster.

## Risks

1. **Money correctness is the only hard requirement.** Every balance and
   price field needs an explicit before/after check during D-B and D-E, not
   just a row count match.
2. **16 CAS routes are the entire risk surface for live bidding.** The
   remaining 42 are much lower risk and can slip in schedule without harming
   the auction itself.
3. **Invoices/Quotations may carry retention or audit obligations** — confirm
   before deciding whether old Mongo records can be deleted after migration
   or must be retained/archived separately.
4. **This is a big-bang schema change**, unlike the incremental Postgres host
   move. There is no safe way to run "half on Mongo, half on Postgres" for a
   single tournament's auction state — D-C must complete and pass concurrency
   tests before any real auction runs against the new schema.
