# Overlay Theme System

## Summary
Overlay themes are output-facing design systems for OBS/browser-source rendering. They may be visually expressive and independent from the System UI Design System.

## Theme Architecture
- Overlay palette definitions live in `src/config/overlayPalettes.ts`.
- `OverlayWrapper` selects `tournament.overlayTheme` and `tournament.overlayPalette`, then applies the selected CSS variables to the overlay subtree.
- Overlay links may include `theme` and `palette` query parameters for generated OBS URLs and management-page preview URLs. These parameters override the tournament defaults for that browser source only and do not mutate tournament settings.
- Overlay URL generation is centralized in `src/lib/overlays/auctionOverlayTypes.ts`; management screens should use that helper instead of duplicating route/path logic.
- Theme 1 components use the shared `--overlay-*` palette surface.
- Theme 2 components use the `--t2-*` namespace and compatibility `--overlay-*` aliases where needed.

## Artistic Flexibility
Overlay themes may define:
- Independent palettes.
- Distinct typography and scale.
- Cinematic or broadcast-specific effects.
- Theme-specific spacing, hierarchy, and visual mood.
- Different contrast models from the System UI, provided the output remains readable.

## Constraints
- Keep each theme internally consistent.
- Keep token naming deterministic and namespaced.
- Avoid hardcoded randomness and undocumented palette values.
- Preserve rendering performance for live broadcast use.
- Do not import System UI surfaces into overlay components as a shortcut.

## Theme 3 Live Player Bar (Ticker-aligned teal)

Theme 3 adds a **centered live auction player bar** stacked above the ticker on the 1920×1080 canvas. The bar uses the same teal accent system as the ticker for a unified broadcast lower-third.

| Zone | Height | Position |
|------|--------|----------|
| Live player bar | 132px (`PLAYER_BAR_T3_HEIGHT`) | `bottom: TICKER_T3_HEIGHT + PLAYER_BAR_T3_TICKER_GAP` (84px), centered (`PLAYER_BAR_T3_WIDTH` 1200px) |
| Ticker | 78px | `bottom: 0` |

When the ticker is hidden, the player bar repositions to `bottom: 0`.

### Ticker-aligned visual system
- **Palette:** `--t3-accent` teal base (`#00898c`), `--t3-bg-panel` photo column (`#202020`), `--t3-action-primary-hover` highlight rail/skew, white/secondary text
- **Typography:** Saira Extra Condensed 700 (`--t3-font-display`)
- **Background:** accent fill + top dark fade (matches ticker) + accent skew highlight bands via [`PlayerBarBackgroundT3.tsx`](../src/components/overlays/theme3/PlayerBarBackgroundT3.tsx)
- **Layout:** 150px full-height photo (12.5%), condensed name + oversized player no, details loop, accent-highlighted bid stat block

### Bar-specific tokens (`--t3-bar-*`)
Defined in [`overlayPalettes.ts`](../src/config/overlayPalettes.ts) for Theme 3 only. Defaults derive from Theme 3 accent tokens:
`--t3-bar-bg-deep` (accent base), `--t3-bar-bg-dark` (panel/photo zone), `--t3-bar-gold` (primary accent — legacy name), `--t3-bar-gold-soft`, `--t3-bar-highlight`, `--t3-bar-rail-bright`, `--t3-bar-rail`, `--t3-bar-rail-secondary`, `--t3-bar-text`, `--t3-bar-text-muted`, `--t3-bar-vignette`, `--t3-font-display`

### Visibility
- `displayMode` is `standard` or `custom-ticker`
- Tournament status is `Live`
- A `currentPlayer` is selected
- `hidePremiumCard` is false in overlay settings

