# ProStream Auction Î“Ã‡Ã¶ Short-Lived Overlay Token Rotation Design

---

## 1. Threat Model

- **Scene collection leak**: OBS exports share the full URL including `?token=`, exposing a permanent bearer to anyone who receives the collection.
- **Token replay after revoke**: Without expiry, a revoked token window is only as fast as the DELETE + Pusher event Î“Ã‡Ã¶ a race condition on flaky connections leaves tokens alive.
- **Scope escalation**: A token issued for `bracket` overlay could theoretically be replayed against `scoreboard` if validation is loose (depends on `validateOverlaySessionToken` impl).
- **Unbounded theme/palette injection**: Free-form `?theme=` params hit `effectiveTournament` with no sanitization Î“Ã‡Ã¶ XSS/prototype-pollution risk in SSR path.
- **Shared-secret legacy endpoint**: `/api/tournaments/active` still accepts `OVERLAY_SECRET_TOKEN`; if that env leaks, all tournaments are exposed regardless of session controls.

---

## 2. Decision Summary Table

| Requirement | Decision | Rationale |
|---|---|---|
| **1. Expiry** | 30-day TTL stored in DB (`expiresAt`). No JWT expiry claim. | Opaque tokens keep revocation simple; DB is the source of truth for `isActive`. 30 days matches typical tournament lifecycle. |
| **2. Rotation + grace** | New `POST /rotate` creates successor token; old token enters `rotating` state with 90-second grace `rotationExpiresAt`. Pusher fires `overlay:rotating` event immediately. | 90s is enough for OBS to reload; client auto-fetches new token from a `refreshUrl` embedded in the Pusher payload. No black screen. |
| **3. Scope binding** | `(tournamentId, overlayType)` bound in DB row, checked server-side on every request. Theme/palette/debug are **not** signed Î“Ã‡Ã¶ they are validated against an allowlist instead. | Signing URL params requires key management overhead that isn't justified; allowlist validation is simpler and sufficient. |
| **4. Backward compat** | **Force-migrate** existing sessions: backfill `expiresAt = createdAt + 30d` and `rotationExpiresAt = null`. Sessions already past 30d get `expiresAt = now + 7d` (grace window). | Deprecation window adds two code paths forever. One-time migration script + 7-day buffer is cleaner. |
| **5. Opaque vs signed** | Stay **opaque DB ids** (UUIDv4). | Rotation requires immediate invalidation Î“Ã‡Ã¶ JWT expiry can't be revoked without a blocklist, which negates the DB-skip benefit. DB read on hot path is one indexed lookup; acceptable. |
| **6. UX / expiry warning** | Admin dashboard polls `GET /api/overlay/sessions` and shows a warning badge if `expiresAt < now + 5d`. Pusher `overlay:expiring` event fires 24h before expiry; client overlay displays a non-blocking toast. | Streamers need passive warning, not interruption. Recovery path: rotate from manage page, new URL auto-updates in dashboard. |
| **7. Theme/palette allowlist** | Validate in `validateOverlaySessionToken` middleware, immediately after token auth, before touching `effectiveTournament`. Reject unknown keys with 400. | Fails fast, single enforcement point, no downstream pollution. |

---

## 3. Token Lifecycle State Diagram

```mermaid
stateDiagram-v2
    [*] --> active : POST /sessions (wallet charged once)
    active --> rotating : POST /sessions/[token]/rotate
    active --> revoked : DELETE /sessions/[token]
    active --> expired : expiresAt < now (checked on request)
    rotating --> active : successor token validated\n(old token used within grace window)
    rotating --> revoked : rotationExpiresAt elapsed\n(background job or on-request check)
    expired --> [*]
    revoked --> [*]

    note right of rotating : Grace window = 90s\nBoth old + new tokens valid\nPusher overlay:rotating fires immediately
    note right of active : Pusher overlay:expiring fires\n24h before expiresAt
```

---

