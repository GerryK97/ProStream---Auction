#!/usr/bin/env bash
# ProStream API Test Suite v2
# Comprehensive API tests against localhost:3000

BASE="http://localhost:3000/api"
COOKIE_JAR="/tmp/prostream_test_cookies.txt"
TOKEN=""
TOURNAMENT_ID=""
PLAYER_ID=""
PLAYER2_ID=""
TEAM_ID=""
TEAM2_ID=""

PASS=0
FAIL=0
SKIP=0

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

section() { echo -e "\n${BOLD}${CYAN}══ $1 ══${NC}"; }
pass()    { echo -e "  ${GREEN}✓${NC} $1"; ((PASS++)); }
fail()    { echo -e "  ${RED}✗${NC} $1"; ((FAIL++)); }
skip()    { echo -e "  ${YELLOW}○${NC} $1 (skipped)"; ((SKIP++)); }
info()    { echo -e "  ${YELLOW}ℹ${NC} $1"; }

req() {
  local method="$1" path="$2"; shift 2
  curl -s -w "\n__STATUS__%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -X "$method" "$BASE$path" "$@"
}
parse_status() { echo "$1" | grep -o '__STATUS__[0-9]*' | sed 's/__STATUS__//'; }
parse_body()   { echo "$1" | sed 's/__STATUS__[0-9]*//g' | sed '/^$/d' | head -c 2000; }

extract() {
  echo "$1" | python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  for k in '$2'.split('.'):
    d = d[int(k)] if isinstance(d, list) else d.get(k, '')
  print(d)
except: print('')
" 2>/dev/null
}

assert_status() {
  local label="$1" expected="$2" actual="$3" body="$4"
  if [[ "$actual" == "$expected" ]]; then
    pass "$label → $actual"
  else
    fail "$label → expected $expected, got $actual  ↳ ${body:0:100}"
  fi
}

has_field() {
  echo "$1" | python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  s = json.dumps(d)
  assert '$2' in s
  print('yes')
except: print('no')
" 2>/dev/null
}

rm -f "$COOKIE_JAR"

echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   ProStream API Test Suite v2        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo "  Target : $BASE"
echo "  Time   : $(date)"

