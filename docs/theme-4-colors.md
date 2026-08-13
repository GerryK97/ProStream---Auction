# Theme 4 — Frame 15 Colors

Namespace: `--t4-*` (plus `--overlay-*` compatibility aliases).

## Core UI

| Token | Role | Default |
|-------|------|---------|
| `--t4-bid-gold` | Current bid amount | `#D4AF37` (antique gold) |
| `--t4-base-amount` | Base price value | `#FFFFFF` |
| `--t4-label` | Panel labels | `#0A0C12` |
| `--t4-panel-header` | Brushed silver header | white → steel |
| `--t4-panel-body` | Dark amount bar | deep navy |
| `--t4-panel-edge` | Soft gold hairline | `rgba(212,175,55,0.28)` |
| `--t4-panel-edge-soft` | White inset | `rgba(255,255,255,0.12)` |
| `--t4-nameplate-bg` | Nameplate dark metal base | `#243148` → `#05070C` |
| `--t4-nameplate-edge` | Soft gold top lip | `rgba(212,175,55,0.65)` |
| `--t4-nameplate-glow` | Soft gold outer glow | `rgba(212,175,55,0.22)` |
| `--t4-name-gold` | Bebas Neue name | `#F0D878` |
| `--t4-font-label` | Panel labels / amounts | Oswald |
| `--t4-font-name` | Player nameplate | Bebas Neue |
| `--t4-bg-photo` | Shield photo fallback | `#0A0C10` |

Nameplate uses granite rock-face texture on the same dark navy palette (coarse facets + mineral flecks), soft top lip only.

## Player card sizes

| Route / size | Component | Role |
|--------------|-----------|------|
| Custom `small` | `PlayerCardT4` | Frame 15 lower-third (shield + bid panels + nameplate) |
| Custom `large` | `PortraitPlayerCardT4` | Centered hero photo + footer |
| Full Screen | `FullScreenPlayerCardT4` | Opaque full-bleed hero + info/bid panel (Theme 3 FS structure, `--t4-*` chrome) |
| Full Screen 2 | Secondary image + `CurrentBidPanelT4` `bar` | Photo hero + floating bid card |

Custom size via `overlaySettings.size`. Full Screen ignores size and always uses the dedicated FS card.

## Full Screen (`FullScreenPlayerCardT4`)

| Piece | Spec |
|-------|------|
| Canvas | Opaque `--t4-gradient-canvas` |
| Layout | Photo box fitted to original aspect (`c_limit`, no crop); details panel fills remaining width; soft rail-edge fade only |
| Bid | `CurrentBidPanelT4` `layout="fullscreen"` |
| Ticker | Hidden while live card / waiting (standard mode) |
| Post-sale | `RestingTimeT4` + `overrideLabel="Waiting for Next Player"` |

## Full Screen 2 (`FullScreenAltT4Content`)

| Piece | Spec |
|-------|------|
| Hero | `secondaryImageURL \|\| photoURL` full-bleed cover |
| Bid card | `CurrentBidPanelT4` `layout="bar"` at `bidCardLeft`/`bidCardTop` (defaults 1576/160) |
| Sold | Shared `SoldMessageToast` |
| Waiting | Same RestingTime waiting banner |
| Ticker | Visible in live (unlike primary Full Screen) |

## Bid panel (`CurrentBidPanelT4`)

Layouts: `fullscreen` (embedded in FS card) and `bar` (320px floating). Frame 15 panel chrome (silver header / dark body / gold amounts).

## Slot reel (`SlotReelT4`)

Heraldic **slot reel** player selection — same Spin control, `overlay:wheel-spin` event, and timing as Theme 3; Theme 4 spins **player numbers only**, then reveals the winner plate:

| vs Theme 3 wheel | Theme 4 slot reel |
|------------------|-------------------|
| Rainbow SVG wheel | Vertical `#` number strip in a gold/navy bezel |
| Name labels on slices | Player number only while spinning |
| Saira / Nunito | Bebas Neue numbers; Oswald on winner meta |
| Triangle pointer + light rays | Gold chevrons on the center lock row; clean plate winner card |
| “Spin the Wheel” | Tournament logo + name at top; “Selecting Player” subtitle; logo “DRAW” |

Triggered by `displayMode: wheel-spin` + `overlay:wheel-spin` (same control panel Spin flow). Wired in `CustomT4Content`, `FullScreenT4Content`, and `FullScreenAltT4Content`.

## Ticker (`TickerT4`) — overlays.uno Prime

Exact Prime RSS News Ticker layout from overlays.uno:

| Piece | Spec |
|-------|------|
| Height | 65px (`TICKER_T4_HEIGHT`) |
| Bar fill | `#0a3d8d` (Prime scroll field) |
| Category | **Diagonal gold wedge** (`clip-path`), Theme 4 gold gradient, dark label |
| Motion | Shine sweep, brightness pulse, edge flash, letter-spacing breathe |
| Type | PT Sans Narrow |
| Category label | Mode only: `SOLD PLAYERS` / `AVAILABLE` / `ALL PLAYERS` / `LIVE UPDATE` |
| Scroll | Player `no  NAME — detail`, separated by **tournament logo** icons (no `#`) |

Hidden during wheel-spin. Small Frame 15 card lifts above the ticker when it is visible.

