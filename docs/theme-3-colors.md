# Theme 3 — Color Reference

Comprehensive color map for **Theme 3 Broadcast** overlay output (`overlayTheme: theme3`). Theme 3 is an output-facing design system only — these tokens and values must not leak into System UI (app shell, dashboard, forms).

**Source of truth for palette tokens:** [`src/config/overlayPalettes.ts`](../src/config/overlayPalettes.ts) (`THEME3_SCAFFOLD`, `theme3Palette()`).

**Component tree:** [`src/components/overlays/theme3/`](../src/components/overlays/theme3/).

---

## 1. Two color systems inside Theme 3

Theme 3 intentionally uses **two coordinated palettes**:

| System | Role | Primary accent | Typography |
|--------|------|----------------|------------|
| **Live broadcast (teal)** | Ticker, live player bar, full-screen player card, bid panels, team imagery | Teal `#00898c` via `--t3-accent` | Saira Extra Condensed (`--t3-font-display`) |
| **Summary panels (gold)** | Team Summary, Team-wise, Player Summary, Top 10 Sold | Gold `#b9aa62` (hardcoded `GOLD`) | Montserrat |

Live surfaces read **`--t3-*` CSS variables** from the active palette. Summary panels share a **fixed gold-trim broadcast table** aesthetic with hardcoded hex values for predictable OBS output. Both systems share dark panel backgrounds and white primary text on dark regions.

---

## 2. Default palette tokens (`theme3` / `default`)

Applied by `OverlayWrapper` to the overlay subtree. Values below are from `THEME3_SCAFFOLD` in `overlayPalettes.ts`.

### 2.1 Backgrounds

| Token | Default value | Usage |
|-------|---------------|--------|
| `--t3-bg-app` | `#0A0A0F` | Deepest app-level dark (rarely visible on canvas) |
| `--t3-bg-canvas` | `#0C0C14` | Base canvas fill |
| `--t3-gradient-canvas` | `linear-gradient(160deg,#080810 0%,#0C0C18 50%,#121220 100%)` | Full-screen overlay background, `Theme3Canvas` |
| `--t3-bg-panel` | `#202020` | Player photo column, ticker title panel, card side panels |
| `--t3-gradient-panel` | `linear-gradient(180deg,#1A1A28 0%,#14141E 100%)` | Raised panel gradients |
| `--t3-bg-card` | `#181824` | Card surfaces (team imagery slots) |
| `--t3-bg-card-raised` | `#1E1E2E` | Raised cards |
| `--t3-bg-modal` | `#202030` | Modal-level surfaces |
| `--t3-bg-sidebar` | `#0E0E16` | Sidebar tone |
| `--t3-bg-muted` | `#14141E` | Muted inset areas |
| `--t3-bg-hover` | `#222232` | Hover state fill |
| `--t3-bg-active` | `#2A2A3C` | Active/pressed fill |
| `--t3-bg-photo` | `#101018` | Photo placeholder background |
| `--t3-bg-photo-fallback` | `#080810` | Empty photo fallback |
| `--t3-bg-ticker` | `#0E0E18` | Ticker base (often covered by accent bar) |
| `--t3-bg-overlay` | `rgba(4,4,8,.65)` | Scrim overlays |

### 2.2 Text

| Token | Default value | Usage |
|-------|---------------|--------|
| `--t3-text-primary` | `#F0F0F8` | Primary on-dark text (ticker scroll, card names) |
| `--t3-text-primary-rgb` | `240,240,248` | RGB tuple for alpha mixes |
| `--t3-text-secondary` | `#B8B8C8` | Secondary labels, detail loop fields |
| `--t3-text-muted` | `#787888` | Muted labels, stat captions |
| `--t3-text-disabled` | `#505060` | Disabled copy |
| `--t3-text-accent` | `#A0A0D0` | Accent-tinted text |
| `--t3-on-accent` | `#0A0A10` | Text on solid accent fills |

### 2.3 Accent & actions

| Token | Default value | Usage |
|-------|---------------|--------|
| `--t3-accent` | `#00898c` | **Primary teal** — ticker rail, bar shell, team imagery accent bar, skew bands |
| `--t3-accent-rgb` | `0,137,140` | Glow, tint washes, bid pulse animations |
| `--t3-accent-soft` | `rgba(0,137,140,.14)` | Soft accent fills, open roster slot borders |
| `--t3-action-primary` | `#00898c` | Alias of accent |
| `--t3-action-primary-hover` | `#A8A8D8` | Skew highlight bands (`PlayerBarBackgroundT3`, summary background) |
| `--t3-action-primary-active` | `#7878A8` | Active action state |

