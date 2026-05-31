# ProStream Auction — Android App Implementation Plan

## Overview
The Android app connects to the existing ProStream Auction backend.
It shares the same login credentials, REST APIs, and real-time Pusher events as the web app.

---

## Tech Stack (Recommended)
- **Language**: Kotlin
- **Architecture**: MVVM + Repository
- **HTTP**: Retrofit 2 + OkHttp
- **Real-time**: `pusher-java-client` (official Android SDK)
- **Auth storage**: `EncryptedSharedPreferences`
- **Image loading**: Coil or Glide
- **UI**: Jetpack Compose (or XML layouts)

---

## 1. Authentication

### Login
- **Endpoint**: `POST /api/auth/login`
- **Body**: `{ "username": "...", "password": "..." }`
- **Response**: `{ "token": "<JWT>", "user": { "_id", "username", "role", "assignedTeams", "assignedTournaments" } }`
- Store JWT in `EncryptedSharedPreferences` — expires in **7 days**
- On every app resume call `GET /api/auth/session` to validate token

### Request Auth Header
All protected API calls must include:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Logout
- `POST /api/auth/logout`
- Clear local token and navigate to Login screen

---

## 2. App Flow by Role

| Role | App Behaviour |
|------|--------------|
| `Team` | Sees bid screen for their assigned team only. Can place bids in team mode. No sell/reset controls. |
| `Tournament` / `Admin` | Full auctioneer controls: bid, sell, reset, unsold, spin wheel, select player. |
| `Audience` | Read-only view: current player, bid, teams. No action buttons. |

---

## 3. Screens

### Screen 1 — Login
- Username + Password fields
- Login button → `POST /api/auth/login`
- Show error on 401 (invalid credentials) / 403 (suspended)
- On success → navigate to Tournament List

### Screen 2 — Tournament List
- `GET /api/tournaments/active`
- List of live tournaments (name, status badge)
- Tap → navigate to Auction Screen for that tournament

### Screen 3 — Auction Screen (Main)
Tab layout:
- **Tab 1: Current Auction** (default)
- **Tab 2: Teams**
- **Tab 3: Players**

---

## 4. Tab 1 — Current Auction

### Player Info Bar (always visible, all roles)
| Field | Source |
|-------|--------|
| Photo | `currentPlayer.photoURL` |
| #Number + Name | `currentPlayer.playerNo`, `currentPlayer.name` |
| Class badge | `currentPlayer.playerClass` (coloured chip) |
| Position · Base price | `currentPlayer.position`, tournament `basePricePerPlayer` |
| **Current Bid** (large, prominent) | `auctionState.currentBid` — updates via Pusher in real-time |
| Status chip | `auctionState.currentAuctionStatus`: `BIDDING ACTIVE` (yellow) / `PLAYER SOLD` (green) / `BIDDING PENDING` (grey) |

---

### Bidding Panel — Team Mode (`biddingMode === "team"`)

#### Next Bid Bar (read-only)
| Control | Value |
|---------|-------|
| **Next Bid** | `currentBid + bracket.increment` (or `basePricePerPlayer` if first bid) |
| **Increment** | e.g. "+5,000" |

**Next bid formula**:
```
Find first bracket where currentBid < upTo → nextBid = currentBid + bracket.increment
If currentBid == 0 → nextBid = basePricePerPlayer
```

#### Team Buttons Grid (3 columns)
One button per team:

| Element | Detail |
|---------|--------|
| Team logo | `team.logoURL` (circular, 36dp) |
| Short code | `team.shortCode` |
| Max affordable bid | `currentBalance - reserved_for_remaining_slots` |
| **LEADING** state | Highlighted border + "● LEADING" — when `auctionState.history.last().teamId == team._id` |
| **Can't Bid** state | Red border, disabled — when `maxBid < nextBidAmount` |
| **Disabled** state | Greyed out when player is sold or request in progress |

**Tap action**: `POST /api/auction/bid` with `{ tournamentId, teamId: team._id, amount: nextBidAmount }`

**Max bid formula** (mirrors web app):
```
remainingSlots = squadSize - playersPurchased.length
if remainingSlots <= 1:
    maxBid = currentBalance
else:
    maxBid = currentBalance - (remainingSlots - 1) × minClassBasePrice
```

> **Team role users**: The server auto-assigns `teamId` from their account — the Android app still sends `teamId` in the request for UX consistency.

---

### Bidding Panel — Direct Mode (`biddingMode === "direct"`)
*(Auctioneer role only — Tournament / Admin)*

#### Quick Bid Buttons (6 buttons in a row)
Fixed increments: **+1K · +5K · +10K · +20K · +25K · +50K**
- Tap: places bid at `currentBid + increment` (or `basePricePerPlayer` if first bid)
- Disabled when player is sold

#### Custom / Correct Bid Input
| Control | Behaviour |
|---------|-----------|
| Number input field | Enter any amount |
| **Set** button | `POST /api/auction/bid` — shown when `amount > currentBid` |
| **Correct** button (orange) | `POST /api/auction/bid/correct` — shown when `amount < currentBid` |

---

### Finalize Section (Auctioneer role only — Tournament / Admin)