## Player Summary (`SoldPlayersSummaryT4`) — Fresh layout

Fullscreen summary for `displayMode: sold-summary`.

**Design system:** overlays.uno **Fixtures Fullscreen · Fresh** (structure + Barlow). **Only colors remapped** to Theme 4.

| Colors | Title top `#2A7AD4` / bottom `#1A5FB8`→`#0a3d8d` · accents/footer `#0a3d8d` · panel `#0A0C10` |

| Piece | Spec |
|-------|------|
| Panel | 1536×864 at (192, 108) — Fresh 10% / 80% |
| Title | Compact two-band header (100px total) so 12×52px rows fit; white Barlow |
| Column header | Blue strip `#1A5FB8` → `#0E4F96`; white labels |
| Columns | `# \| PLAYER \| TEAM \| SOLD PRICE` |
| Rows | 12/page; white hairline dividers; Barlow 700 names |
| Data | Theme 3 only: sold (price desc) → unsold → remaining |
| Footer | Shiny accent strip (same gradient + sheen as title): SOLD / UNSOLD / REMAINING + page dots |

Wired in `CustomT4Content` / `FullScreenT4Content`. Cards, ticker, and slot reel hide while active.

## Team Summary (`TeamSummaryT4`)

Fullscreen summary for `displayMode: team-summary`. Same Fresh + ticker-blue chrome as Player Summary.

| Piece | Spec |
|-------|------|
| Columns | `# \| TEAM \| PLAYERS \| CAN BUY \| MAX BID \| BALANCE` |
| Data | Theme 3: teams by `currentBalance` desc; sold count / max-bid reserve via `getMinClassBasePrice` |
| Rows | 12/page @ 10s; optional `teamWiseTeamId` blue-row highlight |
| Footer | TEAMS / TOTAL BUDGET / SLOTS LEFT |

## Team-wise Summary (`TeamWiseSummaryT4`)

Fullscreen per-team sold roster for `displayMode: team-wise-summary`. Same Fresh + ticker-blue chrome as Player Summary.

| Piece | Spec |
|-------|------|
| Title | Tournament (top band) / team name (bottom band); team logo on the right |
| Columns | `# \| PLAYER \| SOLD PRICE` |
| Data | Theme 3: sold non-iconic players for one team at a time; optional `teamWiseTeamId` lock |
| Rows | 12/page @ 10s; then next team (unless filtered) |
| Footer | PLAYERS (`sold/squad`) · SPENT · MAX BID · BALANCE |

## Top 10 Sold (`Top10SummaryT4`)

Fullscreen summary for `displayMode: top10-summary`. Same chrome; no podium medals.

| Piece | Spec |
|-------|------|
| Columns | `# \| PLAYER \| TEAM \| PRICE` |
| Data | Theme 3: sold non-iconic with `finalPrice`, price desc, top 10 |
| Footer | Empty shiny blue strip (chrome parity) |
| Empty | “NO SOLD PLAYERS YET” |

## Team Imagery (`TeamWiseImageT4`) — Champion layout

`displayMode: team-wise-image`. Matches overlays.uno **Double Starting Lineup · Champion** chrome (single-team auction data).

| Piece | Spec |
|-------|------|
| Top / bottom | Thin gold bars `#eda900` (Champion Top/Btm Rectangle) |
| Title | Dark `#1f1f1f` band; Saira Extra Condensed ~63px team name `#d6d6d6`; logos at sides |
| Players | Compact columns (shorter photo); name-only plate; **15/page** (5×3), then paginate |
| Data | Theme 3 Imagery: sold roster, squadSize slots, 12/page, team/page rotation |
| Empty | “NO SOLD PLAYERS YET” / OPEN SLOT columns |

## Resting Time (`RestingTimeT4`)

`displayMode: resting` — break-time brand showcase (no auction copy).

| Piece | Spec |
|-------|------|
| Streamer | `tournament.wheelCenterImageURL` — square plate with gold accent |
| Tournament | `tournament.logoURL` — square plate with blue accent |
| Motion | Dual square plates; rotating frames, corner brackets, orbit dots, energy bridge, gloss sweeps, light dust (OBS-transparent color intensity) |
| Focus | Alternating highlight (~5.5s) scales/glows one brand while the other stays visible |
| Footer | Transparent Auction web logo (`ProSteam_logo_h9pb8b`) + “Auction System Powered By ProStream” above the gold floor line |

## Shield — unified golden metal

One connected gold family only (no cyan / sapphire on the rim):

| Token | Role | Default |
|-------|------|---------|
| `--t4-shield-gold-hi` | Champagne highlight | `#F3E2A0` |
| `--t4-shield-gold` | Classic gold | `#D4AF37` |
| `--t4-shield-gold-mid` | Antique mid | `#B8860B` |
| `--t4-shield-bronze` | Bronze | `#8A6A2F` |
| `--t4-shield-bronze-deep` | Deep bronze | `#3D2E14` |
| `--t4-shield-platinum` | Soft inner edge | `#E6E2D6` |

Rim = one continuous polished gold surface with tight color range and soft gloss (no mid-band light/dark splits). Photo well stays flat with soft undercut.

Palette entry: `OVERLAY_PALETTES.theme4` → `default`.

Figma source: Frame 15 (`22:27`), 806×481.
