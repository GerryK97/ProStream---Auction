/**
 * Auction package pricing.
 *
 * One purchase unlocks a tournament's overlays. There is no per-overlay
 * charge: the operator picks one full-screen variant, and the Custom and
 * Team Owners outputs are always included.
 *
 * The package covers a player allowance. Beyond the included allowance the
 * price rises in whole blocks, so 175 players costs one extra block, the same
 * as 200 players. Teams are always unlimited.
 *
 * Amounts are wallet units (credits), not a currency.
 */

export const PACKAGE_BASE_PRICE_KEY = 'auction_package_base';
export const PACKAGE_PLAYER_BLOCK_PRICE_KEY = 'auction_package_player_block';

/** Players covered by the base price. */
export const PACKAGE_INCLUDED_PLAYERS = 150;
/** Additional players unlocked per paid block. */
export const PACKAGE_PLAYER_BLOCK_SIZE = 50;

export const DEFAULT_PACKAGE_BASE_PRICE = 6000;
export const DEFAULT_PACKAGE_PLAYER_BLOCK_PRICE = 1000;

export interface PackagePrices {
  basePrice: number;
  playerBlockPrice: number;
}

export const DEFAULT_PACKAGE_PRICES: PackagePrices = {
  basePrice: DEFAULT_PACKAGE_BASE_PRICE,
  playerBlockPrice: DEFAULT_PACKAGE_PLAYER_BLOCK_PRICE,
};

export function getPackagePricingDefaultsByKey(): Record<string, number> {
  return {
    [PACKAGE_BASE_PRICE_KEY]: DEFAULT_PACKAGE_BASE_PRICE,
    [PACKAGE_PLAYER_BLOCK_PRICE_KEY]: DEFAULT_PACKAGE_PLAYER_BLOCK_PRICE,
  };
}

function normalizePlayerCount(playerCount: number): number {
  if (!Number.isFinite(playerCount) || playerCount <= 0) return 0;
  return Math.floor(playerCount);
}

/**
 * Number of paid blocks needed on top of the included allowance.
 * 150 -> 0, 151 -> 1, 200 -> 1, 201 -> 2.
 */
export function countExtraPlayerBlocks(playerCount: number): number {
  const players = normalizePlayerCount(playerCount);
  if (players <= PACKAGE_INCLUDED_PLAYERS) return 0;
  return Math.ceil((players - PACKAGE_INCLUDED_PLAYERS) / PACKAGE_PLAYER_BLOCK_SIZE);
}

/**
 * The allowance a given player count resolves to. This is what gets locked in
 * as the tournament's cap, so paying for 175 players allows up to 200.
 */
export function resolvePlayerLimit(playerCount: number): number {
  return PACKAGE_INCLUDED_PLAYERS + countExtraPlayerBlocks(playerCount) * PACKAGE_PLAYER_BLOCK_SIZE;
}

/** Total package price for a player count. */
export function calculatePackagePrice(playerCount: number, prices: PackagePrices = DEFAULT_PACKAGE_PRICES): number {
  return prices.basePrice + countExtraPlayerBlocks(playerCount) * prices.playerBlockPrice;
}

/**
 * Cost to raise an existing allowance to cover `targetPlayerCount`.
 * Only the additional blocks are charged; the base is never charged twice.
 * Returns 0 when the current limit already covers the target.
 */
export function calculateLimitIncreasePrice(
  currentPlayerLimit: number,
  targetPlayerCount: number,
  prices: PackagePrices = DEFAULT_PACKAGE_PRICES,
): number {
  const currentBlocks = countExtraPlayerBlocks(currentPlayerLimit);
  const targetBlocks = countExtraPlayerBlocks(targetPlayerCount);
  if (targetBlocks <= currentBlocks) return 0;
  return (targetBlocks - currentBlocks) * prices.playerBlockPrice;
}

/** Human-readable summary used in wallet descriptions and UI copy. */
export function describePackage(playerLimit: number): string {
  return `up to ${playerLimit} players, unlimited teams`;
}
