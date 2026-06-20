# Theming Guide

## System UI Theme
System UI theming is controlled by `ThemeProvider` and `:root[data-theme]` variables in `src/app/globals.css`.

Use System UI tokens for:
- App shell and navigation.
- Dashboard and management pages.
- Forms, inputs, controls, tabs, menus, and modals.
- Overlay configuration panels.

Do not use overlay tokens in these areas.

## Overlay Theme
Overlay themes are selected by tournament fields:
- `overlayTheme`
- `overlayPalette`

Overlay palettes live in `src/config/overlayPalettes.ts`. `OverlayWrapper` applies the active palette CSS variables to the overlay subtree.

Use overlay tokens for:
- OBS/browser-source output routes.
- Theme-specific overlay components.
- Broadcast typography, surfaces, highlights, and motion.

## Theme 1
Theme 1 primarily uses shared `--overlay-*` variables and theme-specific tokens such as `--t1card-gradient-*`.

## Theme 2
Theme 2 uses namespaced `--t2-*` tokens for its independent visual system. It may also provide `--overlay-*` aliases for compatibility with shared overlay components.

## Adding A Palette
- Add the palette in `src/config/overlayPalettes.ts`.
- Keep token names namespaced and deterministic.
- Ensure contrast and readability for key states.
- Confirm the palette appears only in overlay previews or overlay output.
- Update documentation if token semantics change.

## Adding A Theme
- Add a typed theme id in shared TypeScript types.
- Update persistence schema enums.
- Add palette definitions and output page selection UI.
- Add or route to theme-specific overlay components.
- Document the theme namespace, visual intent, and boundary rules.
