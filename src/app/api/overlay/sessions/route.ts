import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OverlaySessionModel } from '@/models/OverlaySession';
import { TournamentModel } from '@/models/Tournament';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import {
  AUCTION_OVERLAY_CREATE_PRICE_KEY,
  deductWalletBalance,
  getPrice,
  InsufficientWalletBalanceError,
} from '@/lib/pg/wallet-queries';
import { randomUUID } from 'crypto';

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

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching overlay sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/overlay/sessions — create a new session (Admin only)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    if (!isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { tournamentId } = await request.json();
    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing required field: tournamentId' }, { status: 400 });
    }

    const tournament = await TournamentModel.findById(tournamentId).lean();
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    const label = `${(tournament as any).name} · ${new Date().toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })}`;

    const overlayPrice = await getPrice(AUCTION_OVERLAY_CREATE_PRICE_KEY, 0);
    let walletTransaction = null;
    if (overlayPrice > 0) {
      try {
        const deduction = await deductWalletBalance({
          userId: payload.userId,
          amount: overlayPrice,
          description: `Auction overlay session: ${(tournament as any).name}`,
          createdBy: payload.userId,
        });
        walletTransaction = deduction.transaction;
      } catch (error) {
        if (error instanceof InsufficientWalletBalanceError) {
          return NextResponse.json(
            {
              error: 'insufficient_balance',
              message: 'Insufficient wallet balance',
              requiredAmount: error.requiredAmount,
              currentBalance: error.currentBalance,
            },
            { status: 402 }
          );
        }
        throw error;
      }
    }

    const sessionToken = randomUUID();
    const session = await OverlaySessionModel.create({
      _id: sessionToken,
      tournamentId,
      label,
      createdBy: payload.userId,
      isActive: true,
    });

    return NextResponse.json({ session, walletTransaction }, { status: 201 });
  } catch (error) {
    console.error('Error creating overlay session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