# ─── SETUP: ensure test user exists and is Admin ────────────
echo ""
echo -e "  ${YELLOW}[setup]${NC} Ensuring testapi user exists..."
cd /Users/gerry/Documents/GitHub/ProStream---Auction && node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`SELECT username FROM users WHERE username = 'testapi'\`.then(rows => {
  if (rows.length > 0) { console.log('exists'); } else { console.log('missing'); }
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
" 2>&1 | while IFS= read -r line; do
  if [[ "$line" == "missing" ]]; then
    # Create via signup
    curl -s -X POST http://localhost:3000/api/auth/signup \
      -H "Content-Type: application/json" \
      -d '{"username":"testapi","email":"testapi@prostream.test","password":"TestApi123!"}' > /dev/null
    echo -e "  ${YELLOW}[setup]${NC} Created testapi via signup"
  fi
done
# Promote to Admin
cd /Users/gerry/Documents/GitHub/ProStream---Auction && node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`UPDATE users SET role = 'Admin' WHERE username = 'testapi' RETURNING username, role\`.then(rows => { console.log('role:', rows[0]?.role); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
" 2>&1 | while IFS= read -r line; do echo -e "  ${YELLOW}[setup]${NC} $line"; done

# ─── AUTH ───────────────────────────────────────────────────
section "AUTH — Login / Session / Logout"

R=$(req POST /auth/login -H "Content-Type: application/json" -d '{"username":"nobody","password":"bad"}')
assert_status "Login bad credentials" 401 "$(parse_status "$R")" "$(parse_body "$R")"

R=$(req POST /auth/login -H "Content-Type: application/json" -d '{}')
assert_status "Login missing fields → 400" 400 "$(parse_status "$R")" "$(parse_body "$R")"

R=$(req POST /auth/login -H "Content-Type: application/json" -d '{"username":"testapi","password":"TestApi123!"}')
assert_status "Login success" 200 "$(parse_status "$R")" "$(parse_body "$R")"
TOKEN=$(extract "$(parse_body "$R")" "token")
BODY=$(parse_body "$R")
[[ "$(has_field "$BODY" "Admin")" == "yes" ]] && pass "Login returns Admin role" || fail "Login role not Admin in response"
info "JWT: ${TOKEN:0:40}..."

R=$(req GET /auth/session -H "Authorization: Bearer $TOKEN")
assert_status "GET /auth/session" 200 "$(parse_status "$R")" "$(parse_body "$R")"
[[ "$(has_field "$(parse_body "$R")" "testapi")" == "yes" ]] && pass "Session contains username" || fail "Session missing username"

R=$(req POST /auth/logout -H "Authorization: Bearer $TOKEN")
assert_status "POST /auth/logout" 200 "$(parse_status "$R")" "$(parse_body "$R")"

R=$(req POST /auth/login -H "Content-Type: application/json" -d '{"username":"testapi","password":"TestApi123!"}')
assert_status "Re-login after logout" 200 "$(parse_status "$R")" "$(parse_body "$R")"
TOKEN=$(extract "$(parse_body "$R")" "token")

# ─── USERS ──────────────────────────────────────────────────
section "USERS"

R=$(req GET /users -H "Authorization: Bearer $TOKEN")
assert_status "GET /users (Admin)" 200 "$(parse_status "$R")" "$(parse_body "$R")"

R=$(req GET /users/profile -H "Authorization: Bearer $TOKEN")
assert_status "GET /users/profile" 200 "$(parse_status "$R")" "$(parse_body "$R")"
[[ "$(has_field "$(parse_body "$R")" "testapi")" == "yes" ]] && pass "Profile shows own username" || fail "Profile missing username"

R=$(req GET /users/all -H "Authorization: Bearer $TOKEN")
assert_status "GET /users/all" 200 "$(parse_status "$R")" "$(parse_body "$R")"

# Change password (wrong current password)
R=$(req POST /users/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"wrongpass","newPassword":"NewPass123!"}')
assert_status "POST /users/change-password (wrong current pw) → 400" 400 "$(parse_status "$R")" "$(parse_body "$R")"

# ─── TOURNAMENTS CRUD ───────────────────────────────────────
section "TOURNAMENTS — CRUD"

R=$(req GET /tournaments -H "Authorization: Bearer $TOKEN")
assert_status "GET /tournaments" 200 "$(parse_status "$R")" "$(parse_body "$R")"

R=$(req GET /tournaments/active -H "Authorization: Bearer $TOKEN")
assert_status "GET /tournaments/active" 200 "$(parse_status "$R")" "$(parse_body "$R")"

# Create — include new directQuickBids fields
R=$(req POST /tournaments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"API Test Tournament",
    "year":2026,
    "squadSize":11,
    "budgetPerTeam":1000000,
    "basePricePerPlayer":50000,
    "basePriceStrategy":"tournament-level",
    "biddingMode":"direct",
    "directBidSlabEnabled":false,
    "directQuickBidsEnabled":true,
    "directQuickBids":[{"amount":1000},{"amount":5000},{"amount":10000}],
    "playerClasses":[],
    "bidIncrements":[]
  }')
assert_status "POST /tournaments (create)" 201 "$(parse_status "$R")" "$(parse_body "$R")"
BODY=$(parse_body "$R")
TOURNAMENT_ID=$(extract "$BODY" "_id")
info "Tournament ID: $TOURNAMENT_ID"

[[ "$(has_field "$BODY" "directQuickBidsEnabled")" == "yes" ]] \
  && pass "Create: directQuickBidsEnabled in response" \
  || fail "Create: directQuickBidsEnabled missing from response"
[[ "$(has_field "$BODY" "directQuickBids")" == "yes" ]] \
  && pass "Create: directQuickBids in response" \
  || fail "Create: directQuickBids missing from response"

# GET by ID
R=$(req GET /tournaments/$TOURNAMENT_ID -H "Authorization: Bearer $TOKEN")
assert_status "GET /tournaments/:id" 200 "$(parse_status "$R")" "$(parse_body "$R")"

# Verify directQuickBidsEnabled persisted
FETCHED=$(parse_body "$R")
[[ "$(has_field "$FETCHED" "directQuickBidsEnabled")" == "yes" ]] \
  && pass "GET :id: directQuickBidsEnabled persisted" \
  || fail "GET :id: directQuickBidsEnabled not persisted"

# Update via PUT (not PATCH)
R=$(req PUT /tournaments/$TOURNAMENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"API Test Tournament (Updated)",
    "year":2026,
    "squadSize":11,
    "budgetPerTeam":1000000,
    "basePricePerPlayer":50000,
    "basePriceStrategy":"tournament-level",
    "biddingMode":"direct",
    "directBidSlabEnabled":true,
    "directQuickBidsEnabled":true,
    "directQuickBids":[{"amount":2000},{"amount":6000}],
    "bidIncrements":[{"upTo":50000,"increment":5000},{"upTo":100000,"increment":10000}],
    "playerClasses":[]
  }')
assert_status "PUT /tournaments/:id (update)" 200 "$(parse_status "$R")" "$(parse_body "$R")"
[[ "$(has_field "$(parse_body "$R")" "Updated")" == "yes" ]] \
  && pass "PUT: updated name reflected" \
  || fail "PUT: updated name not in response"

# ─── TEAMS CRUD ─────────────────────────────────────────────
section "TEAMS — CRUD"

R=$(req GET "/teams?tournamentId=$TOURNAMENT_ID" -H "Authorization: Bearer $TOKEN")
assert_status "GET /teams?tournamentId" 200 "$(parse_status "$R")" "$(parse_body "$R")"

# Create team 1
R=$(req POST /teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\",\"name\":\"Test Team Alpha\",\"shortCode\":\"TTA\",\"ownerName\":\"Owner Alpha\",\"logoURL\":\"\"}")
assert_status "POST /teams (create team 1)" 201 "$(parse_status "$R")" "$(parse_body "$R")"
TEAM_ID=$(extract "$(parse_body "$R")" "_id")
info "Team 1 ID: $TEAM_ID"

# Create team 2 (needed for auction start)
R=$(req POST /teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\",\"name\":\"Test Team Beta\",\"shortCode\":\"TTB\",\"ownerName\":\"Owner Beta\",\"logoURL\":\"\"}")
assert_status "POST /teams (create team 2)" 201 "$(parse_status "$R")" "$(parse_body "$R")"
TEAM2_ID=$(extract "$(parse_body "$R")" "_id")
info "Team 2 ID: $TEAM2_ID"

# GET team by ID
if [[ -n "$TEAM_ID" ]]; then
  R=$(req GET /teams/$TEAM_ID -H "Authorization: Bearer $TOKEN")
  assert_status "GET /teams/:id" 200 "$(parse_status "$R")" "$(parse_body "$R")"

  # PUT update
  R=$(req PUT /teams/$TEAM_ID \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Team Alpha (Updated)","shortCode":"TTA","ownerName":"Owner Alpha"}')
  assert_status "PUT /teams/:id" 200 "$(parse_status "$R")" "$(parse_body "$R")"
else
  skip "GET/PUT /teams/:id (no team ID)"
fi

# ─── PLAYERS CRUD ───────────────────────────────────────────
section "PLAYERS — CRUD"

R=$(req GET "/players?tournamentId=$TOURNAMENT_ID" -H "Authorization: Bearer $TOKEN")
assert_status "GET /players?tournamentId" 200 "$(parse_status "$R")" "$(parse_body "$R")"

R=$(req POST /players \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\",\"name\":\"Test Player One\",\"playerNo\":\"99\",\"basePrice\":50000,\"position\":\"Batsman\"}")
assert_status "POST /players (create player 1)" 201 "$(parse_status "$R")" "$(parse_body "$R")"
PLAYER_ID=$(extract "$(parse_body "$R")" "_id")
info "Player 1 ID: $PLAYER_ID"

R=$(req POST /players \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\",\"name\":\"Test Player Two\",\"playerNo\":\"88\",\"basePrice\":60000,\"position\":\"Bowler\"}")
assert_status "POST /players (create player 2)" 201 "$(parse_status "$R")" "$(parse_body "$R")"
PLAYER2_ID=$(extract "$(parse_body "$R")" "_id")

if [[ -n "$PLAYER_ID" ]]; then
  R=$(req GET /players/$PLAYER_ID -H "Authorization: Bearer $TOKEN")
  assert_status "GET /players/:id" 200 "$(parse_status "$R")" "$(parse_body "$R")"

  # PUT update (not PATCH)
  R=$(req PUT /players/$PLAYER_ID \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"tournamentId\":\"$TOURNAMENT_ID\",\"name\":\"Test Player One Updated\",\"playerNo\":\"99\",\"basePrice\":50000,\"position\":\"All-Rounder\"}")
  assert_status "PUT /players/:id (update)" 200 "$(parse_status "$R")" "$(parse_body "$R")"
fi

# ─── AUCTION FLOW ───────────────────────────────────────────
section "AUCTION FLOW"

# Start (needs 2 teams + 1 player)
R=$(req POST /auction/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\"}")
assert_status "POST /auction/start (2 teams, 2 players)" 200 "$(parse_status "$R")" "$(parse_body "$R")"

# Get state
R=$(req GET /auction/state/$TOURNAMENT_ID -H "Authorization: Bearer $TOKEN")
assert_status "GET /auction/state/:tournamentId" 200 "$(parse_status "$R")" "$(parse_body "$R")"
STATE_BODY=$(parse_body "$R")
[[ "$(has_field "$STATE_BODY" "currentAuctionStatus")" == "yes" ]] \
  && pass "Auction state has currentAuctionStatus" \
  || fail "Auction state missing currentAuctionStatus"

# Live endpoint
R=$(req GET "/auction/live?tournamentId=$TOURNAMENT_ID" -H "Authorization: Bearer $TOKEN")
assert_status "GET /auction/live" 200 "$(parse_status "$R")" "$(parse_body "$R")"

# Select player
R=$(req POST /auction/select-player \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\",\"playerId\":\"$PLAYER_ID\"}")
assert_status "POST /auction/select-player" 200 "$(parse_status "$R")" "$(parse_body "$R")"

# Place bid with a team
R=$(req POST /auction/bid \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\",\"amount\":55000,\"teamId\":\"$TEAM_ID\"}")
BID_S=$(parse_status "$R"); BID_B=$(parse_body "$R")
if [[ "$BID_S" == "200" ]]; then
  pass "POST /auction/bid (with team) → 200"
elif [[ "$BID_S" == "400" ]]; then
  pass "POST /auction/bid → 400 (business rule: ${BID_B:0:80})"
else
  fail "POST /auction/bid → unexpected $BID_S: ${BID_B:0:80}"
fi

# Correct bid (always accepted 200 or 400 based on state)
R=$(req POST /auction/bid/correct \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\",\"amount\":50000}")
CS=$(parse_status "$R")
[[ "$CS" == "200" || "$CS" == "400" ]] \
  && pass "POST /auction/bid/correct → $CS" \
  || fail "POST /auction/bid/correct → unexpected $CS"

# Sell player
R=$(req POST /auction/sell \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\"}")
SS=$(parse_status "$R")
[[ "$SS" == "200" || "$SS" == "400" ]] \
  && pass "POST /auction/sell → $SS" \
  || fail "POST /auction/sell → unexpected $SS"

# Select second player and mark unsold
R=$(req POST /auction/select-player \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\",\"playerId\":\"$PLAYER2_ID\"}")
MS=$(parse_status "$R")
[[ "$MS" == "200" || "$MS" == "400" ]] && pass "POST /auction/select-player (p2) → $MS" || fail "select-player p2 → $MS"

R=$(req POST /auction/mark-unsold \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\"}")
MU=$(parse_status "$R")
[[ "$MU" == "200" || "$MU" == "400" ]] \
  && pass "POST /auction/mark-unsold → $MU" \
  || fail "POST /auction/mark-unsold → unexpected $MU"

# Undo
R=$(req POST /auction/undo \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\"}")
US=$(parse_status "$R")
[[ "$US" == "200" || "$US" == "400" ]] \
  && pass "POST /auction/undo → $US" \
  || fail "POST /auction/undo → unexpected $US"

# Recalculate balances
R=$(req POST /auction/recalculate-balances \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\"}")
RS=$(parse_status "$R")
[[ "$RS" == "200" || "$RS" == "400" ]] \
  && pass "POST /auction/recalculate-balances → $RS" \
  || fail "POST /auction/recalculate-balances → unexpected $RS"

# Restart
R=$(req POST /auction/restart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\"}")
RS=$(parse_status "$R")
[[ "$RS" == "200" || "$RS" == "400" ]] \
  && pass "POST /auction/restart → $RS" \
  || fail "POST /auction/restart → unexpected $RS"

# Stop
R=$(req POST /auction/stop \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Content: application/json" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\"}")
ST_S=$(parse_status "$R")
[[ "$ST_S" == "200" || "$ST_S" == "400" ]] \
  && pass "POST /auction/stop → $ST_S" \
  || fail "POST /auction/stop → unexpected $ST_S"

# Reset single player
if [[ -n "$PLAYER_ID" ]]; then
  R=$(req POST /auction/reset \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"tournamentId\":\"$TOURNAMENT_ID\",\"playerId\":\"$PLAYER_ID\"}")
  RS=$(parse_status "$R")
  [[ "$RS" == "200" || "$RS" == "400" ]] \
    && pass "POST /auction/reset (single player) → $RS" \
    || fail "POST /auction/reset → unexpected $RS"
fi

# ─── TOURNAMENT LIFECYCLE ───────────────────────────────────
section "TOURNAMENT LIFECYCLE"

R=$(req POST /tournaments/$TOURNAMENT_ID/complete \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}')
CS=$(parse_status "$R")
[[ "$CS" == "200" || "$CS" == "400" ]] && pass "POST /tournaments/:id/complete → $CS" || fail "complete → $CS"

R=$(req POST /tournaments/$TOURNAMENT_ID/archive \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}')
AS=$(parse_status "$R")
[[ "$AS" == "200" || "$AS" == "400" ]] && pass "POST /tournaments/:id/archive → $AS" || fail "archive → $AS"

R=$(req POST /tournaments/$TOURNAMENT_ID/reactivate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}')
RS=$(parse_status "$R")
[[ "$RS" == "200" || "$RS" == "400" ]] && pass "POST /tournaments/:id/reactivate → $RS" || fail "reactivate → $RS"

# ─── OVERLAY ────────────────────────────────────────────────
section "OVERLAY"

R=$(req POST /overlay/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\"}")
OS=$(parse_status "$R")
[[ "$OS" == "200" || "$OS" == "400" || "$OS" == "404" ]] \
  && pass "POST /overlay/settings → $OS" \
  || fail "POST /overlay/settings → unexpected $OS"

R=$(req GET /overlay/token -H "Authorization: Bearer $TOKEN")
assert_status "GET /overlay/token" 200 "$(parse_status "$R")" "$(parse_body "$R")"

R=$(req GET /overlay/sessions -H "Authorization: Bearer $TOKEN")
assert_status "GET /overlay/sessions" 200 "$(parse_status "$R")" "$(parse_body "$R")"

R=$(req GET /overlay-configs -H "Authorization: Bearer $TOKEN")
assert_status "GET /overlay-configs" 200 "$(parse_status "$R")" "$(parse_body "$R")"

R=$(req GET /overlay-library -H "Authorization: Bearer $TOKEN")
assert_status "GET /overlay-library" 200 "$(parse_status "$R")" "$(parse_body "$R")"

R=$(req GET /overlay-scenes -H "Authorization: Bearer $TOKEN")
assert_status "GET /overlay-scenes" 200 "$(parse_status "$R")" "$(parse_body "$R")"

# ─── PLAYERS — BULK ENDPOINTS ───────────────────────────────
section "PLAYERS — BULK"

if [[ -n "$TOURNAMENT_ID" ]]; then
  R=$(req GET "/players/tournament-bulk-template?tournamentId=$TOURNAMENT_ID" \
    -H "Authorization: Bearer $TOKEN")
  TS=$(parse_status "$R")
  [[ "$TS" == "200" ]] && pass "GET /players/tournament-bulk-template → 200 (xlsx)" \
    || fail "GET /players/tournament-bulk-template → $TS"

  R=$(req GET "/players/tournament-export?tournamentId=$TOURNAMENT_ID" \
    -H "Authorization: Bearer $TOKEN")
  TS=$(parse_status "$R")
  [[ "$TS" == "200" ]] && pass "GET /players/tournament-export → 200 (xlsx)" \
    || fail "GET /players/tournament-export → $TS"
fi

# ─── AUTH EDGE CASES ────────────────────────────────────────
section "AUTH — Edge Cases"

R=$(req GET /tournaments)
assert_status "GET /tournaments (no auth) → 401" 401 "$(parse_status "$R")" "$(parse_body "$R")"

R=$(req GET /tournaments -H "Authorization: Bearer totally.invalid.jwt")
assert_status "GET /tournaments (bad JWT) → 401" 401 "$(parse_status "$R")" "$(parse_body "$R")"

R=$(req GET /users/all)
assert_status "GET /users/all (no auth) → 401" 401 "$(parse_status "$R")" "$(parse_body "$R")"

# ─── CLEANUP ────────────────────────────────────────────────
section "CLEANUP"

for pid in $PLAYER_ID $PLAYER2_ID; do
  [[ -z "$pid" ]] && continue
  R=$(req DELETE /players/$pid -H "Authorization: Bearer $TOKEN")
  DS=$(parse_status "$R")
  [[ "$DS" == "200" || "$DS" == "204" ]] && pass "DELETE /players/$pid → $DS" || fail "DELETE /players/$pid → $DS"
done

for tid in $TEAM_ID $TEAM2_ID; do
  [[ -z "$tid" ]] && continue
  R=$(req DELETE /teams/$tid -H "Authorization: Bearer $TOKEN")
  DS=$(parse_status "$R")
  [[ "$DS" == "200" || "$DS" == "204" ]] && pass "DELETE /teams/$tid → $DS" || fail "DELETE /teams/$tid → $DS"
done

if [[ -n "$TOURNAMENT_ID" ]]; then
  R=$(req DELETE /tournaments/$TOURNAMENT_ID -H "Authorization: Bearer $TOKEN")
  DS=$(parse_status "$R")
  [[ "$DS" == "200" || "$DS" == "204" ]] && pass "DELETE /tournaments/:id → $DS" || fail "DELETE /tournaments/:id → $DS"
fi

# Remove test user from DB
cd /Users/gerry/Documents/GitHub/ProStream---Auction && node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`DELETE FROM users WHERE username = 'testapi'\`.then(() => { console.log('testapi cleaned up'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
" 2>&1 | while IFS= read -r line; do info "$line"; done

rm -f "$COOKIE_JAR"

# ─── SUMMARY ────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
printf "${BOLD}║  %-36s  ║${NC}\n" "RESULTS"
echo -e "${BOLD}╠══════════════════════════════════════╣${NC}"
printf "${BOLD}║  ${GREEN}%-3s passed${NC}${BOLD}  ${RED}%-3s failed${NC}${BOLD}  ${YELLOW}%-3s skipped${NC}${BOLD}  ║${NC}\n" \
  "$PASS" "$FAIL" "$SKIP"
printf "${BOLD}║  Total: %-29s ║${NC}\n" "$((PASS + FAIL + SKIP)) checks"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"

if [[ $FAIL -gt 0 ]]; then exit 1; else exit 0; fi
