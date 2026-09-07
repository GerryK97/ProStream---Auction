#!/usr/bin/env node
/**
 * Pricing is money. These assertions pin the exact agreed behaviour:
 * 6000 up to 150 players, +1000 per extra block of 50, teams unlimited.
 */
import assert from 'node:assert/strict';
import {
  DEFAULT_PACKAGE_PRICES,
  PACKAGE_INCLUDED_PLAYERS,
  calculateLimitIncreasePrice,
  calculatePackagePrice,
  countExtraPlayerBlocks,
  describePackage,
  getPackagePricingDefaultsByKey,
  resolvePlayerLimit,
} from '../../src/lib/overlays/auctionPackagePricing.ts';

// ── The agreed headline numbers ──────────────────────────────────────────────
assert.equal(calculatePackagePrice(0), 6000, 'a tournament with no players still pays the base package');
assert.equal(calculatePackagePrice(1), 6000);
assert.equal(calculatePackagePrice(150), 6000, '150 players is the included allowance');
assert.equal(calculatePackagePrice(151), 7000, 'one player over the allowance costs a full block');
assert.equal(calculatePackagePrice(175), 7000, 'the stated example: 175 players costs 7000');
assert.equal(calculatePackagePrice(200), 7000, 'a full block covers up to 200');
assert.equal(calculatePackagePrice(201), 8000);
assert.equal(calculatePackagePrice(250), 8000);
assert.equal(calculatePackagePrice(251), 9000);
assert.equal(calculatePackagePrice(261), 9000, 'largest real production tournament');

// ── Block counting ───────────────────────────────────────────────────────────
assert.equal(countExtraPlayerBlocks(150), 0);
assert.equal(countExtraPlayerBlocks(151), 1);
assert.equal(countExtraPlayerBlocks(200), 1);
assert.equal(countExtraPlayerBlocks(201), 2);

// ── Allowance resolution: paying for 175 must unlock 200 ─────────────────────
assert.equal(resolvePlayerLimit(150), 150);
assert.equal(resolvePlayerLimit(175), 200, 'paying the 175 price unlocks the whole block');
assert.equal(resolvePlayerLimit(200), 200);
assert.equal(resolvePlayerLimit(201), 250);
assert.equal(resolvePlayerLimit(261), 300);

// A resolved limit must never cost more than the count that produced it,
// otherwise a customer could be charged for an allowance they were not given.
for (const players of [0, 1, 149, 150, 151, 175, 199, 200, 201, 249, 250, 251, 261, 999]) {
  const limit = resolvePlayerLimit(players);
  assert.ok(limit >= players, `limit ${limit} must cover ${players}`);
  assert.equal(
    calculatePackagePrice(players),
    calculatePackagePrice(limit),
    `price at ${players} must equal price at its resolved limit ${limit}`,
  );
}

// ── Top-ups charge only the difference, never the base again ─────────────────
assert.equal(calculateLimitIncreasePrice(150, 150), 0, 'no change costs nothing');
assert.equal(calculateLimitIncreasePrice(150, 140), 0, 'shrinking costs nothing');
assert.equal(calculateLimitIncreasePrice(150, 175), 1000, 'one extra block');
assert.equal(calculateLimitIncreasePrice(150, 200), 1000);
assert.equal(calculateLimitIncreasePrice(150, 201), 2000, 'two extra blocks');
assert.equal(calculateLimitIncreasePrice(200, 201), 1000, 'top-up from an existing paid block');
assert.equal(calculateLimitIncreasePrice(200, 250), 1000);
assert.equal(calculateLimitIncreasePrice(250, 261), 1000);

// Upgrading in steps must never cost more than going straight there, so an
// operator is never penalised for topping up gradually.
const direct = calculatePackagePrice(250);
const staged =
  calculatePackagePrice(150) +
  calculateLimitIncreasePrice(150, 200) +
  calculateLimitIncreasePrice(200, 250);
assert.equal(staged, direct, 'staged top-ups must total the same as buying outright');

// ── Defensive input handling ─────────────────────────────────────────────────
assert.equal(calculatePackagePrice(-5), 6000, 'negative counts must not reduce the price');
assert.equal(calculatePackagePrice(Number.NaN), 6000, 'NaN must not produce NaN pricing');
assert.equal(calculatePackagePrice(150.7), 6000, 'fractional counts floor, never round up into a paid block');
assert.equal(resolvePlayerLimit(-5), 150);
assert.ok(Number.isInteger(calculatePackagePrice(261)), 'prices must stay integers for the wallet');

// ── Admin-configured prices flow through ─────────────────────────────────────
const custom = { basePrice: 5000, playerBlockPrice: 500 };
assert.equal(calculatePackagePrice(150, custom), 5000);
assert.equal(calculatePackagePrice(175, custom), 5500);
assert.equal(calculateLimitIncreasePrice(150, 201, custom), 1000);
assert.equal(calculatePackagePrice(150, { basePrice: 0, playerBlockPrice: 0 }), 0, 'admin can make it free');

assert.deepEqual(DEFAULT_PACKAGE_PRICES, { basePrice: 6000, playerBlockPrice: 1000 });
assert.deepEqual(getPackagePricingDefaultsByKey(), {
  auction_package_base: 6000,
  auction_package_player_block: 1000,
});
assert.equal(PACKAGE_INCLUDED_PLAYERS, 150);
assert.match(describePackage(200), /up to 200 players/);
assert.match(describePackage(200), /unlimited teams/);

console.log('Auction package pricing tests passed.');
