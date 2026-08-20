/**
 * POST /api/admin/wallet-credit
 * Admin-only: credit (add) balance to any user's wallet.
 *
 * Body: { userId: string; amount: number; note?: string }
 *
 * After crediting, an SMS is sent to the user if they have a verified
 * mobile number on their account. If no mobile number is set the credit
 * succeeds silently — no SMS is attempted.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { creditWalletBalance } from '@/lib/pg/wallet-queries';
import { getUserById } from '@/lib/pg/user-queries';
import { notifyUser } from '@/lib/notifications/store';
import type { PgUser } from '@/lib/pg/users-schema';
import { sendSMS } from '@prostream/shared/sms';
import { normalizeMobile, isValidE164 } from '@prostream/shared/phone';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    if (!isAdmin(payload.role)) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { userId, amount, note } = await request.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const parsed = Number(amount);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return NextResponse.json({ error: 'amount must be a positive integer' }, { status: 400 });
    }

    // Verify target user exists
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const description = note?.trim() || `Admin credit by ${payload.username ?? payload.userId}`;

    const result = await creditWalletBalance({
      userId,
      amount: parsed,
      description,
      createdBy: payload.userId,
    });

    // ── In-app notification (persistent inbox + push) ───────────────────────
    const noteSuffix = note?.trim() ? ` (${note.trim()})` : '';
    await notifyUser({
      userId,
      type: 'wallet_topup',
      title: 'Wallet credited',
      body: `Rs. ${parsed} added to your wallet${noteSuffix}. New balance: Rs. ${result.wallet.balance}.`,
      data: { amount: parsed, newBalance: result.wallet.balance },
    });

    // ── SMS notification ────────────────────────────────────────────────────
    // Only send if the user has a mobile number on their account.
    // getUserById returns a raw PgUser row — the column is `phone`, not `mobileNumber`
    // (mobileNumber only exists on the mapped AuctionUser DTO from toAuctionUser()).
    // A missing or empty phone is silently skipped — the credit still succeeds.
    // SMS errors are also swallowed so a gateway failure never blocks the admin.
    const rawPhone = (targetUser as PgUser).phone;
    if (rawPhone) {
      try {
        const phone = normalizeMobile(rawPhone);
        if (isValidE164(phone)) {
          const adminNote = note?.trim() ? `\nNote: ${note.trim()}` : '';
          await sendSMS(
            phone,
            `Hi ${targetUser.username}, your ProStream wallet has been credited with Rs. ${parsed}.${adminNote} New balance: Rs. ${result.wallet.balance}.`,
          );
        }
      } catch (smsErr) {
        // Non-fatal — log but do not fail the request
        console.warn('[admin/wallet-credit] SMS send failed:', smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      username: targetUser.username,
      credited: parsed,
      newBalance: result.wallet.balance,
      smsSent: !!(rawPhone),
    });
  } catch (err: any) {
    console.error('Admin wallet-credit error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}