### Composition
- [`LiveAuctionPlayerBarT3.tsx`](../src/components/overlays/theme3/LiveAuctionPlayerBarT3.tsx) — state machine, enter/exit, sold/unsold reveals
- [`PlayerBarBackgroundT3.tsx`](../src/components/overlays/theme3/PlayerBarBackgroundT3.tsx) — ticker-matched accent layers + stacked top rails (bright / primary / accent)
- [`PlayerCardT3.tsx`](../src/components/overlays/theme3/PlayerCardT3.tsx) — photo + identity sections
- [`CurrentBidT3.tsx`](../src/components/overlays/theme3/CurrentBidT3.tsx) — dual-stack bid panel: base-only before bidding, then current bid (hero) + compact base row with enter transition; sold phase shows team-hero "Bought By" layout with logo, name, and sold price
- [`SoldDetailsSectionT3.tsx`](../src/components/overlays/theme3/SoldDetailsSectionT3.tsx) — center details zone SOLD stamp during sold reveal
- [`SoldMessageT3.tsx`](../src/components/overlays/theme3/SoldMessageT3.tsx) — unsold full-bar overlay stamp (`UnsoldBarOverlayT3`); sold full-bar overlay deprecated in favor of zone-specific reveals
- [`theme3Layout.ts`](../src/components/overlays/theme3/theme3Layout.ts) — shared layout constants

### Animation phases
1. **Enter** — slide up from below ticker; photo, identity, and bid panel stagger in
2. **Live pending / bidding** — details loop rotates; accent bid glow/pop; bid panel transitions from base-only to dual stack (current bid + base) on first bid
3. **Sold reveal** — brief accent flash on bar shell; details zone fills with animated SOLD stamp (`SoldDetailsSectionT3`); bid panel switches to team-hero "Bought By" layout (logo, team name, sold price) with staggered enter; photo celebration; 5s hold then exit. No full-bar sold overlay.
4. **Unsold reveal** — desaturate, red UNSOLD stamp; 2.5s hold then exit
5. **Exit** — slide down; bar dismisses until the next player is selected

All animations respect `prefers-reduced-motion`.

### Where the live player bar is used
- **Custom overlay** (`CustomT3Content`) and **Full Screen 2** (`FullScreenAltT3Content`) — lower-third bar only
- **Main Full Screen** (`FullScreenT3Content`) — uses the full-screen player card below (not the bar)

## Theme 3 Full-Screen Player Card (main Full Screen route)

The primary Full Screen overlay (`/overlays/:id`, [`FullScreenT3Content.tsx`](../src/components/overlays/theme3/FullScreenT3Content.tsx)) renders an **opaque 1920×1080 player card** instead of the lower-third bar. Custom and Full Screen 2 routes are unchanged.

### Layout
- **Canvas fill:** Opaque `--t3-gradient-canvas` background with ticker-aligned accent skew bands ([`PlayerBarBackgroundT3.tsx`](../src/components/overlays/theme3/PlayerBarBackgroundT3.tsx))
- **Left (~58%):** Full-height hero photo (`object-fit: cover`) with class badge overlay
- **Right panel (~42%):** Dark `--t3-bg-panel` with gold rail — player number watermark, name, looping detail strip, profile stat grid, fullscreen bid panel
- **Top strip:** Tournament name + LIVE pill during bidding
- **Ticker:** Hidden in `standard` mode while the card or waiting screen is active; visible in `custom-ticker` mode with card height reduced above the ticker

### Composition
- [`FullScreenPlayerCardT3.tsx`](../src/components/overlays/theme3/FullScreenPlayerCardT3.tsx) — phase machine, enter/exit, sold/unsold, bid feedback
- [`fullScreenPlayerCardT3Layout.ts`](../src/components/overlays/theme3/fullScreenPlayerCardT3Layout.ts) — geometry and timing constants
- [`playerCardLoopItems.tsx`](../src/components/overlays/theme3/playerCardLoopItems.tsx) — shared detail-loop builder (also used by the lower-third bar)
- [`CurrentBidT3.tsx`](../src/components/overlays/theme3/CurrentBidT3.tsx) — `layout="fullscreen"` variant with larger bid typography

### Animation phases
1. **Enter** — photo slides from left; panel slides from right (stagger ~480ms)
2. **Live pending / bidding** — profile detail loop; bid pop, delta flash, accent ripple; LIVE pill pulse
3. **Sold reveal** — `SoldDetailsSectionT3` stamp + team-hero bid panel; 5s hold then exit
4. **Unsold reveal** — desaturate + `UnsoldBarOverlayT3`; 2.5s hold then exit
5. **Exit** — scale down + fade + upward drift
6. **Waiting for next player** — [`RestingTimeT3.tsx`](../src/components/overlays/theme3/RestingTimeT3.tsx) with `overrideLabel="Waiting for Next Player"` until the next player is selected

