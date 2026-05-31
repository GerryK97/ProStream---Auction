import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OverlaySessionModel } from '@/models/OverlaySession';
import { TournamentModel } from '@/models/Tournament';
import { canAccessTournament, canPerformAction } from '@/lib/permissions';
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

function canGenerateOverlays(user: RequestUser) {
  return canPerformAction(user.role, 'create', 'overlayConfig');
}

async function assertTournamentAccess(user: RequestUser, tournamentId: string) {
  const tournament = await TournamentModel.findById(tournamentId).lean();
  if (!tournament) return { tournament: null, response: NextResponse.json({ error: 'Tournament not found' }, { status: 404 }) };

  if (!canAccessTournament(user.userId, user.role, tournament as any, user.assignedTournaments)) {
    return { tournament: null, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { tournament, response: null };
}

async function getOverlayPriceMap() {
  const pricesByKey = await getPricesWithFallbacks(getOverlayPricingDefaultsByKey());
  return Object.fromEntries(
    AUCTION_OVERLAY_TYPE_KEYS.map((type) => {
      const config = getAuctionOverlayConfig(type);
      return [type, pricesByKey[config.pricingKey] ?? DEFAULT_OVERLAY_PRICES[type]] as const;
    })
  ) as Record<AuctionOverlayType, number>;
}

// GET /api/overlay/sessions?tournamentId=xxx — list sessions (admin only)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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

  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canGenerateOverlays(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    requestedUserId = user.userId;

    const { tournamentId, overlayType = 'fullscreen' } = await request.json();
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

    const access = await assertTournamentAccess(user, tournamentId);
    if (access.response) return access.response;
    const tournament = access.tournament!;
    requestedTournamentName = (tournament as any).name;

    const overlayConfig = getAuctionOverlayConfig(overlayType);
    const overlayPrice = await getPrice(overlayConfig.pricingKey, DEFAULT_OVERLAY_PRICES[overlayType]);

    if (overlayPrice > 0) {
      try {
        deduction = await deductWalletBalance({
          userId: user.userId,
          amount: overlayPrice,
          description: `${overlayConfig.label}: ${requestedTournamentName}`,
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
    if (deduction && requestedUserId) {
      try {
        const refund = await creditWalletBalance({
          userId: requestedUserId,
          amount: Math.abs(deduction.transaction.amount),
          description: `Refund failed overlay generation: ${getAuctionOverlayConfig(requestedOverlayType).label} · ${requestedTournamentName}`,
          createdBy: requestedUserId,
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
