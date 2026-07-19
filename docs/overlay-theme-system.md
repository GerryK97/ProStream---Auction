# Overlay Theme System

> Ecosystem context: see [`docs/prostream-ecosystem.md`](./prostream-ecosystem.md) for overlay sessions, Theme3, Expo mobile controls, and backend integration.

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

Theme 3 adds a **left-aligned live auction player bar** stacked above the ticker on the 1920×1080 canvas. The bar uses the same teal accent system as the ticker for a unified broadcast lower-third.

| Zone | Height | Position |
|------|--------|----------|
| Live player bar | 132px (`PLAYER_BAR_T3_HEIGHT`) | `bottom: TICKER_T3_HEIGHT + PLAYER_BAR_T3_TICKER_GAP` (84px); left-aligned when Team Cards visible, centered when Team Cards hidden (`PLAYER_BAR_T3_WIDTH` 1200px) |
| Ticker | 78px | `bottom: 0` |

When the ticker is hidden, the player bar repositions to `bottom: 0`.

### Ticker-aligned visual system
- **Palette:** `--t3-accent` teal base (`#00898c`), `--t3-bg-panel` photo column (`#202020`), `--t3-action-primary-hover` highlight rail/skew, white/secondary text
- **Typography:** Saira Extra Condensed 700 (`--t3-font-display`)
- **Background:** accent fill + top dark fade (matches ticker) + accent skew highlight bands via [`PlayerBarBackgroundT3.tsx`](../src/components/overlays/theme3/PlayerBarBackgroundT3.tsx)
- **Layout:** 180×210 photo that stands taller than the 132px bar, condensed name + oversized player no, details loop, accent-highlighted bid stat block

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
- [`SoldDetailsSectionT3.tsx`](../src/components/overlays/theme3/SoldDetailsSectionT3.tsx) — sold reveal strip (SOLD badge + team + price) sized for mobile/OBS readability
- [`SoldMessageT3.tsx`](../src/components/overlays/theme3/SoldMessageT3.tsx) — unsold full-bar overlay stamp (`UnsoldBarOverlayT3`); sold full-bar overlay deprecated in favor of zone-specific reveals
- [`theme3Layout.ts`](../src/components/overlays/theme3/theme3Layout.ts) — shared layout constants

### Animation phases
1. **Enter** — slide up from below ticker; photo, identity, and bid panel stagger in
2. **Live pending / bidding** — details loop rotates; accent bid glow/pop; bid panel transitions from base-only to dual stack (current bid + base) on first bid
3. **Sold reveal** — brief accent flash; photo stays; one full-bleed **red** sold strip (`SoldDetailsSectionT3`, `--t3-danger`) with large SOLD badge + price + team (no duplicate bid panel); photo celebration; 5s hold then exit.
4. **Unsold reveal** — desaturate, red UNSOLD stamp; 2.5s hold then exit
5. **Exit** — slide down; bar dismisses until the next player is selected

All animations respect `prefers-reduced-motion`.

### Where the live player bar is used
- **Custom overlay** (`CustomT3Content`) — **Small:** lower-third [`LiveAuctionPlayerBarT3`](src/components/overlays/theme3/LiveAuctionPlayerBarT3.tsx); **Large:** portrait [`PortraitPlayerCardT3`](src/components/overlays/theme3/PortraitPlayerCardT3.tsx) (352×528, photo top, footer with number/name + two-column bid: max-height Current Bid + persistent Base after bidding starts). Controlled by overlay `size` (`large` | `small`). With **Auto Switch ON**, `select-player` includes `overlaySize: 'large'` (+ `sizeRev`) on `auction:player-selected` so the first paint is Large; a timer then publishes Small. Stale in-flight Small patches are ignored via `sizeRev`. With Auto OFF, size is unchanged when a player is added.
- **Main Full Screen** (`FullScreenT3Content`) — uses the full-screen player card below (not the bar)

### Theme 3 Custom — Team Card Overlay
- **Component:** [`TeamCardOverlayT3.tsx`](../src/components/overlays/theme3/TeamCardOverlayT3.tsx) — **Custom Overlay only** (`CustomT3Content`); not shown on Full Screen routes
- **Visibility:** `standard` / `custom-ticker` and `!hideTeamCards` (Overlay Controls → Team Cards)
- **Position:** Default **bottom-right** above the ticker; drops to the canvas bottom when the ticker is hidden; honors `teamCardSize` (`large` | `small`)
- **Columns:** Team name · Players (`sold/squadSize`, e.g. `2/12`) · Balance (teams sorted by balance desc)
- **Visual:** Matches Player Summary — **white** column header with dark labels; list on dark green panel (`#0E2228` → `#0A1A22`); Montserrat rows with hairline dividers; Players gold, Balance muted
- **Pagination:** Max **5 teams** per page; if more, auto-advance every 5s with gold page dots

## Theme 3 Full Screen 2 (alternate full-screen route)

