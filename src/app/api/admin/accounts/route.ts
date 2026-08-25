/**
 * GET /api/admin/accounts
 * Capability-gated (Admin OR canRechargeWallet): the Accounts ledger — a
 * read-only aggregation over the immutable wallet_transactions log. Returns the
 * WHOLE ledger (every recharge by everyone) with attribution, plus totals and
 * per-recharger breakdown.
 *
 * Query params (all optional, convenience filters — NOT access restrictions):
 *   createdBy  — restrict to one recharger's transactions
 *   from, to   — ISO date range on created_at
 *   limit      — max rows returned (default 500)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { canRechargeWallet } from '@/lib/permissions';
import { getUserById } from '@/lib/pg/user-queries';
import { getAccountsLedger } from '@/lib/pg/wallet-queries';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const caller = await getUserById(payload.userId);
    if (!caller) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!canRechargeWallet(caller)) {
      return NextResponse.json(
        { error: 'Forbidden — accounts access required' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const createdBy = searchParams.get('createdBy');
    const fromRaw = searchParams.get('from');
    const toRaw = searchParams.get('to');
    const limitRaw = searchParams.get('limit');

    const from = fromRaw ? new Date(fromRaw) : null;
    const to = toRaw ? new Date(toRaw) : null;
    if (from && Number.isNaN(from.getTime())) {
      return NextResponse.json({ error: 'Invalid "from" date' }, { status: 400 });
    }
    if (to && Number.isNaN(to.getTime())) {
      return NextResponse.json({ error: 'Invalid "to" date' }, { status: 400 });
    }
    const limit = limitRaw ? Math.min(Math.max(1, Number(limitRaw) || 500), 2000) : 500;

    const ledger = await getAccountsLedger({ createdBy, from, to, limit });
    return NextResponse.json({ success: true, ...ledger });
  } catch (err: any) {
    console.error('Accounts ledger error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}
