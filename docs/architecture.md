# Architecture

## Summary
ProStream Auction is a Next.js App Router application with internal auction-management surfaces and separate output-facing overlay routes. The key architectural boundary is visual: System UI and Overlay Output themes are separate systems and must remain isolated.

## Main Areas
- App routes and API routes live under `src/app`.
- System UI components live in `src/components`, including shell, navigation, forms, controls, and management surfaces.
- Overlay controls live in `src/components/overlay-controls`; these are System UI because they are admin/editor controls.
- Overlay renderers live in `src/components/overlays`; these are output-facing components.
- Realtime auction state flows through hooks such as `usePusherAuction` and server/client Pusher utilities.
- Data models live under `src/models`; shared runtime types live in `src/types`.
- Shared user and wallet data live in Neon Postgres through `src/lib/pg`; auction domain data remains in MongoDB/Mongoose.

## Shared Wallet Integration
- `src/lib/pg/users-schema.ts` mirrors the Scoreboard-owned Neon tables for `wallets`, `wallet_transactions`, and `pricing_config`.
- `src/lib/pg/wallet-queries.ts` is the Auction wallet access layer. It ensures a wallet exists, reads balance/transactions, reads pricing keys, and records server-side deductions.
- `GET /api/wallet` returns the authenticated user's wallet balance plus recent transactions for Auction web clients and the Expo App.
- `GET /api/wallet/transactions` returns the authenticated user's full transaction history.
- `POST /api/overlay/sessions` checks the shared `pricing_config` key `auction_overlay_create`. If the configured price is greater than zero, the API deducts from the user's shared wallet before creating the overlay session and returns `402` with `error: 'insufficient_balance'` if funds are not enough.
- Wallet amounts follow the existing Scoreboard convention: integer LKR credits, immutable transaction rows, and backend-only deductions.

## Rendering Flow
- `src/app/layout.tsx` wraps the app with auth, tournament, auction, sidebar, and theme providers.
- `src/components/AppShell.tsx` renders navigation and sidebar for normal app routes.
- `/overlays/[id]...` routes bypass app chrome so OBS/browser-source output is not polluted by System UI.
- `OverlayWrapper` loads auction data, subscribes to overlay events, selects the active overlay palette, and applies overlay CSS variables to the overlay subtree.

## Theme And Token Ownership
- System UI tokens are global variables in `src/app/globals.css`, scoped by `:root[data-theme]`.
- Overlay palettes are defined in `src/config/overlayPalettes.ts` and applied inside overlay rendering only.
- Theme-specific overlay components own their visual language inside their theme folders.

## Known Debt
- Some styling is inline and token use is not fully centralized.
- The app currently uses global CSS utilities for several System UI controls.
- There is limited automated test coverage for visual/theme boundaries.