#### Team Selector Dropdown
- List of all teams
- Required before Sell button is enabled
- Disabled if `currentBid == 0` or player already sold

#### Action Buttons (4 buttons)
| Button | Colour | API Endpoint | Body | Enabled When |
|--------|--------|-------------|------|--------------|
| **Sell** | Green | `POST /api/auction/sell` | `{ tournamentId, teamId }` | bid > 0, team selected, not sold |
| **Reset** | Red | `POST /api/auction/reset` | `{ tournamentId }` | not sold |
| **Unsold** | Orange | `POST /api/auction/mark-unsold` | `{ tournamentId }` | not sold |
| **Spin** | Purple | `POST /api/overlay/spin` | `{ tournamentId }` | not bidding, not spinning |

---

## 5. Tab 2 — Teams

Each team card shows:
- Logo, name, short code
- Budget balance remaining
- Players purchased / squad size target
- Budget spent % progress bar
- **Red highlight** when `currentBid > maxBid` (team can no longer afford current bid)

**Auctioneer only**: Undo last sale button → `POST /api/auction/undo` `{ tournamentId }`

---

## 6. Tab 3 — Players

Three sections/tabs:
| Section | Filter |
|---------|--------|
| **Available** | `isSold == false && isUnsold == false` |
| **Sold** | `isSold == true` — show final price + winning team logo |
| **Unsold** | `isUnsold == true` |

Data source: `GET /api/players?tournamentId=<id>`

---

## 7. Real-Time (Pusher)

### Dependency
```groovy
// build.gradle (app)
implementation 'com.pusher:pusher-java-client:2.4.0'
```

### Setup
```kotlin
val options = PusherOptions().setCluster(PUSHER_CLUSTER)
val pusher = Pusher(PUSHER_KEY, options)
pusher.connect()
val channel = pusher.subscribe("tournament-$tournamentId")
```

### Pusher Credentials
Obtain from the ProStream web environment variables:
- `NEXT_PUBLIC_PUSHER_KEY` → `PUSHER_KEY`
- `NEXT_PUBLIC_PUSHER_CLUSTER` → `PUSHER_CLUSTER`

### Events to Handle

| Event | Action in App |
|-------|--------------|
| `auction:player-selected` | Refresh player info bar; reset bid amount display |
| `auction:bid-placed` | Update `currentBid`; highlight leading team button |
| `auction:player-sold` | Show sold chip; update team balances |
| `auction:started` | Full state refresh (teams, players, auctionState) |
| `auction:stopped` | Show "Auction Paused" banner |
| `auction:restarted` | Hide paused banner |
| `auction:reset` | Reset bid to 0; clear LEADING highlight |
| `auction:state-update` | Generic full state refresh |

### Parsing Events
All events wrap their data in:
```json
{ "tournamentId": "...", "timestamp": 1700000000000, ...eventSpecificData }
```

Parse `data` field as JSON — use Gson or Moshi.

---

## 8. Backend Changes Made (ProStream Web)

| # | Change | File | Description |
|---|--------|------|-------------|
| 1 | CORS headers | `next.config.js` | Allows Android HTTP client calls from any origin |
| 2 | Bid auth + permission | `src/app/api/auction/bid/route.ts` | Added JWT auth; allows `Team` role to place bids |
| 3 | Auto-assign teamId | `src/app/api/auction/bid/route.ts` | `Team` role users get `teamId` from `assignedTeams[0]` server-side |
| 4 | New live endpoint | `src/app/api/auction/live/route.ts` | `GET /api/auction/live?tournamentId=` returns tournament + state + player + teams in one call |

---

## 9. API Quick Reference

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/login` | None | Login |
| GET | `/api/auth/session` | Bearer | Validate token / get user |
| POST | `/api/auth/logout` | Bearer | Logout |
| GET | `/api/tournaments/active` | Bearer | List live tournaments |
| GET | `/api/auction/live?tournamentId=` | Bearer | Bootstrap all auction data (new) |
| GET | `/api/auction/state/[tournamentId]` | Bearer | Get auction state only |
| POST | `/api/auction/bid` | Bearer | Place bid |
| POST | `/api/auction/sell` | Bearer | Sell player to team |
| POST | `/api/auction/reset` | Bearer | Reset current player bid |
| POST | `/api/auction/mark-unsold` | Bearer | Mark player unsold |
| POST | `/api/auction/undo` | Bearer | Undo last sale |
| POST | `/api/overlay/spin` | Bearer | Trigger wheel spin |
| GET | `/api/teams?tournamentId=` | Bearer | Get all teams |
| GET | `/api/players?tournamentId=` | Bearer | Get all players |

### Base URLs
```
Production:  https://<your-domain>
Emulator:    http://10.0.2.2:3000   (maps to localhost on host machine)
Device:      http://<host-local-ip>:3000
```

---

## 10. Security Notes
- Store JWT in `EncryptedSharedPreferences` — never in plain SharedPreferences
- Always send `Authorization: Bearer <token>` — never hardcode credentials
- Token expires in **7 days** — re-prompt login on `401` from session check
- `Team` role users are blocked server-side from sell/reset/unsold/spin (returns `403`)
- Use HTTPS in production; HTTP only for local development/emulator
