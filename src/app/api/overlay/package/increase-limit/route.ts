import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { canAccessTournament } from '@/lib/permissions';
import { getUserFromRequest } from '@/lib/request-helpers';
import {
  creditWalletBalance,
  deductWalletBalance,
  InsufficientWalletBalanceError,
} from '@/lib/pg/wallet-queries';
import {
  PACKAGE_PLAYER_BLOCK_SIZE,
  calculateLimitIncreasePrice,
  describePackage,
} from '@/lib/overlays/auctionPackagePricing';
import { countTournamentPlayers, getEntitlement } from '@/lib/auctionPlayerCapacity';
import { getPackagePrices } from '@/lib/overlays/packagePriceSettings';

/**
 * POST /api/overlay/package/increase-limit
 *
 * Raises a purchased tournament's player allowance. Only the additional blocks
 * are charged; the base package is never charged twice.
 *
 * Body: { tournamentId, targetPlayerCount, billedUserId? }
 */
export async function POST(request: NextRequest) {
  let deduction: Awaited<ReturnType<typeof deductWalletBalance>> | null = null;
  let chargedUserId: string | null = null;
  let tournamentName = 'Unknown tournament';

  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tournamentId, targetPlayerCount, billedUserId } = await request.json();
    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing required field: tournamentId' }, { status: 400 });
    }

    const target = Number(targetPlayerCount);
    if (!Number.isFinite(target) || target <= 0) {
      return NextResponse.json({ error: 'targetPlayerCount must be a positive number' }, { status: 400 });
    }

    const tournament = await TournamentModel.findById(tournamentId).lean();
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    if (!canAccessTournament(user.userId, user.role, tournament as any, user.assignedTournaments)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    tournamentName = (tournament as any).name;

    const entitlement = getEntitlement(tournament);
    if (!entitlement) {
      return NextResponse.json({
        error: 'package_not_purchased',
        message: 'Generate the overlay package for this tournament first. The player limit applies only after purchase.',
      }, { status: 409 });
    }

    const prices = await getPackagePrices();
    const upgradePrice = calculateLimitIncreasePrice(entitlement.playerLimit, target, prices);

    if (upgradePrice <= 0) {
      return NextResponse.json({
        message: 'The current player limit already covers that many players.',
        playerLimit: entitlement.playerLimit,
        priceCharged: 0,
      });
    }

    const newPlayerLimit = entitlement.playerLimit
      + Math.ceil((target - entitlement.playerLimit) / PACKAGE_PLAYER_BLOCK_SIZE) * PACKAGE_PLAYER_BLOCK_SIZE;

    const isAdmin = user.role === 'Admin';
    const isBillingAnotherUser = isAdmin && Boolean(billedUserId);
    // Bill whoever paid originally unless an admin redirects the charge, so a
    // top-up cannot silently land on a different operator's wallet.
    const chargeUserId = isBillingAnotherUser
      ? String(billedUserId)
      : (isAdmin ? entitlement.billedUserId : user.userId);
    chargedUserId = chargeUserId;

    const chargeAmount = upgradePrice;

    if (chargeAmount > 0) {
      try {
        deduction = await deductWalletBalance({
          userId: chargeUserId,
          amount: chargeAmount,
          description: `Auction package player limit increase: ${tournamentName} (${describePackage(newPlayerLimit)})`,
          createdBy: user.userId,
        });
      } catch (error) {
        if (error instanceof InsufficientWalletBalanceError) {
          return NextResponse.json({
            error: 'insufficient_balance',
            message: 'Insufficient wallet balance',
            requiredAmount: error.requiredAmount,
            currentBalance: error.currentBalance,
          }, { status: 402 });
        }
        throw error;
      }
    }

    // Guard against a concurrent increase racing this one: only apply if the
    // limit is still what the price was calculated against.
    const updated = await TournamentModel.updateOne(
      { _id: tournamentId, 'packageEntitlement.playerLimit': entitlement.playerLimit },
      {
        $set: {
          'packageEntitlement.playerLimit': newPlayerLimit,
          'packageEntitlement.pricePaid': entitlement.pricePaid + chargeAmount,
        },
      },
    );

    if (updated.matchedCount === 0) {
      throw new Error('Player limit changed concurrently; increase not applied');
    }

    const currentPlayers = await countTournamentPlayers(tournamentId);

    return NextResponse.json({
      playerLimit: newPlayerLimit,
      previousPlayerLimit: entitlement.playerLimit,
      priceCharged: chargeAmount,
      currentPlayers,
      walletTransaction: deduction?.transaction ?? null,
    });
  } catch (error) {
    if (deduction && chargedUserId) {
      try {
        await creditWalletBalance({
          userId: chargedUserId,
          amount: Math.abs(deduction.transaction.amount),
          description: `Refund failed player limit increase: ${tournamentName}`,
          createdBy: chargedUserId,
        });
      } catch (refundError) {
        console.error('CRITICAL: limit increase failed after deduction and refund failed:', refundError, error);
      }
    }
    console.error('[overlay/package/increase-limit]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
