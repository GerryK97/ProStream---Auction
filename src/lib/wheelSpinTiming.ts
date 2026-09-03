/** Authoritative wheel rotation duration shared by API, controls, and overlays. */
export const WHEEL_SPIN_DURATION_MS = 3_000;

/** Keep the winner reveal on screen briefly after the wheel stops. */
export const WHEEL_WINNER_HOLD_MS = 1_000;

/** Retain event data long enough for reveal/exit animations and late renders. */
export const WHEEL_DATA_CLEANUP_BUFFER_MS = 3_500;

/**
 * Maximum number of segments broadcast to the spin overlay. Large tournaments can
 * have hundreds of available players; sending them all (a) blows past Pusher's
 * 10 KB per-event limit (HTTP 413) and (b) makes the wheel unreadable. We cap the
 * reel to this many slices — the true winner is always included — so the payload
 * stays small and the wheel stays legible.
 */
export const WHEEL_MAX_SEGMENTS = 60;
