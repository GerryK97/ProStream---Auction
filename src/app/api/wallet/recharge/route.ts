/**
 * POST /api/wallet/recharge
 * Capability-gated: a user with `canRechargeWallet` (or an Admin) records a
 * PAID recharge — cash collected from a customer — for ANY user's wallet.
 *
 * Body: { userId: string; amount: number; note?: string }
 *
 * Every recharge is attributed to the caller via `createdBy` and categorised
 * `paid_recharge` (revenue). Free/promo credit is a separate Admin-only route
 * (`/api/admin/wallet-credit`). Mirrors the SMS + in-app notification behaviour
 * of wallet-credit.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { canRechargeWallet } from '@/lib/permissions';
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

    // Capability is DB-backed (JWT can't carry it), so load the fresh caller row.
    const caller = await getUserById(payload.userId);
    if (!caller) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!canRechargeWallet(caller)) {
      return NextResponse.json(
        { error: 'Forbidden — wallet recharge access required' },
        { status: 403 },
      );
    }

    const { userId, amount, note } = await request.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const parsed = Number(amount);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return NextResponse.json({ error: 'amount must be a positive integer' }, { status: 400 });
    }

    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rechargerName = caller.displayName || caller.username;
    const description = note?.trim()
      ? `Paid recharge by ${rechargerName} (${note.trim()})`
      : `Paid recharge by ${rechargerName}`;

    const result = await creditWalletBalance({
      userId,
      amount: parsed,
      description,
      createdBy: payload.userId,
      category: 'paid_recharge',
    });

    // ── In-app notification (persistent inbox + push) ───────────────────────
    const noteSuffix = note?.trim() ? ` (${note.trim()})` : '';
    await notifyUser({
      userId,
      type: 'wallet_topup',
      title: 'Wallet recharged',
      body: `Rs. ${parsed} added to your wallet${noteSuffix}. New balance: Rs. ${result.wallet.balance}.`,
      data: { amount: parsed, newBalance: result.wallet.balance },
    });

    // ── SMS notification (best-effort, non-fatal) ───────────────────────────
    const rawPhone = (targetUser as PgUser).phone;
    if (rawPhone) {
      try {
        const phone = normalizeMobile(rawPhone);
        if (isValidE164(phone)) {
          const smsNote = note?.trim() ? `\nNote: ${note.trim()}` : '';
          await sendSMS(
            phone,
            `Hi ${targetUser.username}, your ProStream wallet has been recharged with Rs. ${parsed}.${smsNote} New balance: Rs. ${result.wallet.balance}.`,
          );
        }
      } catch (smsErr) {
        console.warn('[wallet/recharge] SMS send failed:', smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      username: targetUser.username,
      credited: parsed,
      newBalance: result.wallet.balance,
      rechargedBy: rechargerName,
      smsSent: !!rawPhone,
    });
  } catch (err: any) {
    console.error('Wallet recharge error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}