The Full Screen 2 overlay (`/overlays/:id/fullscreen2`, [`FullScreenAltT3Content.tsx`](../src/components/overlays/theme3/FullScreenAltT3Content.tsx)) follows the **Theme 1 Full Screen 2 layout**: full-viewport **secondary player image**, a **floating bid card** positioned via overlay settings (`bidCardLeft`, `bidCardTop`), bottom ticker, sold toast, and **Waiting for Next Player** resting screen after a sale. It does **not** use the lower-third bar or the opaque full-screen player card.

### Layout
- **Background:** Player `secondaryImageURL` (fallback `photoURL`) edge-to-edge with bottom gradient fade into the canvas
- **Bid card:** Theme 3 `CurrentBidPanelT3` in a gold-bordered floating panel (320px)
- **Enter/exit:** Horizontal scaleY panel wipe (same timing as Theme 1 Full Screen 2)
- **Post-sale:** Shared sold toast → `RestingTimeT3` with “Waiting for Next Player”

## Theme 3 Full-Screen Player Card (main Full Screen route)

The primary Full Screen overlay (`/overlays/:id`, [`FullScreenT3Content.tsx`](../src/components/overlays/theme3/FullScreenT3Content.tsx)) renders an **opaque 1920×1080 player card** instead of the lower-third bar. The Custom route uses **Small** (horizontal bar) or **Large** (portrait card) per overlay `size`; Full Screen 2 uses the secondary-image layout described above.

### Layout
- **Canvas fill:** Opaque `--t3-gradient-canvas` background with ticker-aligned accent skew bands ([`PlayerBarBackgroundT3.tsx`](../src/components/overlays/theme3/PlayerBarBackgroundT3.tsx))
- **Left (square column):** Hero photo width matches photo-area height (capped ~52% of canvas) so 1:1 player images fill without side gaps (`object-fit: contain`, Cloudinary `crop: fit`); class badge overlay
- **Right panel (remainder):** Dark `--t3-bg-panel` with gold rail — player number watermark (background only), name, looping detail strip, profile stat grid, fullscreen bid panel
- **Top strip:** Tournament name + LIVE pill during bidding
- **Ticker:** Hidden in `standard` mode while the card or waiting screen is active; visible in `custom-ticker` mode with card height reduced above the ticker

### Composition
- [`FullScreenPlayerCardT3.tsx`](../src/components/overlays/theme3/FullScreenPlayerCardT3.tsx) — phase machine, enter/exit, sold/unsold, bid feedback
- [`fullScreenPlayerCardT3Layout.ts`](../src/components/overlays/theme3/fullScreenPlayerCardT3Layout.ts) — geometry and timing constants
- [`playerCardLoopItems.tsx`](../src/components/overlays/theme3/playerCardLoopItems.tsx) — shared detail-loop builder (also used by the lower-third bar)
- [`CurrentBidT3.tsx`](../src/components/overlays/theme3/CurrentBidT3.tsx) — `layout="fullscreen"` uses the same **two-column Base Price + Current Bid** layout as Custom Small; Current Bid caption **30px**, amount **120px**, panel min-height **200px** so text fills the bid area

### Animation phases
1. **Enter** — hero image is prefetched; then the **fully populated** card fades/rises in as one unit (no empty chrome flash)
2. **Live pending / bidding** — profile detail loop; bid pop, delta flash, accent ripple; LIVE pill pulse
3. **Sold reveal** — SOLD watermark + team-hero bid panel; 5s hold then exit
4. **Unsold reveal** — desaturate + `UnsoldBarOverlayT3`; 2.5s hold then exit
5. **Exit** — scale down + fade + upward drift
6. **Waiting for next player** — [`RestingTimeT3.tsx`](../src/components/overlays/theme3/RestingTimeT3.tsx) with `overrideLabel="Waiting for Next Player"` until the next player is selected

All animations respect `prefers-reduced-motion`.

## Theme 3 Team Summary Panel (`team-summary`)

The Team Standings leaderboard ([`TeamSummaryT3.tsx`](../src/components/overlays/theme3/TeamSummaryT3.tsx)) is triggered from the overlay control **Team Summary** button (Theme 3). **Team Imagery** (`team-wise-image`) is a separate display mode that renders [`TeamWiseImageT3.tsx`](../src/components/overlays/theme3/TeamWiseImageT3.tsx) (single-team lineup view).

### Theme 3 Team Imagery (`team-wise-image`)

- **Trigger:** Overlay Controls → **Team Imagery**; optional team filter locks to one franchise
- **Layout:** One team per screen — **team details strip at top**, all player cards below as one set (1 row when ≤6 slots; 2 rows when 7–12, even split, max 6 per row); card size scales to fit
- **Top strip:** Tournament name, team logo (full strip height), team name — accent rail; tournament logo on the right (spent / sold count removed)
- **Tokens:** Same Theme 3 overlay namespace as TickerT3 — `--t3-accent`, `--t3-bg-panel`, `--t3-bg-card`, `--t3-text-primary`, `--t3-text-secondary`, `--t3-on-accent`, `--t3-player-no-*`
- **Slots:** Sold players fill roster order; remaining squad positions show as open slots — never more than `squadSize` total
- **Pagination:** Max **12** slots per screen (adapts down when `squadSize` is smaller); if squad &gt; 12, pages auto-advance every 8s then the next team

