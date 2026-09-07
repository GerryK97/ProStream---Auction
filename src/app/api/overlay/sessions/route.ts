import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OverlaySessionModel } from '@/models/OverlaySession';
import { TournamentModel } from '@/models/Tournament';
import { canAccessTournament } from '@/lib/permissions';
import { getUserFromRequest, RequestUser } from '@/lib/request-helpers';
import {
  creditWalletBalance,
  deductWalletBalance,
  InsufficientWalletBalanceError,
} from '@/lib/pg/wallet-queries';
import {
  AUCTION_OVERLAY_TYPES,
  AuctionOverlayType,
  getAuctionOverlayConfig,
} from '@/lib/overlays/auctionOverlayTypes';
import {
  calculatePackagePrice,
  describePackage,
  resolvePlayerLimit,
} from '@/lib/overlays/auctionPackagePricing';
import { countTournamentPlayers, getEntitlement } from '@/lib/auctionPlayerCapacity';
import { getPackagePrices } from '@/lib/overlays/packagePriceSettings';

import { randomUUID } from 'crypto';
import { notifyUser } from '@/lib/notifications/store';
import { sendSMS } from '@/lib/textlk';
import { getUserById } from '@/lib/pg/user-queries';

/** Operator picks one of these; the rest of the package is always included. */
const FULLSCREEN_VARIANTS = ['fullscreen', 'fullscreen2'] as const;
export type FullscreenVariant = (typeof FULLSCREEN_VARIANTS)[number];

/** Always generated alongside the chosen variant, at no extra charge. */
const ALWAYS_INCLUDED_TYPES: AuctionOverlayType[] = ['custom', 'team_owners'];

function isFullscreenVariant(value: unknown): value is FullscreenVariant {
  return typeof value === 'string' && (FULLSCREEN_VARIANTS as readonly string[]).includes(value);
}

