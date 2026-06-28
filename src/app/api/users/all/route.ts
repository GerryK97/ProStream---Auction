import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { listUsers, toPublicUser } from '@/lib/pg/user-queries';

export const runtime = 'nodejs';

// GET /api/users/all — returns all users as a plain array (admin only)
// Used by the Expo mobile app's Tournament Access screen.
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    if (!isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { rows } = await listUsers({ page: 1, limit: 1000 });
    return NextResponse.json(rows.map(toPublicUser));
  } catch (error) {
    console.error('Get all users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
