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
