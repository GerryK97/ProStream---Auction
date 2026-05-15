import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { deleteUser, getUserById, listUsers, setUserStatus, toPublicUser } from '@/lib/pg/user-queries';

async function requireAdmin(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const payload = verifyToken(token);
  if (!payload) return { ok: false as const, response: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) };
  if (!isAdmin(payload.role)) return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { ok: true as const, payload };
}

/**
 * POST /api/users/approve - Approve pending user registration (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { userId, approve = true } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.status !== 'PendingApproval') {
      return NextResponse.json(
        { error: 'User is not pending approval' },
        { status: 400 }
      );
    }

    if (approve) {
      const updated = await setUserStatus(userId, 'Active');

      return NextResponse.json(
        {
          success: true,
          message: 'User approved successfully',
          user: updated ? toPublicUser(updated) : null,
        },
        { status: 200 }
      );
    }

    await deleteUser(userId);

    return NextResponse.json(
      {
        success: true,
        message: 'User rejected and deleted',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Approve user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/approve - Get pending users (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { rows } = await listUsers({ status: 'PendingApproval', page: 1, limit: 500 });

    return NextResponse.json(
      {
        success: true,
        data: rows.map(toPublicUser),
        count: rows.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get pending users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}