# ProStream Auction — Architecture

## Summary

ProStream Auction is a Next.js App Router application for cricket auction management, output overlays, wallet-backed paid overlay sessions, user management, and the InvoiceIT module. It integrates with the Expo app as the Auction/Auth/Wallet API backend and shares user/wallet data with Scoreboard through Neon Postgres.

The key architectural boundary remains:

- **System UI**: management pages, auction controls, InvoiceIT, wallet, users, admin controls.
- **Overlay Output**: OBS/browser-source routes under `/overlays/...`, intentionally isolated from app chrome and system UI themes.

## Shared utilities package

The Auction app consumes `@prostream/shared` (installed via `file:../prostream-shared`).

| Import path | Contents |
|---|---|
| `@prostream/shared/phone` | `normalizeMobile`, `isValidE164`, `maskPhone` |
| `@prostream/shared/sms` | `sendSMS` (text.lk v3), `generateOTP` |
| `@prostream/shared/otp` | `createOtpRecord`, `getLatestOtpRecord`, `checkCooldown`, `validateOtpRecord`, `incrementOtpAttempts`, `markOtpVerified`, OTP constants |

`src/lib/textlk.ts` is a thin re-export shim that re-exports from `@prostream/shared` for backward compatibility.

## Current top-level app areas

```text
src/app/
├── api/                         # JSON/API routes
│   ├── auth/                    # login/logout/session/signup
│   │   ├── otp/send/            # POST — send OTP SMS to user's mobile
│   │   └── otp/verify/          # POST — verify OTP and mark phone verified
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

1. Custom Overlay — optional selectable
2. Team Owners Overlay — optional selectable
3. Full Screen — selectable fullscreen option
4. Full Screen 2 — selectable fullscreen option

Custom Overlay and Team Owners Overlay can be selected independently. Full Screen and Full Screen 2 are mutually exclusive, so users can generate at most one full-screen layout in the same selection set.

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

### Neon schema additions (OTP / phone verification)

Two columns/tables were added to Neon to support mobile OTP verification:

**`users` table additions:**

| Column | Type | Notes |
|---|---|---|
| `phone_verified` | `BOOLEAN DEFAULT FALSE` | Set to `true` by `/api/auth/otp/verify` after successful OTP confirmation |

**`phone_verifications` table:**

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | Primary key |
| `userId` | `text` | FK → `users.id` |
| `phone` | `varchar(20)` | E.164 normalised mobile number |
| `otpHash` | `text` | bcrypt hash of the 6-digit OTP |
| `attempts` | `integer` | Incremented on each wrong guess; blocked after 5 |
| `expiresAt` | `timestamp` | 10 minutes from creation |
| `verifiedAt` | `timestamp` | Nullable — set on successful verify |
| `createdAt` | `timestamp` | Default now |

OTP flow constants (from `@prostream/shared/otp`):
- `OTP_EXPIRY_MINUTES = 10`
- `OTP_COOLDOWN_SECONDS = 60`
- `OTP_MAX_ATTEMPTS = 5`

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
