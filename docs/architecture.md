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
