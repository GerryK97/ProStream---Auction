# ProStream Auction

A real-time cricket player auction platform built with Next.js. Manage tournaments, teams, and players with live bidding, OBS-compatible overlays, and instant Pusher-powered updates across all connected clients.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frameworks | Next.js 15.5 (App Router) |
| UI | React 19, Tailwind CSS 3.4 |
| Database | MongoDB 6 via Mongoose 8 |
| Real-time | Pusher 5 (server) + Pusher-JS 8 (client) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| File Storage | Cloudinary |
| Excel | xlsx |
| PDF | @react-pdf/renderer, pdfkit |
| AI | Google Generative AI (background removal) |
| Language | TypeScript 5.8 |

---

## Features Overview

- **Tournament Management** — create and configure tournaments with full player class, budget, and bidding rule support
- **Team Management** — register teams with budgets, logos, and owner details
- **Player Management** — add players individually or via bulk Excel import, with rich cricket profile fields
- **Live Auction** — real-time bidding engine with bid increments, undo, re-auction, and class-based auctioning
- **OBS Overlays** — 4 overlay types (full-screen, custom ticker, fullscreen2, team owner) broadcast-ready via browser source
- **Overlay Settings** — live-configurable widgets, themes, palettes, and ticker content without page reload
- **Invoice Module** — built-in invoicing and quotation system (InvoiceIT) with PDF export
- **Role-based Auth** — Admin, Tournament, MasterManager, Team, Player, Audience roles

---

## Pages & Routes

### Public / Auth
| Route | Description |
|---|---|
| `/auth/login` | Username + password login |
| `/auth/signup` | New user registration (requires admin approval) |
| `/auth/unauthorized` | Access denied page |

### Management
| Route | Description |
|---|---|
| `/manage/tournaments` | Create, edit, delete and configure tournaments |
| `/manage/teams` | Create, edit, delete teams per tournament |
| `/manage/players` | Add, edit, bulk import/export, delete players |
| `/manage/auction-results` | Review and manually correct final auction results |

### Auction
| Route | Description |
|---|---|
| `/auction` | Main auction control interface (AuctionControlPanel) |
| `/auction/setup` | Pre-auction configuration page |

### Overlays (OBS Browser Source)
| Route | Description |
|---|---|
| `/overlays/[id]` | FullScreenOverlay — immersive broadcast display |
| `/overlays/[id]/custom` | CustomOverlay — flexible widget + ticker layout |
| `/overlays/[id]/fullscreen2` | FullScreenOverlay2 — alternate broadcast layout |
| `/overlays/[id]/team-owner` | TeamOwnerOverlay — per-team dashboard for owners |

### InvoiceIT Module
| Route | Description |
|---|---|
| `/invoiceit/invoices` | List, create, view and edit invoices |
| `/invoiceit/quotations` | List, create, view and edit quotations |
| `/invoiceit/reports` | Invoice and quotation statistics |

### Admin
| Route | Description |
|---|---|
| `/users` | User management (admin only) |

---

## Tournament Configuration

Each tournament supports the following settings:

### Basic Settings
- **Name & Year** — tournament identity
- **Budget Per Team** — initial balance assigned to every team
- **Squad Size** — max players per team
- **Base Price Per Player** — minimum starting bid
- **Logo** — uploaded via Cloudinary

### Player Class System (optional)
Enable to group players into classes (e.g. Elite, Premium, Regular):
- Per-class: code, name, color, icon, base price, display order
- Pricing strategy: `tournament-level` (flat) or `player-class-based` (per class)

### Bidding Configuration
- **Bidding Mode**: `direct` (individual bids) or `team` (team aggregate)
- **Bid Increments**: tiered rules — e.g. up to 100k increments by 5k, above 100k increments by 10k

### Display & Theme
- **Overlay Theme**: `standard` | `premium` | `neon`
- **Overlay Palette**: color palette for overlays

### Player Profile Fields (what shows in overlays)
- `showAge` — display player age
- `showBattingStyle` — display batting hand
- `showBowlingStyle` — display bowling style
- `statFields[]` — custom stat columns (e.g. Matches, Average, Strike Rate)

### Tournament Status Lifecycle
`Draft` → `Setup` → `Pending` → `Live` → `Paused` → `Stopped` → `Completed` → `Archived`

---

## Player Fields

| Field | Type | Description |
|---|---|---|
| `name` | string | Player full name (required) |
| `playerNo` | string | Auto-sequential per tournament (001, 002…) |
| `position` | string | Batsman, Bowler, All-rounder, Wicket-keeper, etc. |
| `currentClub` | string | Club/franchise affiliation |
| `playerClass` | string | Class code (if player classes enabled) |
| `age` | number | Player age |
| `battingStyle` | string | Right-handed / Left-handed |
| `bowlingStyle` | string | Right-arm Fast, Left-arm Spin, Leg-spin, etc. |
| `stats` | Map | Custom key-value stat fields |
| `photoURL` | string | Primary photo (Cloudinary) |
| `secondaryImageURL` | string | Secondary/alternate photo |
| `isIconic` | boolean | Iconic player flag |
| `isSold` | boolean | Set when player is auctioned off |
| `isUnsold` | boolean | Set when player is passed/unsold |
| `finalPrice` | number | Hammer price |
| `winningTeamId` | string | Team that purchased the player |

