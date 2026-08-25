/**
 * POST /api/admin/users/[id]/wallet-access
 * Admin-only: grant or revoke a user's `canRechargeWallet` capability.
 *
 * Body: { canRechargeWallet: boolean }
 *
 * Because the capability is checked per request against the DB (not the JWT),
 * a grant or revoke takes effect immediately — no re-login required.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { getUserById, setWalletRechargeAccess, toPublicUser } from '@/lib/pg/user-queries';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    if (!isAdmin(payload.role)) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const canRecharge = body?.canRechargeWallet;
    if (typeof canRecharge !== 'boolean') {
      return NextResponse.json(
        { error: 'canRechargeWallet (boolean) is required' },
        { status: 400 },
      );
    }

    const target = await getUserById(id);
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updated = await setWalletRechargeAccess(id, canRecharge);
    if (!updated) return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });

    return NextResponse.json({ success: true, user: toPublicUser(updated) });
  } catch (err: any) {
    console.error('Wallet-access toggle error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}