### 2.4 Semantic status

| Token | Default value | Usage |
|-------|---------------|--------|
| `--t3-success` | `#6EC49A` | LIVE pill, sold price, SOLD stamp, sold bid amount |
| `--t3-success-soft` | `rgba(110,196,154,.14)` | Success background tint |
| `--t3-warning` | `#D4B05E` | Warning states |
| `--t3-warning-soft` | `rgba(212,176,94,.15)` | Warning background |
| `--t3-danger` | `#D87070` | UNSOLD stamp, bid decrease flash, error banners |
| `--t3-danger-soft` | `rgba(216,112,112,.14)` | Danger background (team owner reconnect) |
| `--t3-info` | `#70A8D8` | Info states |
| `--t3-info-soft` | `rgba(112,168,216,.13)` | Info background |

### 2.5 Borders, effects, charts

| Token | Default value |
|-------|---------------|
| `--t3-border-subtle` | `rgba(255,255,255,.10)` |
| `--t3-border-strong` | `rgba(255,255,255,.20)` |
| `--t3-border-accent` | `rgba(160,160,200,.35)` |
| `--t3-focus-ring` | `rgba(144,144,192,.36)` |
| `--t3-shine` | `rgba(255,255,255,.12)` |
| `--t3-shadow-color` | `rgba(0,0,0,.50)` |
| `--t3-chart-1` … `--t3-chart-6` | `#9090C0`, `#70A8D8`, `#6EC49A`, `#D4B05E`, `#B890D0`, `#D87070` |

### 2.6 Live player bar & ticker (`--t3-bar-*`)

Bar tokens default to accent-derived values when not overridden per palette.

| Token | Default (scaffold) | Element |
|-------|-------------------|---------|
| `--t3-bar-bg-deep` | `#00898c` (accent) | Bar/ticker main accent fill |
| `--t3-bar-bg-dark` | `#202020` (panel) | Photo zone, dark bar sections |
| `--t3-bar-gold` | `#00898c` (accent)* | Gold rail on fullscreen card, bid highlight, portrait footer border |
| `--t3-bar-gold-soft` | accent soft | Secondary skew band |
| `--t3-bar-highlight` | `#A8A8D8` (action hover) | Skew highlight rails |
| `--t3-bar-rail-bright` | `rgba(255,255,255,.12)` (shine) | Top rail stripe (2px) |
| `--t3-bar-rail` | `#F0F0F8` (text primary) | Primary rail stripe (4px) |
| `--t3-bar-rail-secondary` | `rgba(0,0,0,0.42)` | Secondary rail stripe (3px) |
| `--t3-bar-text` | `#F0F0F8` | Bid amounts, player names on bar |
| `--t3-bar-text-muted` | `#B8B8C8` | “Base price”, “Current bid” labels |
| `--t3-bar-vignette` | `rgba(0,0,0,0.35)` | Bar edge vignette |
| `--t3-font-display` | `"Saira Extra Condensed", sans-serif` | Display typography |

\*Token name `--t3-bar-gold` is legacy; on scaffold palette it resolves to **teal**, not summary gold `#b9aa62`.

### 2.7 Ticker player-number badge

Set inline in `TickerT3Shared.tsx` (local overrides):

| Token | Value |
|-------|-------|
| `--t3-player-no-bg` | `#ffffff` |
| `--t3-player-no-text` | `#111827` |
| `--t3-player-no-border` | `rgba(0, 0, 0, 0.14)` |

### 2.8 Compatibility aliases (`--overlay-*`)

Theme 3 maps key tokens to shared `--overlay-*` names for hooks like `TeamOwnerOverlay` danger/success fallbacks. See `theme3Palette()` in `overlayPalettes.ts` for the full alias list.

---

## 3. Summary panel palette (hardcoded)

Used by: `TeamSummaryT3`, `TeamWiseSummaryT3`, `SoldPlayersSummaryT3`, `Top10SummaryT3`, and `TeamWiseImageBackgroundT3` (with token fallbacks).

