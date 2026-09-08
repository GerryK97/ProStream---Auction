/**
 * Overlay player-card size arbitration.
 *
 * `sizeRev` is a per-controller counter: the web panel, the mobile web panel and
 * the Expo app each start at 0 and increment on every size publish. It exists to
 * drop an out-of-order patch inside one burst — specifically the "Small" PATCH
 * left in flight by an auto-switch timer when a new player is selected and a
 * fresh "Large" is published almost simultaneously.
 *
 * Comparing revisions across *different* controllers is meaningless. Treating
 * the counter as a global high-water mark made the overlay permanently ignore
 * size changes from any controller whose counter had not yet climbed past the
 * highest value already seen (e.g. a freshly opened Expo app publishing rev 1
 * while the overlay had seen rev 12 from the web panel). Reloading the overlay
 * reset the mark, which is why the size only applied after a hard refresh.
 *
 * The guard is therefore time-scoped: a revision can only suppress an update
 * while it is recent, which is the only window in which a genuine out-of-order
 * patch can arrive.
 */

/** Ordering only matters between near-simultaneous publishes. */
export const SIZE_REV_TTL_MS = 5000;

export interface SizeRevState {
  /** Highest revision accepted from the most recent burst. */
  rev: number;
  /** When that revision was accepted (epoch ms); 0 means "none yet". */
  at: number;
}

export function createSizeRevState(): SizeRevState {
  return { rev: 0, at: 0 };
}

/**
 * Whether `incomingRev` is an out-of-order patch from the current burst and
 * should not be applied. Revisions are only comparable within `SIZE_REV_TTL_MS`.
 */
export function isStaleSizeRev(
  state: SizeRevState,
  incomingRev: number | undefined,
  now: number = Date.now(),
  ttlMs: number = SIZE_REV_TTL_MS,
): boolean {
  if (incomingRev === undefined) return false;
  const withinBurst = now - state.at < ttlMs;
  return withinBurst && incomingRev < state.rev;
}

/** Record an accepted revision so later patches in the same burst can be ordered. */
export function recordSizeRev(
  state: SizeRevState,
  incomingRev: number | undefined,
  now: number = Date.now(),
): void {
  if (incomingRev === undefined) return;
  state.rev = incomingRev;
  state.at = now;
}
