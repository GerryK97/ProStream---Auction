import { getPricesWithFallbacks } from '@/lib/pg/wallet-queries';
import {
  DEFAULT_PACKAGE_PRICES,
  PACKAGE_BASE_PRICE_KEY,
  PACKAGE_PLAYER_BLOCK_PRICE_KEY,
  getPackagePricingDefaultsByKey,
  type PackagePrices,
} from '@/lib/overlays/auctionPackagePricing';

const PRICE_CACHE_TTL_MS = 5 * 60_000;
let priceCache: { expiresAt: number; prices: PackagePrices } | null = null;

/**
 * Admin-configured package prices, cached briefly. Shared by every route that
 * quotes or charges, so a price change takes effect consistently everywhere.
 */
export async function getPackagePrices(): Promise<PackagePrices> {
  const now = Date.now();
  if (priceCache && priceCache.expiresAt > now) return priceCache.prices;

  const byKey = await getPricesWithFallbacks(getPackagePricingDefaultsByKey());
  const prices: PackagePrices = {
    basePrice: byKey[PACKAGE_BASE_PRICE_KEY] ?? DEFAULT_PACKAGE_PRICES.basePrice,
    playerBlockPrice: byKey[PACKAGE_PLAYER_BLOCK_PRICE_KEY] ?? DEFAULT_PACKAGE_PRICES.playerBlockPrice,
  };

  priceCache = { prices, expiresAt: now + PRICE_CACHE_TTL_MS };
  return prices;
}

/** Clears the cache so an admin price change is visible immediately. */
export function invalidatePackagePriceCache() {
  priceCache = null;
}