function canGenerateOverlays(_user: RequestUser) {
  // Tournament-specific access is enforced after reading tournamentId.
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

    const packagePrices = await getPackagePrices();

    // Quote the package for a specific tournament so the UI can show the exact
    // charge before the operator commits.
    let quote: {
      tournamentId: string;
      playerCount: number;
      playerLimit: number;
      price: number;
      alreadyPurchased: boolean;
    } | null = null;

    if (tournamentId) {
      const tournament = await TournamentModel.findById(tournamentId).lean();
      const entitlement = getEntitlement(tournament);
      const playerCount = await countTournamentPlayers(tournamentId);
      quote = {
        tournamentId,
        playerCount,
        playerLimit: entitlement?.playerLimit ?? resolvePlayerLimit(playerCount),
        price: entitlement ? 0 : calculatePackagePrice(playerCount, packagePrices),
        alreadyPurchased: Boolean(entitlement),
      };
    }

    return NextResponse.json({
      sessions,
      overlayTypes: AUCTION_OVERLAY_TYPES,
      packagePrices,
      alwaysIncludedTypes: ALWAYS_INCLUDED_TYPES,
      fullscreenVariants: FULLSCREEN_VARIANTS,
      quote,
    });
  } catch (error) {
    console.error('Error fetching overlay sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/overlay/sessions — buys the tournament's overlay package.
 *
 * One charge covers the whole tournament: the chosen full-screen variant plus
 * the Custom and Team Owners outputs. The price depends on the player count at
 * purchase time, and that count's block ceiling becomes the enforced player
 * limit. Re-generating for an already-purchased tournament is free.
 */
export async function POST(request: NextRequest) {
  let deduction: Awaited<ReturnType<typeof deductWalletBalance>> | null = null;
  let requestedTournamentName = 'Unknown tournament';
  let requestedUserId: string | null = null;
  let chargedUserId: string | null = null;

  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canGenerateOverlays(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    requestedUserId = user.userId;

    const body = await request.json();
    const {
      tournamentId,
      theme = 'standard',
      palette = 'default',
      billedUserId,
    } = body;
    // `overlayType` is the legacy field name; accept either for compatibility.
    const requestedVariant = body.overlayVariant ?? body.overlayType ?? 'fullscreen';

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing required field: tournamentId' }, { status: 400 });
    }
    if (!isFullscreenVariant(requestedVariant)) {
      return NextResponse.json({
        error: 'invalid_overlay_variant',
        message: 'Choose either the Full Screen or Full Screen 2 output.',
        validVariants: FULLSCREEN_VARIANTS,
      }, { status: 400 });
    }
    const overlayVariant: FullscreenVariant = requestedVariant;

    const isAdmin = user.role === 'Admin';
    const isBillingAnotherUser = isAdmin && Boolean(billedUserId);
    const chargeUserId = isBillingAnotherUser ? String(billedUserId) : user.userId;
    chargedUserId = chargeUserId;

    const resolvedTheme = typeof theme === 'string' && theme.trim() ? theme.trim() : 'standard';
    const resolvedPalette = typeof palette === 'string' && palette.trim() ? palette.trim() : 'default';

    const access = await assertTournamentAccess(user, tournamentId);
    if (access.response) return access.response;
    const tournament = access.tournament!;
    requestedTournamentName = (tournament as any).name;

    const existingEntitlement = getEntitlement(tournament);
    const packagePrices = await getPackagePrices();
    const playerCount = await countTournamentPlayers(tournamentId);

    // The package is bought once per tournament. Later generations reuse it,
    // so switching variant or refreshing links never charges twice.
    const playerLimit = existingEntitlement?.playerLimit ?? resolvePlayerLimit(playerCount);
    const packagePrice = existingEntitlement
      ? 0
      : (isAdmin && !isBillingAnotherUser ? 0 : calculatePackagePrice(playerCount, packagePrices));

    if (packagePrice > 0) {
      try {
        deduction = await deductWalletBalance({
          userId: chargeUserId,
          amount: packagePrice,
          description:
            `Auction package: ${requestedTournamentName} (${describePackage(playerLimit)})` +
            `${isBillingAnotherUser ? ' [admin]' : ''}`,
          createdBy: user.userId,
        });
      } catch (error) {
        if (error instanceof InsufficientWalletBalanceError) {
          return NextResponse.json(
            {
              error: 'insufficient_balance',
              message: 'Insufficient wallet balance',
              requiredAmount: error.requiredAmount,
              currentBalance: error.currentBalance,
              playerCount,
              playerLimit,
            },
            { status: 402 }
          );
        }
        throw error;
      }
    }

    // Persist the entitlement before creating sessions: this is what caps the
    // player count, and it must not be missed if session creation fails later.
    if (!existingEntitlement) {
      await TournamentModel.updateOne(
        { _id: tournamentId },
        {
          $set: {
            packageEntitlement: {
              playerLimit,
              pricePaid: packagePrice,
              overlayVariant,
              purchasedAt: new Date(),
              purchasedBy: user.userId,
              billedUserId: chargeUserId,
              playerCountAtPurchase: playerCount,
            },
          },
        },
      );
    }

    const timestamp = new Date().toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    // Replace any existing active sessions for these types so the tournament
    // ends up with exactly one live link per output.
    const typesToCreate: AuctionOverlayType[] = [overlayVariant, ...ALWAYS_INCLUDED_TYPES];
    await OverlaySessionModel.updateMany(
      { tournamentId, overlayType: { $in: typesToCreate }, isActive: true },
      { $set: { isActive: false, revokedAt: new Date() } },
    );

    const sessions = [];
    for (const overlayType of typesToCreate) {
      const config = getAuctionOverlayConfig(overlayType);
      const session = await OverlaySessionModel.create({
        _id: randomUUID(),
        tournamentId,
        label: `${requestedTournamentName} · ${config.label} · ${timestamp}`,
        createdBy: user.userId,
        overlayType,
        theme: resolvedTheme,
        palette: resolvedPalette,
        // The package is charged once, recorded against the chosen variant so
        // wallet totals stay reconcilable against a single session.
        paymentStatus: packagePrice > 0 && overlayType === overlayVariant ? 'paid' : 'free',
        walletTransactionId: overlayType === overlayVariant ? deduction?.transaction.id ?? null : null,
        priceCharged: overlayType === overlayVariant ? packagePrice : 0,
        isActive: true,
      });
      sessions.push(session);
    }

    if (isBillingAnotherUser && packagePrice > 0) {
      (async () => {
        try {
          const billedUser = await getUserById(chargeUserId);
          const msg = `${packagePrice.toLocaleString()} credits deducted from your ProStream wallet for the auction package: ${requestedTournamentName} (${describePackage(playerLimit)}). New balance: ${deduction?.transaction.balanceAfter?.toLocaleString() ?? 'N/A'}`;

          await notifyUser({
            userId: chargeUserId,
            type: 'wallet_deduction',
            title: 'Wallet Deduction',
            body: msg,
            data: { amount: packagePrice, tournamentName: requestedTournamentName, playerLimit },
          });

          if (billedUser?.phone) {
            await sendSMS(billedUser.phone, msg).catch((err) => {
              console.warn('[Overlay SMS] Failed to send:', err);
            });
          }
        } catch (err) {
          console.warn('[Overlay billing notify]', err);
        }
      })();
    }

    return NextResponse.json({
      sessions,
      walletTransaction: deduction?.transaction ?? null,
      priceCharged: packagePrice,
      overlayVariant,
      playerLimit,
      playerCount,
      alreadyPurchased: Boolean(existingEntitlement),
    }, { status: 201 });
  } catch (error) {
    if (deduction && chargedUserId) {
      try {
        const refund = await creditWalletBalance({
          userId: chargedUserId,
          amount: Math.abs(deduction.transaction.amount),
          description: `Refund failed auction package purchase: ${requestedTournamentName}`,
          createdBy: requestedUserId || chargedUserId,
        });
        console.error('Package purchase failed after deduction. Refund issued:', refund.transaction.id, error);
      } catch (refundError) {
        console.error('CRITICAL: Package purchase failed after deduction and refund failed:', refundError, error);
      }
    }

    console.error('Error creating overlay sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
