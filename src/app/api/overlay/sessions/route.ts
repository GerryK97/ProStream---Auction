import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OverlaySessionModel } from '@/models/OverlaySession';
import { TournamentModel } from '@/models/Tournament';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import {
  creditWalletBalance,
  deductWalletBalance,
  getPrice,
  InsufficientWalletBalanceError,
} from '@/lib/pg/wallet-queries';
import {
  AUCTION_OVERLAY_TYPES,
  AUCTION_OVERLAY_TYPE_KEYS,
  AuctionOverlayType,
  getAuctionOverlayConfig,
  isAuctionOverlayType,
} from '@/lib/overlays/auctionOverlayTypes';
import { randomUUID } from 'crypto';

const DEFAULT_OVERLAY_PRICES: Record<AuctionOverlayType, number> = {
  custom: 500,
  fullscreen: 1000,
  fullscreen2: 1000,
  team_owners: 300,
};

async function getOverlayPriceMap() {
  const entries = await Promise.all(
    AUCTION_OVERLAY_TYPE_KEYS.map(async (type) => {
      const config = getAuctionOverlayConfig(type);
      const price = await getPrice(config.pricingKey, DEFAULT_OVERLAY_PRICES[type]);
      return [type, price] as const;
    })
  );
  return Object.fromEntries(entries) as Record<AuctionOverlayType, number>;
}

// GET /api/overlay/sessions?tournamentId=xxx — list sessions (Admin only)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    if (!isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const tournamentId = request.nextUrl.searchParams.get('tournamentId');

    const query = tournamentId ? { tournamentId } : {};
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

// POST /api/overlay/sessions — create a new paid/free overlay session (Admin only)
export async function POST(request: NextRequest) {
  let deduction:
    | Awaited<ReturnType<typeof deductWalletBalance>>
    | null = null;
  let requestedOverlayType: AuctionOverlayType = 'fullscreen';
  let requestedTournamentName = 'Unknown tournament';
  let requestedUserId: string | null = null;

  try {
    await connectToDatabase();

    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    if (!isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    requestedUserId = payload.userId;

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

    const tournament = await TournamentModel.findById(tournamentId).lean();
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    requestedTournamentName = (tournament as any).name;

    const overlayConfig = getAuctionOverlayConfig(overlayType);
    const overlayPrice = await getPrice(overlayConfig.pricingKey, DEFAULT_OVERLAY_PRICES[overlayType]);

    if (overlayPrice > 0) {
      try {
        deduction = await deductWalletBalance({
          userId: payload.userId,
          amount: overlayPrice,
          description: `${overlayConfig.label}: ${requestedTournamentName}`,
          createdBy: payload.userId,
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
      createdBy: payload.userId,
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
