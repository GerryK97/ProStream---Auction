# Final QA + Architecture Review: Overlay Token Rotation

## A. Critique

1. **[BLOCKER] Rotation race condition creates a privilege gap.** The state diagram says `rotating -> active` happens when "successor token validated," but the successor is a *separate* DB row with its own `active` state. If an attacker exfiltrates the OBS scene during the 90s grace window, they get the *successor* token (the long-lived one), not just the expiring predecessor. Rotation must invalidate the leaked URL's *usefulness*, not extend it. Fix: the successor token should only become deliverable through an authenticated admin channel, never embedded in the Pusher `overlay:rotating` payload that any current holder of the old token can receive.

2. **[BLOCKER] `GET /status` returning `successorToken` is a token-leak primitive.** Any holder of the soon-to-be-revoked token can call `/status` and harvest the replacement. This defeats the entire rotation threat model (point 1 of the threat model: "OBS exports share the full URL"). The endpoint must return only opaque state (`active|rotating|expired|revoked`) and `expiresAt`, never the successor id.

3. **[BLOCKER] `OVERLAY_SECRET_TOKEN` removal is deferred to "a follow-up PR" with a 2-week log review.** The threat model explicitly calls this out as a bypass of *all* session controls. Shipping rotation while leaving a shared-secret backdoor in place is incoherent. Either gate the legacy path behind a kill switch in this PR, or accept that the threat model is aspirational.

4. **[MAJOR] Theme/palette allowlist is defined as "a constant in `validateOverlaySessionToken.ts`."** Allowlists that live in middleware files drift. Worse, the design doesn't say what happens to *currently in-use* themes that aren't on the allowlist on day 1. Need a discovery pass against production logs before enforcement, or a soft-fail mode for one release.

5. **[MAJOR] Mongo TTL index suggestion conflicts with audit/back-reference goals.** Section 5 proposes `{expiresAt: 1}` *optionally* as a TTL index, but `predecessorTokenId` back-references require the predecessor row to *exist*. If TTL auto-purges, audit chains break. Pick one: keep rows forever (no TTL) or accept no audit trail. Don't leave it as "optional."

6. **[MAJOR] No rate limit / abuse control on `/rotate`.** A compromised admin session or buggy client could rotate in a loop, generating an unbounded chain of successor tokens, each with its own 90s grace window where *both* are valid. Need a minimum interval between rotations per `(tournamentId, overlayType)` (e.g., 60s) and a max-chain-depth before forcing manual review.

7. **[MAJOR] `overlay:expiring` 24h warning is delivered via Pusher to the overlay client, but the streamer is typically not looking at the overlay.** The "non-blocking toast" lands on the broadcast itself, visible to viewers. Warnings belong on the admin dashboard channel, not the public overlay channel. Open question 5 hints at this but the design ships it the wrong way.

8. **[MINOR] "Force-migrate, sessions past 30d get `now + 7d`" silently extends tokens that should arguably be expired.** A token older than 30d at migration time is, by the new policy, already expired. Granting 7 more days is a courtesy, but it should be logged and surfaced to the admin, not silent.

---

## B. Final Consolidated Plan

### 1. Threat Model
Same as input, plus: **rotation-window harvest** (an attacker holding the old token must not be able to discover the new token), and **legacy shared-secret bypass** must be neutralized in the same release, not deferred.

### 2. Decision Table

| Requirement | Decision | Change vs Sonnet |
|---|---|---|
| Expiry | 30d TTL via `expiresAt` (DB), opaque UUIDv4 | Keep |
| Rotation + grace | 60s grace (down from 90s); old token enters `rotating`; **successor token id is never returned to anyone holding the old token**; Pusher `overlay:rotating` carries only `{state: "rotating", gracePeriodSec}` | Tightened: 60s reduces harvest window; successor flows only via authenticated admin channel |
| Scope binding | `(tournamentId, overlayType)` in DB row | Keep |
| Theme/palette | Allowlist, but shipped in **observe-only mode** for 1 release (log violations, do not reject), then enforce | Changed: prevents day-1 outage from undiscovered legitimate themes |
| Legacy secret | `OVERLAY_SECRET_TOKEN` path gated behind a `LEGACY_OVERLAY_SECRET_ENABLED` env flag, default off in prod, removed entirely after one release | Changed: closes the bypass in the same release |
| Backward compat | Force-migrate; sessions already past 30d get `expiresAt = now + 7d` **and emit an admin notification per affected session** | Tightened: no silent grace |
| Rotation cost | Free (preserves one-time wallet charge semantics) | Keep |
| Rate limit | Min 60s between rotations per `(tournamentId, overlayType)`; max chain depth 10 within 24h | New |
| Expiry warning channel | Admin Pusher channel (`private-admin-tournament-<id>`), not the public overlay channel | Changed: avoids broadcasting to viewers |

### 3. State Diagram

```mermaid
stateDiagram-v2
    [*] --> active : POST /sessions (wallet charged once)
    active --> rotating : POST /sessions/[token]/rotate (rate-limited)
    active --> revoked : DELETE /sessions/[token]
    active --> expired : expiresAt < now
    rotating --> revoked : rotationExpiresAt elapsed (60s)
    rotating --> revoked : DELETE called explicitly
    expired --> [*]
    revoked --> [*]

    note right of rotating : Successor is a NEW active session.\nIts token is delivered ONLY via\nauthenticated admin response to /rotate.\nPusher event carries no token material.
    note right of active : overlay:expiring fires on\nadmin channel 24h before expiresAt
```

### 4. API Surface