---

## Auction Lifecycle

```
Start → Select Player → Bid(s) → Sell / Mark Unsold → [Repeat]
                                         ↕
                                       Undo
```

### Auction Actions

| Action | API | Description |
|---|---|---|
| Start | `POST /api/auction/start` | Initialise auction state for tournament |
| Select Player | `POST /api/auction/select-player` | Set current player for bidding |
| Place Bid | `POST /api/auction/bid` | Record a team's bid |
| Correct Bid | `POST /api/auction/bid/correct` | Override last bid (admin) |
| Sell | `POST /api/auction/sell` | Confirm sale, deduct team balance |
| Mark Unsold | `POST /api/auction/mark-unsold` | Pass player without sale |
| Undo | `POST /api/auction/undo` | Reverse last sale or unsold action |
| Reset Current | `POST /api/auction/reset` | Return current player to available |
| Reset All | `POST /api/auction/reset-all` | Full tournament auction reset |
| Re-auction | `POST /api/auction/re-auction` | Return sold player for re-bidding |
| Stop | `POST /api/auction/stop` | Pause auction |
| Restart | `POST /api/auction/restart` | Resume paused auction |
| Select Class | `POST /api/auction/select-class` | Set active player class |
| Edit Result | `PATCH /api/auction/edit-player-result` | Manually correct a sold result |

### Real-time Pusher Events

All auction actions broadcast events on channel `tournament-{id}`:

| Event | Trigger |
|---|---|
| `auction:started` | Auction started |
| `auction:stopped` | Auction paused |
| `auction:restarted` | Auction resumed |
| `player:selected` | Player set for bidding |
| `bid:placed` | New bid recorded |
| `player:sold` | Player sold to team |
| `auction:reset` | Current auction reset |
| `auction:undo` | Last action reversed |
| `player:unsold` | Player marked unsold |
| `class:selected` | Player class activated |
| `class:completed` | All players in class auctioned |
| `overlay:settings` | Overlay config updated live |
| `overlay:spin` | Wheel spin animation triggered |
| `auction:wake` | Keep-alive ping |

---

## Overlays

All overlays are browser-source compatible (designed for OBS/vMix at 1920×1080).

### FullScreenOverlay (`/overlays/[id]`)
Full-screen immersive auction display. Shows the current player card, live bid, winning team, and configurable widgets. Optimised for broadcast streaming.

### CustomOverlay (`/overlays/[id]/custom`)
Flexible layout combining a ticker strip with overlay widgets. Supports:
- **Widgets**: premium player card, sold summary, team summary, team-wise summary, resting timer, top 10 players, wheel spin
- **Ticker modes**: all players / sold only / available only / custom lines (2-line rotating)
- **Team cards panel**: toggle on/off with size control (small / medium / large)
- **Sold message overlays**: multiple position and style options

### FullScreenOverlay2 (`/overlays/[id]/fullscreen2`)
Alternative fullscreen layout with toast-style sold messages (bottom-right) and a different widget arrangement.

### TeamOwnerOverlay (`/overlays/[id]/team-owner`)
Per-team owner dashboard. Selectable team dropdown, shows:
- Squad count vs target
- Remaining budget and max bid
- Full list of players purchased by that team
- Colour-coded warnings (low budget, squad near full)

---

## Player Bulk Import

Download the Excel template from **Manage → Players → Download Template**. The template columns are generated dynamically based on the tournament's configured fields (batting/bowling style, stat columns).

Required columns: `Player No`, `Name`, `Position`
Optional columns: `Current Club`, `Player Class`, `Age`, `Batting Style`, `Bowling Style`, `Photo URL`, + any configured stat fields

Upload the filled template via **Manage → Players → Bulk Add**.

---

## API Reference

### Auction
| Method | Route | Description |
|---|---|---|
| POST | `/api/auction/start` | Start auction |
| POST | `/api/auction/select-player` | Select player for bidding |
| POST | `/api/auction/select-class` | Activate player class |
| DELETE | `/api/auction/select-class` | Deactivate class |
| POST | `/api/auction/bid` | Place bid |
| POST | `/api/auction/bid/correct` | Override bid |
| POST | `/api/auction/sell` | Sell player |
| POST | `/api/auction/mark-unsold` | Mark player unsold |
| POST | `/api/auction/undo` | Undo last action |
| POST | `/api/auction/reset` | Reset current auction |
| POST | `/api/auction/reset-all` | Full reset |
| POST | `/api/auction/stop` | Pause auction |
| POST | `/api/auction/restart` | Resume auction |
| POST | `/api/auction/re-auction` | Re-auction sold player |
| PATCH | `/api/auction/edit-player-result` | Edit result manually |
| GET | `/api/auction/state/[tournamentId]` | Get current auction state |