All animations respect `prefers-reduced-motion`.

## Theme 3 Team Summary Panel (`team-summary`)

The Team Standings leaderboard ([`TeamSummaryT3.tsx`](../src/components/overlays/theme3/TeamSummaryT3.tsx)) is triggered from the overlay control **Team Summary** button (Theme 3). **Team Imagery** (`team-wise-image`) is a separate display mode that renders [`TeamWiseImageT3.tsx`](../src/components/overlays/theme3/TeamWiseImageT3.tsx) (double lineup view).

### Visual system
- **Trigger:** Overlay Controls → **Team Summary** (`displayMode: team-summary`); optional team filter highlights a row
- **Background:** [`TeamWiseImageBackgroundT3.tsx`](../src/components/overlays/theme3/TeamWiseImageBackgroundT3.tsx) — shared summary panel background (Team Summary, Player Summary / `SoldPlayersSummaryT3`, Top 10 Sold / `Top10SummaryT3`)
- **Tokens:** `--t3-bg-panel`, `--t3-accent`, `--t3-accent-rgb`, `--t3-accent-soft`, `--t3-bar-highlight` (overlay Theme 3 namespace only)
- **Bottom strip:** accent-led gradient (`--t3-accent` → darker teal) replacing the legacy flat gold panel fill
- **Header row:** semi-transparent dark scrim (`rgba(0,0,0,0.35)`) so column labels stay readable over the pattern
- **Title block:** unchanged white block with dark text
- **Row highlights:** legacy gold accent (`CLR_GOLD`) preserved for highlighted team rows

Skew-band drift is optional (10s cycle) and disabled under `prefers-reduced-motion`.

## Theme 3 Team-wise Panel (`team-wise-summary`)

Per-team sold roster ([`TeamWiseSummaryT3.tsx`](../src/components/overlays/theme3/TeamWiseSummaryT3.tsx)) uses the same panel shell as Player Summary: [`TeamWiseImageBackgroundT3.tsx`](../src/components/overlays/theme3/TeamWiseImageBackgroundT3.tsx), white title block, dark column header scrim, gold footer strip.

- **Trigger:** Overlay Controls → **Team-wise** (`displayMode: team-wise-summary`); optional team filter locks to one franchise
- **Layout:** One team per view — logo, team name, sold players table (`#`, player thumb/name, class, price)
- **Pagination:** 10 players per page; auto-advance every 10s; after the last page cycles to the next team (unless filtered)
- **Footer:** Players count, team spent, roster auction total

## Theme 3 Wheel Spin (`wheel-spin`)

Full-screen spin overlay ([`WheelSpinT3.tsx`](../src/components/overlays/theme3/WheelSpinT3.tsx)) modeled on the overlays.uno spin wheel sample. Triggered from the auction control **Spin** button (`displayMode: wheel-spin` + `overlay:wheel-spin` Pusher event).

- **Layout:** 1920×1080 fullscreen radial backdrop; gold title; centered SVG wheel; fixed top pointer; winner card at bottom
- **Segments:** Vibrant multi-color slices with **Nunito** player-name labels (resolved from live player list; falls back to player number)
- **Center hub:** Auctioner/streamer logo from tournament `wheelCenterImageURL` (also sent as `centerImageURL` on the spin event); gold **SPIN** text when no logo is configured
- **Animation:** Wheel enter scale, 8+ rotation spins to pre-determined winner, pulsing gold pointer, delayed winner reveal card
- **Orchestrators:** Wired in `FullScreenT3Content`, `CustomT3Content`, and `FullScreenAltT3Content`; ticker and live bar hidden during spin

## Rendering Behavior
- Overlay components must tolerate live auction state changes, missing player/team images, and session revocation/error states.
- Theme changes should preserve existing overlay data flow and layout wiring unless the task explicitly changes behavior.
- Invalid or unavailable `theme`/`palette` query values should fall back to the configured tournament theme, default palette, or first available palette without crashing the overlay route.

## Adding Or Refining Themes
- Define palette tokens first.
- Keep theme-specific components grouped by theme directory.
- Reuse only neutral behavior utilities or overlay-specific shared components.
- Document token semantics and any compatibility aliases.
