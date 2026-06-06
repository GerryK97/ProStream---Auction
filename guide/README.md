# ProStream Auction — Project Guide

ProStream Auction is the web platform for cricket player auctions. It manages tournaments, teams, players, live bidding, broadcast overlays, user/admin controls, wallet-backed overlay sessions, and InvoiceIT documents.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router |
| UI | React, Tailwind CSS |
| Auction DB | MongoDB / Mongoose |
| Shared user/wallet DB | Neon Postgres |
| Realtime | Pusher |
| Auth | JWT cookies |
| Uploads | Cloudinary |
| PDF / docs | InvoiceIT PDF tooling |

## Main navigation structure

### Management steps

```text
1. /manage/tournaments
2. /manage/teams
3. /manage/players
4. /output
5. /auction
```

The step-progress UI appears only on those assigned pages.

### Sidebar notes

- Overlays appears immediately after Players.
- Overlays is visible to all roles in navigation (`roles: null`).
- InvoiceIT navigation remains visible broadly, while page access is still permission-checked.

## Core pages

| Route | Purpose |
|---|---|
| `/manage/tournaments` | Create/configure tournaments |
| `/manage/teams` | Manage tournament teams |
| `/manage/players` | Manage players, bulk import/export |
| `/manage/auction-results` | Review/manual correction of results |
| `/output` | Select output/overlay layout |
| `/auction` | Live auction control panel |
| `/auction/setup` | Pre-auction setup |
| `/wallet` | Shared wallet balance/history |
| `/users` | User management |
| `/profile` | Current user profile |
| `/invoiceit/*` | InvoiceIT module |

## Output selector

Current `/output` layout order:

1. Custom Overlay — locked/display-only
2. Team Owners Overlay — locked/display-only
3. Full Screen — selectable
4. Full Screen 2 — selectable

The full-screen layouts behave as radio-style single selection.

## OBS/browser-source overlays

| Route | Description |
|---|---|
| `/overlays/[id]` | Full Screen overlay |
| `/overlays/[id]/custom` | Custom overlay |
| `/overlays/[id]/fullscreen2` | Full Screen 2 overlay |
| `/overlays/[id]/team-owner` | Team owner dashboard overlay |

Overlay pages are output-only and should not render app shell/sidebar/chrome.

## API groups

```text
/api/auth/*
/api/auction/*
/api/tournaments/*
/api/teams/*
/api/players/*
/api/overlay/*
/api/overlay-configs/*
/api/overlay-library/*
/api/overlay-scenes/*
/api/wallet/*
/api/users/*
/api/push/*
/api/upload
/api/remove-background
/api/invoices/*
/api/quotations/*
/api/customers/*
/api/reports/*
```

## Wallet integration

The Auction app shares wallet/user infrastructure with Scoreboard and Expo.

- Wallet balance and immutable wallet transactions live in Neon Postgres.
- Auction domain data remains in MongoDB.
- Overlay session purchases deduct wallet credits on the server.
- Expo Wallet tab consumes `/api/wallet` from this app.

## Expo app integration

The Expo app points to this backend via:

```env
EXPO_PUBLIC_API_BASE_URL=https://prostream-auction.vercel.app
```

Expo consumes:

- auth/session APIs
- tournament/team/player APIs
- wallet APIs
- profile/password APIs
- admin/tournament access APIs

## Development notes

- Keep System UI and Overlay Output styles separate.
- Keep output/overlay routes OBS-safe and chrome-free.
- Do not expose wallet deductions on the client; server writes transaction rows.
- Use Pusher for realtime auction and overlay updates.
- Use Cloudinary IDs/URLs consistently for logos/player images.

## Related docs

| File | Purpose |
|---|---|
| `docs/architecture.md` | Current architecture and integration boundaries |
| `docs/design-system.md` | System UI design notes |
| `docs/overlay-theme-system.md` | Overlay theme/palette system |
| `docs/theming-guide.md` | Theme implementation guidance |
| `docs/testing-checklist.md` | Manual regression checklist |
| `guide/OVERLAY_SETUP_GUIDE.md` | OBS/output setup notes |