| Constant | Hex / value | Role |
|----------|-------------|------|
| `DARK` | `#2a2f35` | Title block text, footer text on gold strip |
| `GOLD` | `#b9aa62` | Footer strip fill, spent/price columns, logo borders, class highlights, iconic labels |
| `WHITE` | `#ffffff` | Title block background, column header text, row primary text |
| `MUTED` | `#cccccc` | Row index `#`, player count column, pending status, empty states |
| `GREEN` | `#20c997` | Balance column, footer balance value, SOLD status (Player Summary) |
| `RED` | `#ef4444` | UNSOLD status (Player Summary only) |

### 3.1 Summary panel — element map

Shared shell across Team Summary, Team-wise, Player Summary, Top 10:

| Element | Color |
|---------|-------|
| Panel drop shadow | `rgba(0,0,0,0.70)` |
| Title block background | `#ffffff` (`WHITE`) |
| Title block gradient overlay | `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.13) 100%)` |
| Tournament name | `#2a2f35` (`DARK`), 20px |
| Panel title / team name | `#2a2f35` (`DARK`), 40px |
| Team short code (inline) | `rgba(42,47,53,0.65)` |
| Right stat number (teams / players sold) | `#2a2f35` (`DARK`), 38px |
| Right stat label | `#2a2f35` (`DARK`), 13px tracking |
| Team rotation hint | `rgba(42,47,53,0.55)` |
| Column header scrim | `rgba(0,0,0,0.35)` |
| Column header text | `#ffffff`, 22–24px |
| Row divider | `rgba(204,204,204,0.45)` |
| Row index | `#cccccc` (`MUTED`) |
| Row primary text | `#ffffff` |
| Row meta / subtitle | `rgba(255,255,255,0.62)` |
| Spent / price / class (emphasis) | `#b9aa62` (`GOLD`) |
| Balance column / footer balance | `#20c997` (`GREEN`) |
| Highlighted team row background | `rgba(185,170,98,0.18)` |
| Highlighted team row inset bar | `#b9aa62` (3px left) |
| Footer strip | `#b9aa62` (`GOLD`) background, `#2a2f35` text |
| Team / player thumb border | `2px solid #b9aa62` |
| Team logo badge background | `#ffffff` |
| Team logo badge shadow | `rgba(0,0,0,0.25)` |
| Player thumb placeholder fill | `rgba(255,255,255,0.08)` |

### 3.2 Summary background layers (`TeamWiseImageBackgroundT3`)

| Layer | Color |
|-------|-------|
| Bottom accent strip | `--t3-accent` → `#00898c` gradient to `#0A1A22` |
| Panel base gradient | `--t3-bg-panel` `#202020` → `#0E2228` → `#0A1A22` |
| Accent tint wash | `rgba(var(--t3-accent-rgb), 0.08)` / `0.05` |
| Skew band A | `--t3-bar-highlight` @ 22% opacity |
| Skew band B | `--t3-accent-soft` @ 14% opacity |
| Dot grid | `rgba(255,255,255,0.05)` 1px |
| Corner glows | `rgba(var(--t3-accent-rgb), 0.14)` / `0.10` |
| Edge vignette | `rgba(0,0,0,0.42)` horizontal, `0.28`/`0.35` vertical |

---

## 4. Component-by-component colors

### 4.1 Ticker (`TickerT3Shared.tsx`)

| Element | Color |
|---------|-------|
| Accent bar (full bleed) | `--t3-accent` `#00898c` |
| Top dark fade | `linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)` |
| Title panel (22% width) | `--t3-bg-panel` `#202020` |
| Title panel shadow | `4px 0 12px rgba(0,0,0,0.25)` |
| Scrolling item text | `--t3-text-primary` `#F0F0F8` |
| Sold price / detail | `--t3-text-secondary` |
| Player number badge | white `#ffffff` / text `#111827` |
| Ticker head rotator text | `--t3-text-primary` |
| Head rotator scrim | `rgba(0,0,0,0.15)` |

### 4.2 Live player bar (`LiveAuctionPlayerBarT3`, `PlayerBarBackgroundT3`, `PlayerCardT3`)

| Element | Color |
|---------|-------|
| Bar shell fill | `--t3-bar-bg-deep` (teal) |
| Photo column | `--t3-bar-bg-dark` `#202020` |
| Photo / name divider | `--t3-bar-gold` (teal on scaffold) |
| Player number | `--t3-bar-gold` |
| Player name | `--t3-bar-text` |
| Detail loop labels | `--t3-bar-text-muted` |
| Class badge | Tournament class color or `--t3-bar-text-muted` |
| Bid pop glow | `rgba(var(--t3-accent-rgb), 0.22)` flash |
| Bidding pulse ring | `--t3-accent-rgb` alpha animation |
| Top rail stripes | `--t3-bar-rail-bright`, `--t3-bar-rail`, `--t3-bar-rail-secondary` |
| Skew bands | `--t3-bar-highlight`, `--t3-bar-gold-soft` |

