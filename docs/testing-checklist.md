# Testing Checklist

## Baseline Checks
- Run `npm run lint`.
- Run `npx tsc --noEmit`.
- Run relevant tests when available.
- Confirm no unrelated tracked files were changed.

## System UI Verification
- Check light and dark theme contrast when System UI tokens change.
- Verify keyboard focus, hover, disabled, and active states.
- Check responsive layouts for management pages and forms.
- Confirm no overlay tokens are used in System UI surfaces.

## Overlay Verification
- Confirm overlay routes render without app chrome.
- Verify selected overlay theme and palette variables apply only inside overlay output.
- Check readability at target OBS dimensions, especially 1920 by 1080.
- Verify missing images, no current player, sold state, loading state, and error/revoked states.
- Check animation and effects do not degrade live rendering.

## Boundary Verification
- Search for accidental `--overlay-*`, `--t1`, or `--t2-*` usage outside overlay renderers and isolated previews.
- Search for System UI `--surface-*` usage inside output-facing overlay renderers unless explicitly justified.
- Confirm docs are updated for token, architecture, or theme changes.

## Current Baseline Notes
- The repository currently passes typecheck.
- Lint currently passes with existing React hook dependency warnings unrelated to the governance baseline.
- There is no dedicated automated visual boundary test suite yet.
