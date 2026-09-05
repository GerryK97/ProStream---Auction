#!/usr/bin/env bash
# Verifies the `auction` PostgreSQL schema enforces the money and integrity
# rules that the current MongoDB code can only enforce in application logic.
#
# Runs entirely inside a disposable PostgreSQL container. Touches no real
# database. Safe to run at any time.
#
#   ./scripts/ops/test-auction-schema.sh
#
# Optional:
#   POSTGRES_IMAGE=postgres:18-alpine   client/server image to test against
#   MIGRATION_FILE=drizzle/auction/0000_auction_schema_initial.sql
#
# Test 6 is the important one: it proves a failed multi-step sale rolls back
# atomically. In MongoDB that same guarantee requires the hand-written
# compensation logic currently in src/app/api/auction/sell/route.ts.

set -euo pipefail

POSTGRES_IMAGE="${POSTGRES_IMAGE:-postgres:18-alpine}"
MIGRATION_FILE="${MIGRATION_FILE:-drizzle/auction/0000_auction_schema_initial.sql}"

if [[ ! -f "$MIGRATION_FILE" ]]; then
  echo "Migration file not found: ${MIGRATION_FILE}" >&2
  echo "Run: npx drizzle-kit generate" >&2
  exit 2
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not available. Start Docker and retry." >&2
  exit 2
fi

CONTAINER="auction-schema-test-$$-${RANDOM}"
cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

failures=0
check() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  PASS  ${label}"
  else
    echo "  FAIL  ${label} (expected '${expected}', got '${actual}')"
    failures=$((failures + 1))
  fi
}

docker run -d --rm --name "$CONTAINER" \
  -e POSTGRES_USER=tester -e POSTGRES_PASSWORD=tester -e POSTGRES_DB=testdb \
  "$POSTGRES_IMAGE" >/dev/null

for attempt in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -U tester -d testdb >/dev/null 2>&1; then break; fi
  sleep 1
  if [[ "$attempt" -eq 30 ]]; then
    echo "PostgreSQL container did not become ready" >&2
    exit 1
  fi
done

psql_q() { docker exec -i "$CONTAINER" psql -U tester -d testdb -Atq 2>&1; }
psql_val() { docker exec "$CONTAINER" psql -U tester -d testdb -Atqc "$1"; }

echo "Applying ${MIGRATION_FILE}..."
docker exec -i "$CONTAINER" psql -U tester -d testdb -v ON_ERROR_STOP=1 \
  < "$MIGRATION_FILE" >/dev/null
echo "Applied."
echo

echo "Structure"
check "22 tables created" "22" \
  "$(psql_val "SELECT count(*) FROM information_schema.tables WHERE table_schema='auction' AND table_type='BASE TABLE';")"
# The shared public schema is owned by the Scoreboard repo. These migrations
# must never create anything there.
check "public schema untouched" "0" \
  "$(psql_val "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")"
echo

psql_q >/dev/null <<'SQL'
INSERT INTO auction.tournaments (id, name, year, budget_per_team, squad_size, base_price_per_player)
VALUES ('t1', 'Test Cup', 2026, 1000000, 5, 5000);
INSERT INTO auction.teams (id, tournament_id, name, short_code, initial_budget, current_balance)
VALUES ('team1', 't1', 'Test Team', 'TT', 1000000, 1000000);
INSERT INTO auction.players (id, tournament_id, name) VALUES ('p1', 't1', 'Test Player');
SQL

echo "Money and integrity constraints"

blocked_by() {
  local constraint="$1" sql="$2"
  if printf '%s' "$sql" | psql_q | grep -q "$constraint"; then echo "blocked"; else echo "allowed"; fi
}

check "overspend rejected" "blocked" \
  "$(blocked_by 'teams_balance_non_negative' \
     "UPDATE auction.teams SET current_balance = current_balance - 2000000 WHERE id = 'team1';")"

check "sold player without price/buyer rejected" "blocked" \
  "$(blocked_by 'players_sold_has_price_and_team' \
     "UPDATE auction.players SET is_sold = true WHERE id = 'p1';")"

check "player both sold and unsold rejected" "blocked" \
  "$(blocked_by 'players_not_both_sold_and_unsold' \
     "UPDATE auction.players SET is_sold = true, is_unsold = true, final_price = 100, winning_team_id = 'team1' WHERE id = 'p1';")"

check "negative bid rejected" "blocked" \
  "$(blocked_by 'auction_state_bid_non_negative' \
     "INSERT INTO auction.auction_state (tournament_id, current_bid) VALUES ('t1', -5);")"
echo

echo "Transactional sale"
psql_q >/dev/null <<'SQL'
BEGIN;
UPDATE auction.players SET is_sold = true, final_price = 50000, winning_team_id = 'team1' WHERE id = 'p1';
UPDATE auction.teams SET current_balance = current_balance - 50000 WHERE id = 'team1';
COMMIT;
SQL
check "valid sale committed" "50000" "$(psql_val "SELECT final_price FROM auction.players WHERE id='p1';")"
check "balance deducted"    "950000" "$(psql_val "SELECT current_balance FROM auction.teams WHERE id='team1';")"

# The core reason for moving this data to PostgreSQL: a multi-step sale that
# fails partway must leave nothing behind, with no compensation code.
psql_q >/dev/null 2>&1 <<'SQL' || true
BEGIN;
UPDATE auction.players SET is_sold = true, final_price = 999, winning_team_id = 'team1' WHERE id = 'p1';
UPDATE auction.teams SET current_balance = current_balance - 99999999 WHERE id = 'team1';
COMMIT;
SQL
check "failed sale left balance unchanged" "950000" \
  "$(psql_val "SELECT current_balance FROM auction.teams WHERE id='team1';")"
check "failed sale left price unchanged"   "50000" \
  "$(psql_val "SELECT final_price FROM auction.players WHERE id='p1';")"
echo

if [[ "$failures" -gt 0 ]]; then
  echo "${failures} check(s) failed."
  exit 1
fi
echo "All auction schema checks passed."