| Method | Route | Notes |
|---|---|---|
| `POST` | `/api/overlay/sessions` | Unchanged; wallet charge here |
| `GET` | `/api/overlay/sessions` | Admin-only list |
| `DELETE` | `/api/overlay/sessions/[token]` | Immediate revoke |
| `POST` | `/api/overlay/sessions/[token]/rotate` | **Admin-auth required** (not callable by overlay client). Returns `{newToken, newUrl, gracePeriodSec}` in the HTTP response only. Rate-limited. |
| `GET` | `/api/overlay/sessions/[token]/status` | Returns `{state, expiresAt}` only. Never returns `successorTokenId`. |
| `POST` | `/api/overlay/sessions/migrate` | Internal admin; idempotent |

### 5. Mongo Schema

| Field | Type | Meaning |
|---|---|---|
| `expiresAt` | `Date` | Hard expiry; null only on un-migrated rows |
| `rotationExpiresAt` | `Date \| null` | Grace deadline; null when not rotating |
| `successorTokenId` | `String \| null` | **Server-side audit only**; never serialized to any client response |
| `predecessorTokenId` | `String \| null` | Audit back-ref |
| `themeSnapshot` | `Object \| null` | Audit; not enforced |
| `rotationCount24h` | `Number` | For rate-limit / chain-depth enforcement |

Indexes: `{expiresAt: 1}` (plain, **no TTL**, to preserve audit chain), `{tournamentId: 1, overlayType: 1}`.

### 6. Client/UX Changes
- **Manage page**: Rotate button, expiry badge (yellow <5d, red <1d), modal showing new URL immediately on rotate success, copy-to-clipboard.
- **`usePusherAuction.ts`**: On `overlay:rotating`, keep rendering stale data for up to 60s; do **not** attempt to fetch the new token from the public channel. If the overlay is still mounted after grace, surface a "session rotated" admin-only state and stop rendering.
- **Admin dashboard**: Subscribes to `private-admin-tournament-<id>` for `overlay:expiring` (24h warning) and `overlay:rotated` notifications. Toasts/badges live here, not on the public overlay.
- **`validateOverlaySessionToken.ts`**: Adds expiry check, grace-window acceptance, and theme/palette allowlist in **observe-only** mode initially (logs to a metric, does not 400).

### 7. Migration Plan
1. Ship schema fields + middleware behind feature flag `OVERLAY_EXPIRY_ENFORCED=false`; allowlist in observe-only mode.
2. Run `scripts/migrateOverlaySessions.ts`: backfill `expiresAt = max(createdAt + 30d, now + 7d)`. For each row where `createdAt + 30d < now`, emit an admin notification listing the affected tournament.
3. Verify `countDocuments({expiresAt: null}) === 0`.
4. Review one week of allowlist-violation logs; expand allowlist to cover legitimate themes.
5. Flip `OVERLAY_EXPIRY_ENFORCED=true` and enable allowlist enforcement.
6. Set `LEGACY_OVERLAY_SECRET_ENABLED=false` in prod (closes shared-secret bypass).
7. Follow-up PR: delete legacy `OVERLAY_SECRET_TOKEN` code path entirely.

### 8. Remaining Open Questions
1. **Successor URL delivery to live streamers**: admin dashboard is the canonical surface; do we also want an email-on-rotate? (Defer; dashboard is sufficient for v1.)
2. **Per-overlayType allowlist vs global**: ship global for v1; revisit if observe-only logs show conflicts.
3. **Renewal beyond 30d**: product decision on whether multi-month tournaments require a new wallet charge or a free renew. Default v1: free rotate, no new charge (preserves one-time charge invariant); revisit if abuse appears.

---

## C. Implementation Order

1. Add schema fields (`expiresAt`, `rotationExpiresAt`, `successorTokenId`, `predecessorTokenId`, `themeSnapshot`, `rotationCount24h`) and non-TTL indexes.
2. Implement `validateOverlaySessionToken` updates: expiry check + grace acceptance + allowlist in observe-only mode, all behind `OVERLAY_EXPIRY_ENFORCED` flag.
3. Implement `POST /rotate` (admin-auth, rate-limited, returns new token only in HTTP response) and harden `GET /status` to never leak successor id.
4. Gate legacy `OVERLAY_SECRET_TOKEN` behind `LEGACY_OVERLAY_SECRET_ENABLED` env flag (default off in prod).
5. Wire admin Pusher channel for `overlay:expiring` and `overlay:rotated`; remove any token material from public overlay Pusher payloads.
6. Build manage-page Rotate UI with post-rotate modal showing the new URL.
7. Write and run idempotent migration script; emit admin notifications for past-due sessions.
8. After one week of allowlist observation, expand allowlist, flip enforcement flag, and disable legacy secret in prod.
9. Follow-up PR: delete legacy secret code path.

---

## D. Verifiable Acceptance Criteria

- **Token containment**: `GET /api/overlay/sessions/[token]/status` and every Pusher event on the public overlay channel can be inspected and contain no field whose value equals any other session's token. (Automated test: rotate a session, assert response bodies/events for the old token reveal nothing matching the new token.)
- **Grace window correctness**: After `POST /rotate`, both old and new tokens authenticate successfully for 60s; at 61s the old token returns 401 and the new token still works. (Integration test with fake clock.)
- **Rate limit**: Two `POST /rotate` calls within 60s on the same `(tournamentId, overlayType)` return 429 on the second call.
- **Legacy bypass closed**: With `LEGACY_OVERLAY_SECRET_ENABLED=false`, requests to `/api/tournaments/active` carrying `OVERLAY_SECRET_TOKEN` return 401.
- **Migration completeness**: `db.overlaysessions.countDocuments({expiresAt: null}) === 0` post-migration; admin notification log contains one entry per session where `createdAt + 30d < migrationRunTime`.
- **Allowlist observability**: Observe-only mode emits a structured log/metric for each rejected key without returning 400, and the metric is queryable for the one-week review.