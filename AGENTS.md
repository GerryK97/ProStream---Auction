# ProStream Auction Agent Guide

## Project Overview
ProStream Auction is a real-time auction management and broadcast overlay application for sports and e-sports tournaments. The app combines an internal management UI with output-facing overlay routes intended for OBS/browser-source rendering.

## Product Goals
- Let admins manage tournaments, teams, players, bidding, results, and overlay sessions.
- Provide stable System UI surfaces for repeated operational work.
- Generate visually distinct overlay outputs that can match broadcast identity without inheriting the app shell aesthetic.
- Preserve live-auction reliability, readability, and rendering performance.

## Architecture Overview
- `src/app` contains Next.js App Router pages and API routes.
- `src/components` contains System UI, shared components, overlay controls, and overlay render components.
- `src/components/overlays` contains output-facing overlay renderers, grouped by theme and shared overlay-only pieces.
- `src/config/overlayPalettes.ts` owns overlay palette CSS variables.
- `src/app/globals.css` owns global System UI theme variables and utility classes.
- `src/models`, `src/lib`, `src/hooks`, and `src/contexts` provide data, auth, realtime, and app state behavior.

## Layer Separation Rules
The app has two separate visual systems:
- System UI Design System: app shell, navigation, dashboard, forms, modals, settings, editor panels, and internal management UI.
- Overlay Output Design Systems: OBS/browser-source visual outputs with independent palettes, typography, effects, and art direction.

Do not merge these systems. Overlay themes may diverge from System UI. System UI must not import overlay aesthetics.

## System UI Rules
- System UI tokens use global semantic variables such as `--surface-*`, `--text-*`, `--brand-*`, `--status-*`, `--border-*`, and `--focus-ring`.
- System UI must remain stable, reusable, accessible, and product-oriented.
- Management UI should prefer predictable density, clear hierarchy, accessible controls, and consistent interaction states.
- Do not use overlay tokens in app shell, dashboard, forms, navigation, management pages, or modals.

## Overlay Theme Rules
- Overlay themes own output-facing tokens such as `--overlay-*`, `--t1*`, and `--t2-*`.
- Each overlay theme may define independent palette, typography, spacing behavior, motion, effects, mood, and visual language.
- Overlay components must maintain internal consistency, readability, performance, and deterministic styling.
- Do not force overlay themes to match System UI.

## Shared Primitive Rules
- Shared primitives must be visually neutral or layer-aware.
- Shared utilities may handle behavior, formatting, data flow, and layout primitives.
- Shared primitives must not couple System UI tokens to overlay rendering or overlay tokens to System UI.

## Coding Standards
- Prefer existing local patterns and framework conventions.
- Keep changes scoped to the affected layer.
- Avoid unrelated refactors, formatter-wide churn, and hardcoded styling that bypasses owned token systems.
- Use typed interfaces for shared contracts and API-facing data.
- Preserve existing uncommitted work unless explicitly told to modify it.

## Design Standards
- Identify the affected layer before styling changes: System UI, Overlay Output, or Shared primitive.
- Use semantic tokens from the correct owner.
- Maintain responsive behavior and accessible focus/contrast for System UI.
- Maintain broadcast readability, stable dimensions, and performance for overlays.

## Naming Conventions
- System UI tokens should remain semantic and app-wide.
- Overlay theme tokens should include a theme or overlay namespace.
- Theme-specific components should remain grouped by overlay theme directory when applicable.
- Avoid generic token names that obscure ownership.

## Safety Constraints
- Never leak overlay colors into app shell or System UI.
- Never reuse app-shell surfaces inside overlays unless explicitly designed as a neutral primitive.
- Never collapse System UI and overlay theme tokens into one aesthetic system.
- Never rewrite overlay rendering, layout, or theme architecture as part of a narrow visual change unless requested.

## Audit-First Workflow
Before design or architecture edits:
1. Identify affected layer.
2. Audit existing implementation and token ownership.
3. Identify dependencies, risks, duplication, hardcoded values, and theme boundary concerns.
4. Plan the safest incremental implementation.
5. Update relevant documentation when architecture, tokens, styling logic, theme behavior, or shared abstractions change.

## Verification Requirements
- Run lint and typecheck when practical.
- Run relevant tests if available.
- For visual changes, verify responsive behavior, accessibility, and layer boundaries.
- For overlay changes, verify output routes still render and overlay tokens remain isolated.
- Summarize changed files, documentation updates, tradeoffs, and remaining risk.

## Documentation Update Rules
Update docs whenever changes affect architecture, theme structure, tokens, styling logic, overlay rendering, component patterns, folder organization, naming conventions, shared abstractions, or theme behavior.

Primary docs:
- `docs/architecture.md`
- `docs/design-system.md`
- `docs/overlay-theme-system.md`
- `docs/theme-boundaries.md`
- `docs/component-guidelines.md`
- `docs/coding-standards.md`
- `docs/testing-checklist.md`
- `docs/theming-guide.md`

## Performance Expectations
- Keep overlay rendering deterministic and lightweight enough for OBS/browser-source use.
- Avoid unnecessary animation, layout thrash, and expensive effects in live overlays.
- Keep System UI responsive during live auction operations and realtime updates.

## Accessibility Expectations
- System UI must preserve keyboard access, focus visibility, readable contrast, usable forms, and meaningful control labels.
- Overlay outputs prioritize broadcast readability and contrast at target resolutions.
- Motion-sensitive behavior should respect reduced-motion patterns where practical.

## Refactor Safety Rules
- Refactor only when it reduces real complexity, fixes an architectural boundary problem, or matches an explicit request.
- Preserve layout and wiring during theme refinement unless the task calls for behavior changes.
- Avoid broad rewrites of overlay engine, rendering pipeline, or component hierarchy during visual polish work.

## AI-Agent Operational Workflow
- Audit first, plan second, implement third, verify last.
- State affected layer and token ownership for design-related changes.
- Keep edits incremental and reversible.
- Protect user changes in the worktree.
- Update documentation continuously as the codebase evolves.