### Tournaments
| Method | Route | Description |
|---|---|---|
| GET | `/api/tournaments` | List tournaments |
| POST | `/api/tournaments` | Create tournament |
| GET | `/api/tournaments/active` | Get active tournament |
| GET | `/api/tournaments/[id]` | Get tournament |
| PUT | `/api/tournaments/[id]` | Update tournament |
| DELETE | `/api/tournaments/[id]` | Delete tournament |
| GET | `/api/tournaments/[id]/status` | Get status |
| POST | `/api/tournaments/[id]/archive` | Archive |
| POST | `/api/tournaments/[id]/complete` | Mark complete |
| POST | `/api/tournaments/[id]/reactivate` | Reactivate |
| POST | `/api/tournaments/[id]/transfer-ownership` | Transfer ownership |

### Teams
| Method | Route | Description |
|---|---|---|
| GET | `/api/teams` | List teams |
| POST | `/api/teams` | Create team |
| GET | `/api/teams/[id]` | Get team |
| PUT | `/api/teams/[id]` | Update team |
| DELETE | `/api/teams/[id]` | Delete team |
| POST | `/api/teams/bulk-delete` | Bulk delete teams |

### Players
| Method | Route | Description |
|---|---|---|
| GET | `/api/players` | List players |
| POST | `/api/players` | Create player |
| GET | `/api/players/[id]` | Get player |
| PUT | `/api/players/[id]` | Update player |
| DELETE | `/api/players/[id]` | Delete player |
| GET | `/api/players/[id]/auction-status` | Get auction status |
| POST | `/api/players/bulk-add-to-tournament` | Bulk import from Excel |
| POST | `/api/players/bulk-delete` | Bulk delete players |
| GET | `/api/players/tournament-bulk-template` | Download Excel template |
| GET | `/api/players/tournament-export` | Export players to Excel |

### Overlays
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/overlay-configs` | List / create overlay configs |
| GET/PUT/DELETE | `/api/overlay-configs/[id]` | Get / update / delete config |
| POST | `/api/overlay-configs/[id]/duplicate` | Clone config |
| POST | `/api/overlay-configs/[id]/lock` | Lock config |
| GET | `/api/overlay-configs/[id]/history` | Config change history |
| GET/POST | `/api/overlay-scenes` | List / create scenes |
| GET/PUT/DELETE | `/api/overlay-scenes/[id]` | Get / update / delete scene |
| GET/POST | `/api/overlay-library` | List / create library items |
| PUT/DELETE | `/api/overlay-library/[id]` | Update / delete library item |
| POST | `/api/overlay-library/seed` | Seed default library |
| POST | `/api/overlay/settings` | Push overlay settings to clients |
| POST | `/api/overlay/spin` | Trigger wheel spin |
| GET | `/api/overlay/token` | Get overlay auth token |

### Auth & Users
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/logout` | Logout |
| GET/POST | `/api/auth/session` | Get / refresh session |
| GET/POST | `/api/users` | List / create users (admin) |
| GET/PUT | `/api/users/[id]` | Get / update user |
| POST | `/api/users/approve` | Approve pending user |

### Utility
| Method | Route | Description |
|---|---|---|
| POST | `/api/upload` | Upload image to Cloudinary |
| POST | `/api/remove-background` | AI background removal |

---

## User Roles & Permissions

| Role | Access |
|---|---|
| `Admin` | Full access to all tournaments and system settings |
| `MasterManager` | Supervise multiple tournaments |
| `Tournament` | Create and manage own tournaments |
| `Team` | Team management only |
| `Player` | Own profile only |
| `Audience` | Read-only |

User status: `Active` | `PendingApproval` | `Suspended`

---

## Environment Variables

```env
MONGODB_URI=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
JWT_SECRET=
GOOGLE_AI_API_KEY=
```

---

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

---

## InvoiceIT Module

A built-in invoicing system accessible at `/invoiceit`:

- **Invoices** — create, edit, record payments, export to PDF
- **Quotations** — create estimates, convert to invoices
- **Customers** — customer directory linked to invoices/quotations
- **Reports** — revenue stats, outstanding balances

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/                # All API endpoints
│   ├── auction/            # Auction control pages
│   ├── auth/               # Login, signup, unauthorized
│   ├── invoiceit/          # InvoiceIT module pages
│   ├── manage/             # Tournament, team, player management
│   ├── overlays/           # OBS overlay pages
│   └── users/              # User management (admin)
├── components/             # Shared React components
│   └── overlays/           # Overlay components
│       └── auction-overview/  # Auction overview sub-components
├── config/                 # App-wide config (palettes, constants)
├── hooks/                  # Custom React hooks (usePusherAuction, etc.)
├── lib/                    # Utilities (mongodb, pusher, auth, etc.)
├── models/                 # Mongoose models (Tournament, Team, Player, etc.)
└── types/                  # TypeScript type definitions
scripts/                    # DB repair and utility scripts
```