### 4.3 Bid panel (`CurrentBidT3.tsx`)

| Element | Color |
|---------|-------|
| Label text (“Current bid”, “Base price”) | `--t3-bar-text-muted` |
| Bid amount (live) | `--t3-bar-text` |
| Bid amount accent underline | `--t3-bar-gold` |
| Sold amount | `--t3-success` `#6EC49A` |
| Sold team name | `--t3-bar-text` |
| Bid increase flash | `--t3-success` |
| Bid decrease flash | `--t3-danger` `#D87070` |
| Neutral bid highlight | `--t3-bar-gold` |

### 4.4 Sold / unsold stamps

**`SoldDetailsSectionT3.tsx`**

| Element | Color |
|---------|-------|
| SOLD stamp text | `--t3-success` `#6EC49A` |

**`UnsoldDetailsSectionT3.tsx`** (Full Screen)

| Element | Color |
|---------|-------|
| UNSOLD stamp | `--t3-danger` `#D87070` on dark red plate |
| Stamp pulse / flash | danger rgba glow |
| Struck base price | muted white + line-through |
| Card desaturate | filter on FS card during unsold reveal |

**`SoldMessageT3.tsx`** (Custom / bar stamps)

| Element | Color |
|---------|-------|
| Sold toast scrim | `rgba(0,33,69,0.45)` |
| Sold toast border | `--t3-bar-gold` |
| Sold toast fill | `rgba(0,0,0,0.72)` |
| Sold label | `--t3-success` |
| Unsold scrim | `rgba(0,0,0,0.4)` |
| Unsold border | `--t3-danger` |
| Unsold label | `--t3-danger` |

### 4.5 Full-screen player card (`FullScreenPlayerCardT3.tsx`)

| Element | Color |
|---------|-------|
| Canvas | `--t3-gradient-canvas` |
| Gold left rail | `--t3-bar-gold` |
| Top status bar | `rgba(0,0,0,0.28)`, border `rgba(255,255,255,0.08)` |
| Tournament label | `--t3-text-secondary` |
| LIVE pill background | `rgba(var(--t3-accent-rgb), 0.18)` |
| LIVE pill border | `rgba(var(--t3-accent-rgb), 0.45)` |
| LIVE dot & text | `--t3-success` |
| Hero photo bg | `--t3-bg-photo` |
| Photo initials watermark | `rgba(255,255,255,0.15)` |
| Photo edge gradient | `rgba(0,0,0,0.55)` |
| Class badge | Class config color or `--t3-accent` |
| Side panel | `--t3-bg-panel` `#202020` |
| Player number (large) | `--t3-bar-gold` |
| Player name | `--t3-text-primary` |
| Detail loop labels | `--t3-text-muted` |
| Section divider | `rgba(255,255,255,0.1)` |
| Row dividers in loop | `rgba(255,255,255,0.06)` |

### 4.5b Post-sale waiting banner (`PostSaleWaitingBannerT3.tsx`)

Shown after the full-screen card exits (10s sold hold or unsold hold) until the next player is selected.

| Element | Color |
|---------|-------|
| Canvas | `--t3-gradient-canvas` + `PlayerBarBackgroundT3` |
| Tournament logo (hero) | 148×148, white fill, `--t3-bar-gold` border |
| Tournament name | `--t3-text-primary`, 64–92px responsive |
| “Waiting for Next Player” | `--t3-bar-gold` accent, 28px |
| Auction date | `--t3-text-muted`, 20px |
| Stat tiles | `rgba(0,0,0,0.42)` — Available: primary, Sold: success, Unsold: danger (72px counts) |
| Team marquee rail | `rgba(0,0,0,0.55)`, top border `--t3-bar-gold` |
| Team chip logos | white fill, `--t3-bar-gold` border |

### 4.6 Portrait player card (`PortraitPlayerCardT3.tsx`)

