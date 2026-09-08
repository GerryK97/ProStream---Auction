/**
 * Regression tests for overlay player-card size arbitration.
 *
 * Bug: the overlay only applied a Large/Small change after a hard refresh.
 * Cause: `sizeRev` was treated as a permanent global high-water mark, but each
 * controller (web, mobile web, Expo) keeps its own counter starting at 0. Once
 * the overlay had seen a high revision, every lower revision from another
 * controller was discarded forever. Refreshing reset the mark, which is why a
 * reload appeared to "fix" it.
 *
 * Run: npm run test:overlay-size-rev
 */

import assert from 'node:assert/strict';

import {
  createSizeRevState,
  isStaleSizeRev,
  recordSizeRev,
  SIZE_REV_TTL_MS,
} from '../src/lib/overlays/overlaySizeRev';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

console.log('overlay size-rev arbitration');

test('out-of-order patch within a burst is dropped', () => {
  const state = createSizeRevState();
  const t0 = 1_000_000;
  // Auto-switch publishes Large (rev 5), then its stale Small (rev 4) lands late.
  recordSizeRev(state, 5, t0);
  assert.equal(isStaleSizeRev(state, 4, t0 + 50), true, 'late lower rev must be dropped');
});

test('in-order patch within a burst is applied', () => {
  const state = createSizeRevState();
  const t0 = 1_000_000;
  recordSizeRev(state, 5, t0);
  assert.equal(isStaleSizeRev(state, 6, t0 + 50), false, 'higher rev must apply');
});

test('a later action from another controller is applied even with a lower rev', () => {
  // THE REPORTED BUG: the overlay saw rev 12 from the web panel, then the
  // operator used the Expo app whose counter starts at 0 -> rev 1. Previously
  // that was discarded forever and only a hard refresh recovered.
  const state = createSizeRevState();
  const webBurst = 1_000_000;
  recordSizeRev(state, 12, webBurst);

  const laterTap = webBurst + SIZE_REV_TTL_MS + 1;
  assert.equal(
    isStaleSizeRev(state, 1, laterTap),
    false,
    'a fresh controller must not be silenced by an older burst',
  );
});

test('same-controller ordering still holds after the guard expires', () => {
  const state = createSizeRevState();
  const t0 = 1_000_000;
  recordSizeRev(state, 12, t0);

  const nextBurst = t0 + SIZE_REV_TTL_MS + 1;
  recordSizeRev(state, 1, nextBurst);
  assert.equal(
    isStaleSizeRev(state, 0, nextBurst + 10),
    true,
    'within the new burst, ordering is enforced again',
  );
});

test('missing rev is never treated as stale', () => {
  const state = createSizeRevState();
  recordSizeRev(state, 9, 1_000_000);
  assert.equal(
    isStaleSizeRev(state, undefined, 1_000_010),
    false,
    'publishes without a rev must always apply',
  );
});

test('a fresh overlay applies the first update it sees', () => {
  const state = createSizeRevState();
  assert.equal(isStaleSizeRev(state, 0, 1_000_000), false, 'rev 0 must apply on a fresh overlay');
});

test('repeated taps from one controller stay responsive', () => {
  // Operator taps Small, Large, Small in quick succession from one panel.
  const state = createSizeRevState();
  let now = 1_000_000;
  for (const rev of [1, 2, 3]) {
    assert.equal(isStaleSizeRev(state, rev, now), false, `rev ${rev} must apply`);
    recordSizeRev(state, rev, now);
    now += 200;
  }
});

console.log(`\n${passed} passed`);
