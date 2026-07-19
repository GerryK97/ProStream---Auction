# Component Guidelines

## System UI Components
- Use System UI tokens and existing local interaction patterns.
- Prefer accessible controls with clear labels, keyboard support, and focus-visible states.
- Keep management surfaces dense, scannable, and predictable.
- Avoid decorative styling that competes with operational workflows.

## Overlay Components
- Use overlay-owned tokens from the active theme namespace.
- Preserve OBS-friendly dimensions, readability, and deterministic animation.
- Handle missing images and incomplete auction state without layout collapse.
- Avoid app-shell components or System UI surface styles inside output renderers.

### Theme 3 live player bar
- Owned by the Theme 3 overlay layer; uses `--t3-*` tokens only.
- Composed as a landscape bar above the ticker, left-aligned — not a floating card.
- Internal sections (`PlayerPhotoSection`, `PlayerIdentitySection`, `CurrentBidPanelT3`, sold/unsold overlays) are co-located with the bar orchestrator; they must not import System UI tokens.
- Bid highlighting reacts to `auctionState.currentBid` changes via local refs (same pattern as Theme 2 `CurrentBidT2`).
- Sold and unsold outcomes are shown inline on the bar before exit; no separate toast is required for Theme 3 live auction.

### Theme 3 team card overlay
- Custom Overlay only (`TeamCardOverlayT3` via `CustomT3Content`).
- Visual language aligned with Player Summary (Montserrat, white header + dark labels, dark-green list panel, gold/muted values, hairline row dividers).
- Compact corner panel: team name, players (`sold/squadSize`), balance — max 5 teams per page with auto pagination.

## Overlay Controls
Overlay controls are System UI, even though they configure overlays. They should use System UI tokens and accessible product-control patterns while writing configuration that affects overlay output.

## Shared Components
- Shared components should be visually neutral or accept explicit styling from the layer that uses them.
- Shared behavior utilities are preferred over duplicated formatting logic.
- Do not place layer-specific visual decisions in shared primitives.

## Change Safety
- Match nearby component patterns before introducing abstractions.
- Add abstractions only when they reduce meaningful duplication or clarify ownership.
- Keep changes scoped to the requested layer and behavior.

## Auction Workspace Layout (`/auction`)

The live auction page uses a responsive workspace shell under `src/components/auction/`:

| Mode | Viewport | Layout |
|------|----------|--------|
| **Wide** | >= 1400px | 3-column dashboard (Available \| Auction + Overlay \| Teams/Results) with panel toggles in the header |
| **Compact** | 1024–1399px | Default **All panels** — stacked dashboard with the same panel toggles as wide; optional **Tabs** layout in the header |
| **Focused** | < 1024px | Same as compact; header context collapses but **Panels** / **Layout** controls stay available |

**Panel toggles**
- Available on all viewport sizes (not only wide).
- Turn sections on/off: Available, Auction, Teams, Results.
- In **All panels** mode, every enabled section appears on one scrollable page (stacked vertically below 1400px).

**Layout preference (compact / focused)**
- **All panels** (default): multi-section dashboard, same behavior as wide mode but stacked.
- **Tabs**: one section at a time via `AuctionTabNav` (previous compact behavior).
- Stored in `localStorage` as `auctionWorkspaceLayoutPref`.

**Tab rules** (when Layout = Tabs)
- Default tab is **Auction**; selecting a player from **Players** switches to **Auction**.
- **Auction** tab includes bidding controls and overlay controls together.
- **Results** has its own tab (sold/unsold list, undo, edit).
- Class selector appears above the Available Players list in tab mode; in panel mode it stays in the left column above the list.

**Persistence**
- Last active tab, panel visibility, and layout preference are stored in `localStorage` (`auctionWorkspaceTab`, `auctionSectionVisibility`, `auctionWorkspaceLayoutPref`).

**Ownership**
- Workspace layout components are System UI only (`--surface-*`, `--brand-*`, etc.).
- Auction handlers and Pusher state remain in `AuctionControlPanel.tsx`; the workspace shell is presentational.

