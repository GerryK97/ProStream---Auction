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
- Theme 3 components use the `--t3-*` namespace with the same compatibility alias pattern as Theme 2.

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

## Rendering Behavior
- Overlay routes should render without app shell navigation or sidebar.
- Overlay components must tolerate live auction state changes, missing player/team images, and session revocation/error states.
- Theme changes should preserve existing overlay data flow and layout wiring unless the task explicitly changes behavior.
- Invalid or unavailable `theme`/`palette` query values should fall back to the configured tournament theme, default palette, or first available palette without crashing the overlay route.

## Adding Or Refining Themes
- Define palette tokens first.
- Keep theme-specific components grouped by theme directory.
- Reuse only neutral behavior utilities or overlay-specific shared components.
- Document token semantics and any compatibility aliases.