### Visual system
- **Trigger:** Overlay Controls → **Team Summary** (`displayMode: team-summary`); optional team filter highlights a row
- **Background:** [`TeamWiseImageBackgroundT3.tsx`](../src/components/overlays/theme3/TeamWiseImageBackgroundT3.tsx) — shared summary panel background (Team Summary, Player Summary / `SoldPlayersSummaryT3`, Top 10 Sold / `Top10SummaryT3`)
- **Player list rows (Player Summary / Top 10 / Team-wise):** player name ~34px filling the row; no secondary meta under the name; team shown as full name only (no logo / short code) where a team column exists; Player Summary / Team-wise show **12** rows per screen (row height ~56px)
- **Columns:** `#` · Team · Players (`sold/squadSize`) · **Can Buy** (remaining squad slots) · **Max Bid** (balance minus reserve for remaining slots × min base) · Balance — Spent column removed
- **Pagination:** Max **12 teams per screen**; if more than 12, pages auto-advance every 10s with page dots
- **Tokens:** `--t3-bg-panel`, `--t3-accent`, `--t3-accent-rgb`, `--t3-accent-soft`, `--t3-bar-highlight` (overlay Theme 3 namespace only)
- **Bottom strip:** accent-led gradient (`--t3-accent` → darker teal) replacing the legacy flat gold panel fill
- **Header row:** semi-transparent dark scrim (`rgba(0,0,0,0.35)`) so column labels stay readable over the pattern
- **Title block:** white block with dark text; right side shows **tournament logo** at full title-row height (same on Player Summary / Top 10 Sold / Team-wise)
- **Row highlights:** legacy gold accent (`CLR_GOLD`) preserved for highlighted team rows
- **Footer:** Teams · Total Budget · Slots Left (sum of Can Buy)

Skew-band drift is optional (10s cycle) and disabled under `prefers-reduced-motion`.

## Theme 3 Team-wise Panel (`team-wise-summary`)

Per-team sold roster ([`TeamWiseSummaryT3.tsx`](../src/components/overlays/theme3/TeamWiseSummaryT3.tsx)) uses the same panel shell as Player Summary: [`TeamWiseImageBackgroundT3.tsx`](../src/components/overlays/theme3/TeamWiseImageBackgroundT3.tsx), white title block, dark column header scrim, gold footer strip.

- **Trigger:** Overlay Controls → **Team-wise** (`displayMode: team-wise-summary`); optional team filter locks to one franchise
- **Layout:** One team per view — full team name in title; sold players table (`#`, player thumb/name ~38px, sold price); no meta under player names; title-row right side is **that team’s logo** (full white-row height)
- **Pagination:** 12 players per page; auto-advance every 10s; after the last page cycles to the next team (unless filtered)
- **Footer:** Players (`sold/squadSize`) · Spent · Max Bid (same reserve rule as Team Summary) · Balance

## Theme 3 Wheel Spin (`wheel-spin`)

Full-screen spin overlay ([`WheelSpinT3.tsx`](../src/components/overlays/theme3/WheelSpinT3.tsx)) modeled on the overlays.uno spin wheel sample. Triggered from the auction control **Spin** button (`displayMode: wheel-spin` + `overlay:wheel-spin` Pusher event).

- **Layout:** 1920×1080 fullscreen radial backdrop; gold title; centered SVG wheel; fixed top pointer; winner card at bottom
- **Segments:** Vibrant multi-color slices with **Nunito** player-name labels (resolved from live player list; falls back to player number)
- **Center hub:** Auctioner/streamer logo from tournament `wheelCenterImageURL` (also sent as `centerImageURL` on the spin event); gold **SPIN** text when no logo is configured
- **Animation:** Wheel enter scale, 8+ rotation spins to pre-determined winner, pulsing gold pointer, delayed winner reveal card
- **Orchestrators:** Wired in `FullScreenT3Content`, `CustomT3Content`, and `FullScreenAltT3Content`; ticker and live bar hidden during spin
- **Timing:** Control panel selects the winner mid-spin so the profile is ready when the animation ends. Overlays must **not** exit `wheel-spin` on `auction:player-selected` / `currentPlayerId` — `OverlayWrapper` owns the mode reset after `WHEEL_SPIN_DURATION_MS + WHEEL_WINNER_HOLD_MS` (see `src/lib/wheelSpinTiming.ts`)

## Rendering Behavior
- Overlay components must tolerate live auction state changes, missing player/team images, and session revocation/error states.
- Theme changes should preserve existing overlay data flow and layout wiring unless the task explicitly changes behavior.
- Invalid or unavailable `theme`/`palette` query values should fall back to the configured tournament theme, default palette, or first available palette without crashing the overlay route.

## Adding Or Refining Themes
- Define palette tokens first.
- Keep theme-specific components grouped by theme directory.
- Reuse only neutral behavior utilities or overlay-specific shared components.
- Document token semantics and any compatibility aliases.
