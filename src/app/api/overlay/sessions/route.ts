import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OverlaySessionModel } from '@/models/OverlaySession';
import { TournamentModel } from '@/models/Tournament';
import { canAccessTournament } from '@/lib/permissions';
import { getUserFromRequest, RequestUser } from '@/lib/request-helpers';
import {
  creditWalletBalance,
  deductWalletBalance,
  getPrice,
  getPricesWithFallbacks,
  InsufficientWalletBalanceError,
} from '@/lib/pg/wallet-queries';
import {
  AUCTION_OVERLAY_TYPES,
  AUCTION_OVERLAY_TYPE_KEYS,
  AuctionOverlayType,
  getAuctionOverlayConfig,
  isAuctionOverlayType,
} from '@/lib/overlays/auctionOverlayTypes';
import { DEFAULT_OVERLAY_PRICES, getOverlayPricingDefaultsByKey } from '@/lib/overlays/overlayPricing';

import { randomUUID } from 'crypto';

function canGenerateOverlays(_user: RequestUser) {
  // Tournament-specific access is enforced after reading tournamentId.
  // Assigned users may generate overlay outputs for tournaments they can access.
  return true;
}

async function assertTournamentAccess(user: RequestUser, tournamentId: string) {
  const tournament = await TournamentModel.findById(tournamentId).lean();
  if (!tournament) return { tournament: null, response: NextResponse.json({ error: 'Tournament not found' }, { status: 404 }) };

  if (!canAccessTournament(user.userId, user.role, tournament as any, user.assignedTournaments)) {
    return { tournament: null, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { tournament, response: null };
}

const PRICE_CACHE_TTL_MS = 5 * 60_000;
let priceCache: { expiresAt: number; prices: Record<AuctionOverlayType, number> } | null = null;

async function getOverlayPriceMap() {
  const now = Date.now();
  if (priceCache && priceCache.expiresAt > now) return priceCache.prices;

  const pricesByKey = await getPricesWithFallbacks(getOverlayPricingDefaultsByKey());
  const prices = Object.fromEntries(
    AUCTION_OVERLAY_TYPE_KEYS.map((type) => {
      const config = getAuctionOverlayConfig(type);
      return [type, pricesByKey[config.pricingKey] ?? DEFAULT_OVERLAY_PRICES[type]] as const;
    })
  ) as Record<AuctionOverlayType, number>;

  priceCache = { prices, expiresAt: now + PRICE_CACHE_TTL_MS };
  return prices;
}

// GET /api/overlay/sessions?tournamentId=xxx — list sessions for accessible tournaments
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tournamentId = request.nextUrl.searchParams.get('tournamentId');
    let query: Record<string, unknown> = {};

    if (tournamentId) {
      const access = await assertTournamentAccess(user, tournamentId);
      if (access.response) return access.response;
      query = { tournamentId };
    } else if (user.role !== 'Admin') {
      query = { tournamentId: { $in: user.assignedTournaments } };
    }

    const sessions = await OverlaySessionModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const prices = await getOverlayPriceMap();

    return NextResponse.json({ sessions, overlayTypes: AUCTION_OVERLAY_TYPES, prices });
  } catch (error) {
    console.error('Error fetching overlay sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/overlay/sessions — creates exactly one overlay output and charges once at creation time
export async function POST(request: NextRequest) {
  let deduction:
    | Awaited<ReturnType<typeof deductWalletBalance>>
    | null = null;
  let requestedOverlayType: AuctionOverlayType = 'fullscreen';
  let requestedTournamentName = 'Unknown tournament';
  let requestedUserId: string | null = null;
  let chargedUserId: string | null = null;

  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canGenerateOverlays(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    requestedUserId = user.userId;

    const { tournamentId, overlayType = 'fullscreen', theme = 'standard', palette = 'default', billedUserId } = await request.json();
    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing required field: tournamentId' }, { status: 400 });
    }
    if (!isAuctionOverlayType(overlayType)) {
      return NextResponse.json({
        error: 'invalid_overlay_type',
        message: 'Invalid overlay type',
        validOverlayTypes: AUCTION_OVERLAY_TYPE_KEYS,
      }, { status: 400 });
    }
    requestedOverlayType = overlayType;

    // Admin can bill another user's wallet
    const chargeUserId = user.role === 'Admin' && billedUserId ? String(billedUserId) : user.userId;
    chargedUserId = chargeUserId;

    // Validate theme — must be a non-empty string, but we store whatever the client
    // sends and let the overlay fall back to 'standard' if unknown. Sanitise to string.
    const resolvedTheme = typeof theme === 'string' && theme.trim() ? theme.trim() : 'standard';
    const resolvedPalette = typeof palette === 'string' && palette.trim() ? palette.trim() : 'default';

    const access = await assertTournamentAccess(user, tournamentId);
    if (access.response) return access.response;
    const tournament = access.tournament!;
    requestedTournamentName = (tournament as any).name;

    const overlayConfig = getAuctionOverlayConfig(overlayType);
    const overlayPrice = await getPrice(overlayConfig.pricingKey, DEFAULT_OVERLAY_PRICES[overlayType]);

    if (overlayPrice > 0) {
      try {
        deduction = await deductWalletBalance({
          userId: chargeUserId,
          amount: overlayPrice,
          description: `${overlayConfig.label}: ${requestedTournamentName}${billedUserId ? ' [admin]' : ''}`,
          createdBy: user.userId,
        });
      } catch (error) {
        if (error instanceof InsufficientWalletBalanceError) {
          return NextResponse.json(
            {
              error: 'insufficient_balance',
              message: 'Insufficient wallet balance',
              overlayType,
              requiredAmount: error.requiredAmount,
              currentBalance: error.currentBalance,
            },
            { status: 402 }
          );
        }
        throw error;
      }
    }

    const label = `${requestedTournamentName} · ${overlayConfig.label} · ${new Date().toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })}`;

    const sessionToken = randomUUID();
    const session = await OverlaySessionModel.create({
      _id: sessionToken,
      tournamentId,
      label,
      createdBy: user.userId,
      overlayType,
      theme: resolvedTheme,
      palette: resolvedPalette,
      paymentStatus: overlayPrice > 0 ? 'paid' : 'free',
      walletTransactionId: deduction?.transaction.id ?? null,
      priceCharged: overlayPrice,
      isActive: true,
    });

    return NextResponse.json({
      session,
      walletTransaction: deduction?.transaction ?? null,
      priceCharged: overlayPrice,
      overlayType,
    }, { status: 201 });
  } catch (error) {
    if (deduction && chargedUserId) {
      try {
        const refund = await creditWalletBalance({
          userId: chargedUserId,
          amount: Math.abs(deduction.transaction.amount),
          description: `Refund failed overlay generation: ${getAuctionOverlayConfig(requestedOverlayType).label} · ${requestedTournamentName}`,
          createdBy: requestedUserId || chargedUserId,
        });
        console.error('Overlay session creation failed after deduction. Refund issued:', refund.transaction.id, error);
      } catch (refundError) {
        console.error('CRITICAL: Overlay session creation failed after deduction and refund failed:', refundError, error);
      }
    }

    console.error('Error creating overlay session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