## 4. Concrete API Surface

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/overlay/sessions` | Create session (existing, unchanged Î“Ã‡Ã¶ wallet charge happens here) |
| `GET` | `/api/overlay/sessions` | List sessions for admin (existing) |
| `DELETE` | `/api/overlay/sessions/[token]` | Immediate revoke (existing) |
| `POST` | `/api/overlay/sessions/[token]/rotate` | Invalidate old token after grace window; return new token + `refreshUrl`; fire Pusher `overlay:rotating` |
| `GET` | `/api/overlay/sessions/[token]/status` | Lightweight liveness check (returns state + `expiresAt` + `successorToken` if rotating) Î“Ã‡Ã¶ used by overlay client to self-heal |
| `POST` | `/api/overlay/sessions/migrate` | (Internal/admin-only) Backfill `expiresAt` on legacy sessions |

---

## 5. Mongo Schema Additions (additive)

| Field | Type | Meaning |
|---|---|---|
| `expiresAt` | `Date` | Hard expiry. Null on legacy docs until migration runs. Requests reject if `expiresAt < now`. |
| `rotationExpiresAt` | `Date \| null` | If set, this token is in `rotating` state until this timestamp, then becomes `revoked`. |
| `successorTokenId` | `String \| null` | `_id` of the replacement session created by rotate. Lets the overlay client fetch its new URL. |
| `predecessorTokenId` | `String \| null` | Back-reference for audit trail. |
| `themeSnapshot` | `Object \| null` | Optional: snapshot of theme/palette at issue time for audit. Not enforced on requests. |

Index to add: `{ expiresAt: 1 }` with TTL if you want Mongo to auto-purge expired docs (optional Î“Ã‡Ã¶ only do this if you want hard deletion; otherwise keep for audit).

---

## 6. Client/UX Changes

- **`app/manage/overlays/sessions/page.tsx`**: Add "Rotate" button per session row. Show expiry date + warning badge (yellow < 5 days, red < 1 day). Show successor URL immediately after rotate completes.
- **`hooks/usePusherAuction.ts`**: Handle `overlay:rotating` event Î“Ã‡Ã¶ call `GET /status` on the successor token, update the overlay's internal token ref, reload data fetch without unmounting component.
- **`hooks/usePusherAuction.ts`**: Handle `overlay:expiring` event Î“Ã‡Ã¶ display non-blocking toast with link to manage page.
- **`lib/validateOverlaySessionToken.ts`**: Add expiry check (`expiresAt`), grace window check (`rotationExpiresAt`), and theme/palette allowlist validation (allowlist defined as a constant in this file).
- **Overlay page components** (`app/overlay/[type]/page.tsx` or equivalent): On `overlay:rotating`, do not unmount Î“Ã‡Ã¶ stay alive on stale data for up to 90s while reconnect completes.

---

## 7. Migration Plan for Existing Sessions

1. **Write migration script** (`scripts/migrateOverlaySessions.ts`): for each `OverlaySession` where `expiresAt` is null, set `expiresAt = max(createdAt + 30d, now + 7d)`. Set `rotationExpiresAt = null`, `successorTokenId = null`, `predecessorTokenId = null`.
2. **Run migration against prod** during low-traffic window (read: overnight). Script is idempotent Î“Ã‡Ã¶ safe to re-run.
3. **Deploy new validation logic** with a feature flag that skips expiry check if `expiresAt` is null (temporary). This ensures zero downtime if migration hasn't finished.
4. **Verify migration completion** Î“Ã‡Ã¶ query `db.overlaysessions.countDocuments({ expiresAt: null })` returns 0.
5. **Remove feature flag** Î“Ã‡Ã¶ expiry check is now enforced for all sessions.
6. **Remove `OVERLAY_SECRET_TOKEN` path** from `/api/tournaments/active` in a follow-up PR after confirming no production traffic uses it (check logs for 2 weeks).

---

## 8. Open Questions for Opus to Challenge

1. **Grace window duration**: 90s is a guess based on OBS reload time. Is there empirical data, or should the grace window be configurable per session? Risk: too short = black screen; too long = leaked token stays valid.
2. **Rotation cost**: Design says rotation is free (wallet charged once at creation). Is this correct product intent? Edge case: tournament extends 3 months Î“Ã‡Ã¶ should renewal beyond 30 days trigger a new charge?
3. **Auto-renewal vs manual rotate**: Should the overlay client silently auto-rotate by calling `/rotate` itself (requires the client to hold admin-level auth), or is rotate always an admin-initiated action? Current design assumes admin-only Î“Ã‡Ã¶ is that acceptable for self-service streamers?
4. **Theme/palette allowlist scope**: Should the allowlist be per-`overlayType` (bracket has different valid themes than scoreboard) or global? A global list is simpler but may block legitimate future themes.
5. **Successor URL delivery**: After rotate, the new URL must reach the streamer. Design relies on them checking the manage page. Is there a push path (email, webhook, Pusher to admin UI) that is more reliable for a streamer who is live and away from their dashboard?