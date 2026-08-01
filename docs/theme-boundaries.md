# Theme Boundaries

## Boundary Model
ProStream Auction has two independent visual layers:
- System UI Design System for product and management workflows.
- Overlay Output Design Systems for generated broadcast outputs.

These layers may share data and neutral utilities, but they must not share visual identity by accident.

## Token Ownership
- System UI owns `--surface-*`, `--text-*`, `--brand-*`, `--status-*`, `--border-*`, `--focus-ring`, app shell layout, forms, navigation, modals, and controls.
- Overlay Output owns `--overlay-*`, `--t1*`, `--t2-*`, `--t3-*`, overlay typography, overlay palette identity, output-specific motion, and broadcast rendering behavior.
- Shared primitives may own only neutral layout, behavior, data formatting, or accessibility helpers unless explicitly made layer-aware.

## Allowed
- System UI may preview overlay themes using isolated preview blocks.
- Overlay controls may manage overlay configuration while using System UI tokens.
- Overlay components may share neutral helpers for formatting names, prices, player classes, and state.
- Overlay theme palettes may include compatibility aliases for older overlay components.

## Not Allowed
- Overlay colors in app shell, dashboard, forms, or management UI.
- System UI card, modal, or surface styling inside overlay renderers.
- One global typography system forced across app and overlay output.
- Collapsing all themes into one token structure.
- Broad theme rewrites during narrow visual polish tasks.

## Required Review Before Design Changes
For every design-related change, identify:
- Affected layer.
- Token owner.
- Components and routes affected.
- Whether documentation needs updates.
- How boundary isolation will be verified.
