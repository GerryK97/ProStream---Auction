import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/permissions';
import { getUserFromRequest } from '@/lib/request-helpers';
import { getPricesWithFallbacks, upsertPrices } from '@/lib/pg/wallet-queries';
import {
  getOverlayPriceMetadata,
  getOverlayPricingDefaultsByKey,
} from '@/lib/overlays/overlayPricing';

function buildResponse(pricesByKey: Record<string, number>) {
  const prices = getOverlayPriceMetadata().map(item => ({
    ...item,
    value: pricesByKey[item.key] ?? item.defaultValue,
  }));

  return { prices };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const pricesByKey = await getPricesWithFallbacks(getOverlayPricingDefaultsByKey());
    return NextResponse.json(buildResponse(pricesByKey));
  } catch (error) {
    console.error('[admin/overlay-prices GET]', error);
    return NextResponse.json({ error: 'Failed to fetch overlay prices' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(user.role)) return NextResponse.json({ error: 'Only Admin users can manage overlay prices.' }, { status: 403 });

    const body = await request.json();
    const allowedKeys = new Set<string>(getOverlayPriceMetadata().map(item => item.key));
    const rawPrices = body?.prices;

    if (!rawPrices || typeof rawPrices !== 'object' || Array.isArray(rawPrices)) {
      return NextResponse.json({ error: 'prices object is required' }, { status: 400 });
    }

    const updates: Record<string, number> = {};
    for (const [key, rawValue] of Object.entries(rawPrices)) {
      if (!allowedKeys.has(key)) {
        return NextResponse.json({ error: `Unsupported overlay pricing key: ${key}` }, { status: 400 });
      }

      const value = Number(rawValue);
      if (!Number.isInteger(value) || value < 0) {
        return NextResponse.json({ error: `Price for ${key} must be a non-negative integer.` }, { status: 400 });
      }

      updates[key] = value;
    }

    await upsertPrices(updates);
    const pricesByKey = await getPricesWithFallbacks(getOverlayPricingDefaultsByKey());
    return NextResponse.json(buildResponse(pricesByKey));
  } catch (error) {
    console.error('[admin/overlay-prices PUT]', error);
    return NextResponse.json({ error: 'Failed to update overlay prices' }, { status: 500 });
  }
}
