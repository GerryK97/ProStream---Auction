# Coding Standards

## General
- Prefer existing repo patterns over new architecture.
- Keep edits scoped and avoid unrelated refactors.
- Use TypeScript types for shared contracts, API payloads, and model-facing data.
- Avoid broad formatting churn.
- Preserve user changes in a dirty worktree.

## Styling
- Use the correct token owner for the affected layer.
- System UI should use System UI semantic variables.
- Overlay output should use overlay theme variables.
- Avoid raw color values unless documenting a new token or exceptional case.
- Do not introduce global CSS that changes overlay output unintentionally.

## Data And State
- Keep API, model, and TypeScript unions aligned.
- Validate persisted enum changes against UI options and runtime usage.
- Keep realtime overlay state updates deterministic and compatible with current sessions.

## Documentation
Update documentation when changing:
- Architecture or folder organization.
- Theme structure or token ownership.
- Styling logic or component patterns.
- Overlay rendering behavior.
- Shared abstractions or naming conventions.

## Refactoring
- Refactor only when needed for the task or to remove concrete risk.
- Preserve overlay rendering and layout wiring during visual theme refinement unless explicitly requested.
- Do not combine governance, visual polish, and rendering rewrites in one change without a plan.
