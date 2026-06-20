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
- Composed as a landscape bar above the ticker — not a floating card.
- Internal sections (`PlayerPhotoSection`, `PlayerIdentitySection`, `CurrentBidPanelT3`, sold/unsold overlays) are co-located with the bar orchestrator; they must not import System UI tokens.
- Bid highlighting reacts to `auctionState.currentBid` changes via local refs (same pattern as Theme 2 `CurrentBidT2`).
- Sold and unsold outcomes are shown inline on the bar before exit; no separate toast is required for Theme 3 live auction.

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
| **Wide** | >= 1400px | 3-column dashboard (Available \| Auction + Overlay \| Teams/Results) with optional panel toggles in the header |
| **Compact** | 1024–1399px | Horizontal tab bar: Auction (bidding + overlay), Players, Teams, Results |
| **Focused** | < 1024px | Same tabs; header context collapses to save vertical space |

**Tab rules**
- Default tab is **Auction**; selecting a player from **Players** switches to **Auction**.
- **Auction** tab includes bidding controls and overlay controls together.
- **Results** has its own tab (sold/unsold list, undo, edit).
- Class selector appears above the Available Players list in tab modes; in wide mode it stays in the left column above the list.

**Persistence**
- Last active tab and wide-mode panel visibility are stored in `localStorage` (`auctionWorkspaceTab`, `auctionSectionVisibility`).

**Ownership**
- Workspace layout components are System UI only (`--surface-*`, `--brand-*`, etc.).
- Auction handlers and Pusher state remain in `AuctionControlPanel.tsx`; the workspace shell is presentational.

