import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/permissions';
import { getUserFromRequest } from '@/lib/request-helpers';
import { getPricesWithFallbacks, upsertPrices } from '@/lib/pg/wallet-queries';
import {
  DEFAULT_PACKAGE_BASE_PRICE,
  DEFAULT_PACKAGE_PLAYER_BLOCK_PRICE,
  PACKAGE_BASE_PRICE_KEY,
  PACKAGE_INCLUDED_PLAYERS,
  PACKAGE_PLAYER_BLOCK_PRICE_KEY,
  PACKAGE_PLAYER_BLOCK_SIZE,
  calculatePackagePrice,
  getPackagePricingDefaultsByKey,
} from '@/lib/overlays/auctionPackagePricing';
import { invalidatePackagePriceCache } from '@/lib/overlays/packagePriceSettings';

function buildResponse(pricesByKey: Record<string, number>) {
  const basePrice = pricesByKey[PACKAGE_BASE_PRICE_KEY] ?? DEFAULT_PACKAGE_BASE_PRICE;
  const playerBlockPrice = pricesByKey[PACKAGE_PLAYER_BLOCK_PRICE_KEY] ?? DEFAULT_PACKAGE_PLAYER_BLOCK_PRICE;
  const prices = { basePrice, playerBlockPrice };

  return {
    prices,
    fields: [
      {
        key: PACKAGE_BASE_PRICE_KEY,
        label: 'Base package',
        description: `Covers up to ${PACKAGE_INCLUDED_PLAYERS} players and unlimited teams. Includes the chosen full-screen output plus Custom and Team Owners.`,
        defaultValue: DEFAULT_PACKAGE_BASE_PRICE,
        value: basePrice,
      },
      {
        key: PACKAGE_PLAYER_BLOCK_PRICE_KEY,
        label: `Each extra ${PACKAGE_PLAYER_BLOCK_SIZE} players`,
        description: `Charged per block of ${PACKAGE_PLAYER_BLOCK_SIZE} players beyond the first ${PACKAGE_INCLUDED_PLAYERS}. A partial block costs a full block.`,
        defaultValue: DEFAULT_PACKAGE_PLAYER_BLOCK_PRICE,
        value: playerBlockPrice,
      },
    ],
    // Worked examples so the effect of a price change is obvious before saving.
    examples: [100, 150, 175, 200, 201, 250].map(players => ({
      players,
      price: calculatePackagePrice(players, prices),
    })),
    includedPlayers: PACKAGE_INCLUDED_PLAYERS,
    playerBlockSize: PACKAGE_PLAYER_BLOCK_SIZE,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const pricesByKey = await getPricesWithFallbacks(getPackagePricingDefaultsByKey());
    return NextResponse.json(buildResponse(pricesByKey));
  } catch (error) {
    console.error('[admin/overlay-prices GET]', error);
    return NextResponse.json({ error: 'Failed to fetch package prices' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(user.role)) return NextResponse.json({ error: 'Only Admin users can manage package prices.' }, { status: 403 });

    const body = await request.json();
    const allowedKeys = new Set([PACKAGE_BASE_PRICE_KEY, PACKAGE_PLAYER_BLOCK_PRICE_KEY]);
    const rawPrices = body?.prices;

    if (!rawPrices || typeof rawPrices !== 'object' || Array.isArray(rawPrices)) {
      return NextResponse.json({ error: 'prices object is required' }, { status: 400 });
    }

    const updates: Record<string, number> = {};
    for (const [key, rawValue] of Object.entries(rawPrices)) {
      if (!allowedKeys.has(key)) {
        return NextResponse.json({ error: `Unsupported pricing key: ${key}` }, { status: 400 });
      }

      const value = Number(rawValue);
      if (!Number.isInteger(value) || value < 0) {
        return NextResponse.json({ error: `Price for ${key} must be a non-negative integer.` }, { status: 400 });
      }

      updates[key] = value;
    }

    await upsertPrices(updates);
    // Without this, a saved change would not take effect for up to 5 minutes.
    invalidatePackagePriceCache();

    const pricesByKey = await getPricesWithFallbacks(getPackagePricingDefaultsByKey());
    return NextResponse.json(buildResponse(pricesByKey));
  } catch (error) {
    console.error('[admin/overlay-prices PUT]', error);
    return NextResponse.json({ error: 'Failed to update package prices' }, { status: 500 });
  }
}
