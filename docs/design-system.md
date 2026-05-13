# Design System

## Summary
The System UI Design System governs internal product surfaces. It is separate from Overlay Output themes and should remain stable, accessible, reusable, and operationally focused.

## System UI Tokens
System UI owns:
- Surfaces: `--surface-primary`, `--surface-secondary`, `--surface-elevated`, `--surface-hover`, `--surface-card`, `--surface-subtle`.
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`.
- Borders: `--border-primary`, `--border-secondary`, `--border-hover`.
- Brand and status: `--brand-primary`, `--brand-secondary`, `--accent-color`, `--status-*`.
- Focus and effects: `--focus-ring`, `--backdrop`, navigation variables, and System UI gradients.

## Surface Hierarchy
- Page backgrounds and app shell surfaces use System UI surface tokens.
- Cards, panels, modals, inputs, and menus should use semantic surface and border tokens.
- Avoid raw color values unless introducing a documented token or using an exceptional one-off state.

## Typography
- System UI typography should be readable, compact, and consistent across management workflows.
- Do not globally force overlay typography onto app pages.
- Use heading sizes appropriate to dense application surfaces, not broadcast overlays.

## Spacing And Elevation
- Prefer consistent spacing increments already used by nearby components.
- Use elevation sparingly and consistently for modals, panels, dropdowns, and selected states.
- Avoid nested card structures unless required by repeated item layouts.

## Interaction States
- Buttons, inputs, tabs, toggles, menus, and disclosures must provide hover, disabled, active, and focus-visible states.
- Focus states should use `--focus-ring` or a documented System UI equivalent.

## Accessibility
- Maintain readable contrast in light and dark System UI themes.
- Ensure form controls are keyboard accessible.
- Prefer semantic HTML and labeled controls over visual-only interactions.

## Boundary Rule
System UI must not use overlay tokens such as `--overlay-*`, `--t1*`, or `--t2-*`.
