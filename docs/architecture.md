# ProStream Auction — Architecture

## Summary

ProStream Auction is a Next.js App Router application for cricket auction management, output overlays, wallet-backed paid overlay sessions, user management, and the InvoiceIT module. It integrates with the Expo app as the Auction/Auth/Wallet API backend and shares user/wallet data with Scoreboard through Neon Postgres.

The key architectural boundary remains:

- **System UI**: management pages, auction controls, InvoiceIT, wallet, users, admin controls.
- **Overlay Output**: OBS/browser-source routes under `/overlays/...`, intentionally isolated from app chrome and system UI themes.

## Current top-level app areas

```text
src/app/
├── api/                         # JSON/API routes
│   ├── auth/                    # login/logout/session/signup
│   ├── auction/                 # live auction operations
│   ├── tournaments/             # tournament CRUD + active
│   ├── teams/                   # team CRUD + bulk delete
│   ├── players/                 # player CRUD + bulk/import/export
│   ├── overlay/                 # sessions/settings/prices/token/spin
│   ├── overlay-configs/         # overlay config CRUD
│   ├── overlay-library/         # overlay library + seed
│   ├── overlay-scenes/          # overlay scene CRUD
│   ├── wallet/                  # wallet balance + transactions
│   ├── users/                   # user CRUD/profile/approval/password
│   ├── push/                    # register/unregister push token
│   ├── invoices/ quotations/    # InvoiceIT APIs
│   ├── customers/ reports/      # InvoiceIT support APIs
│   ├── upload/ remove-background/
│   └── admin/notifications, admin/overlay-prices
├── auction/                     # auction control page + setup
├── manage/                      # tournament/team/player/output management
├── output/                      # Output selector page
├── overlays/                    # overlay browser-source outputs
├── invoiceit/                   # InvoiceIT pages
├── wallet/                      # web wallet
├── profile/ users/ contact/
└── auth/                        # login/signup/unauthorized
```

## Important routes

### Management flow

```text
/manage/tournaments  -> step 1
/manage/teams        -> step 2
/manage/players      -> step 3
/output              -> step 4 overlays/output selection
/auction             -> step 5 auction control
```

Only these step pages show the step progress component. Non-step pages such as auction results do not show it.

### Output / overlay selection

`/output` currently lists layouts in this order:

1. Custom Overlay — locked/display-only
2. Team Owners Overlay — locked/display-only
3. Full Screen — selectable
4. Full Screen 2 — selectable

The selector behaves as a single-choice/radio-style control for selectable full-screen outputs.

### Sidebar / navigation

Current management sidebar order keeps **Overlays** immediately after **Players**. The Overlays nav item is visible to all roles (`roles: null`), while individual pages still apply their own authorization rules.

InvoiceIT navigation is visible to all users, with restricted pages enforcing Admin/Tournament-style permissions where applicable.

## Auction flow

```text
Start auction -> select class/player -> bids -> sell/unsold -> repeat
                                      -> undo/re-auction/edit result as needed
```

Key API operations live under `src/app/api/auction/`:

- `start`, `stop`, `restart`, `reset`, `reset-all`
- `select-class`, `select-player`
- `bid`, `undo`
- `sell`, `mark-unsold`, `re-auction`, `edit-player-result`
- `live`, `state`, `recalculate-balances`

Client auction logic is shared by `hooks/useAuction.tsx`, `hooks/usePusherAuction.tsx`, and auction components under `src/components/auction/`.

## Overlay architecture

### Overlay routes

```text
/overlays/[id]             # Full Screen overlay
/overlays/[id]/custom      # Custom overlay
/overlays/[id]/fullscreen2 # Full Screen 2 overlay
/overlays/[id]/team-owner  # Team owner overlay
```

Overlay routes bypass app chrome and are intended for OBS/browser-source usage.

### Overlay controls and paid sessions

Paid overlay/session creation is wallet-backed through:

- `POST /api/overlay/sessions`
- `GET /api/overlay/prices`
- `GET/PATCH /api/overlay/settings`
- `POST /api/overlay/token`
- `POST /api/overlay/spin`

Chargeable overlay types and pricing keys:

| Overlay type | Pricing key |
|---|---|
| `custom` | `auction_overlay_custom` |
| `fullscreen` | `auction_overlay_fullscreen` |
| `fullscreen2` | `auction_overlay_fullscreen2` |
| `team_owners` | `auction_overlay_team_owners` |

The server uses a deduct-first/create-second flow. If Neon wallet deduction succeeds but Mongo overlay-session creation fails, the server attempts an automatic refund transaction.

## Data stores

| Store | Used for |
|---|---|
| MongoDB/Mongoose | Auction domain data: tournaments, teams, players, auction state, overlays |
| Neon Postgres | Shared users, wallets, wallet transactions, pricing config |

Shared wallet code:

```text
src/lib/pg/users-schema.ts
src/lib/pg/wallet-queries.ts
```

## Expo app integration

The Expo app uses this project as its Auction/Auth/Wallet backend via:

```env
EXPO_PUBLIC_API_BASE_URL=https://prostream-auction.vercel.app
```

Important API groups consumed by Expo:

- `/api/auth/login`, `/api/auth/session`, `/api/auth/logout`
- `/api/tournaments`, `/api/tournaments/active`, `/api/tournaments/:id`
- `/api/teams`, `/api/players`
- `/api/wallet`, `/api/wallet/transactions`
- `/api/users/profile`, `/api/users/change-password`
- `/api/users/all` / tournament assignment APIs for admin features

## Theme and design boundaries

- System UI theme tokens live in app CSS and shared components.
- Overlay themes and palettes are isolated in overlay renderer/config files.
- Do not let overlay palette variables leak into System UI.
- Do not wrap overlay output pages with normal app chrome.

## Known debt

- Some inline styles remain in System UI pages.
- Overlay/theme code is more mature than general page-level component extraction.
- Automated visual regression coverage is limited.