| Element | Color |
|---------|-------|
| Card shadow | `rgba(0,0,0,0.65)` |
| Top accent rail | `--t3-bar-gold` |
| Photo zone | `--t3-bg-photo` |
| Footer bar | `rgba(0,0,0,0.42)`, top border `--t3-bar-gold` |
| Player number | `--t3-bar-gold` |
| Bid pulse | `--t3-accent-rgb` glow |

### 4.7 Team Imagery (`TeamWiseImageT3.tsx`)

Uses `--t3-*` tokens via local `T3` map:

| Element | Token / color |
|---------|---------------|
| Center info bar | `--t3-accent` fill, `#ffffff` text |
| Player slot card | `--t3-bg-card` |
| Open slot border | dashed `--t3-accent-soft` |
| Player name | `--t3-text-primary` |
| Secondary meta | `--t3-text-secondary` / `--t3-text-muted` |
| Player number watermark | `rgba(var(--t3-text-primary-rgb), 0.12)` |

### 4.8 Resting / waiting screen (`RestingTimeT3.tsx`)

| Constant | Value | Element |
|----------|-------|---------|
| `DARK` | `#141414` | Main panels |
| `BLACK` | `#050505` | Deep fill |
| `WHITE` | `#ffffff` | Primary text |
| `GOLD` | `#b9aa62` | Accent bars, highlights |
| `ORANGE` | `#f2692e` | Warm accent |
| `YELLOW` | `#ffc522` | Glow, sweep highlights |
| `MUTED` | `rgba(255,255,255,0.72)` | Secondary copy |

### 4.9 Wheel spin (`WheelSpinT3.tsx`)

| Constant / element | Value |
|--------------------|-------|
| `GOLD` | `#b9aa62` — rings, hub, winner accents |
| `GOLD_BRIGHT` | `#ffc522` — pulse, title glow |
| `DARK` | `#141414` — backdrop |
| Segment fills | Multi-color palette (e.g. `#00a2cb`, `#f2009d`, `#ffbe00`, …) |
| Segment labels | `#ffffff` |
| Outer rings | `rgba(185,170,98,0.22)`, `rgba(255,197,34,0.08)` |
| Winner card gradient | `rgba(18,22,28,0.98)` → dark |

### 4.10 Team Owners mobile overlay (`TeamOwnerOverlayT3.tsx`)

| Element | Color |
|---------|-------|
| Summary `GOLD` / `GREEN` / `DARK` / `MUTED` | Same as §3 summary constants |
| Page background | `TeamWiseImageBackgroundT3` layers |
| Header block | `#ffffff` |
| Team selector bar | `rgba(0,0,0,0.72)`, border `#b9aa62` |
| Stat tiles border | `rgba(185,170,98,0.35)` |
| Reconnect banner | `--t3-danger` / `--t3-danger-soft` |
| Section header (bought) | `#b9aa62` on `#2a2f35` text |
| Section header (available) | `rgba(0,0,0,0.45)` on white text |

---

## 5. Typography pairing

| Context | Font | Weights |
|---------|------|---------|
| Live bar, ticker, fullscreen card, wheel | **Saira Extra Condensed** (`--t3-font-display`) | 600–800 |
| Summary panels | **Montserrat** | 400–700 |
| Wheel segment labels | **Nunito** | — |

---

## 6. Class & dynamic colors

Player **class badges** and profile stat colors come from tournament `classConfig.color` at runtime. When unset, components fall back to `--t3-accent` or `--t3-bar-text-muted`.

Iconic players in summary panels use **`GOLD` `#b9aa62`** for labels and price display.

---

## 7. Changing Theme 3 colors

1. **Live broadcast (teal system):** Edit or add a palette in `overlayPalettes.ts` under `OVERLAY_PALETTES.theme3`. Tournament field `overlayPalette` selects the variant.
2. **Summary gold system:** Today hardcoded in each `*SummaryT3.tsx` file. Changing gold/green balance requires updating the shared constants (`DARK`, `GOLD`, `WHITE`, `MUTED`, `GREEN`, `RED`) in those components consistently.
3. **URL override:** `?theme=theme3&palette=default` on overlay routes applies palette without mutating tournament settings.

---

## 8. Related documentation

- [`overlay-theme-system.md`](./overlay-theme-system.md) — Theme 3 architecture, layout zones, triggers
- [`theme-boundaries.md`](./theme-boundaries.md) — System UI vs overlay separation
- [`theming-guide.md`](./theming-guide.md) — How overlay themes are selected and applied
