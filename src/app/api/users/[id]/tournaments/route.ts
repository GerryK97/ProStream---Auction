import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { getUserById, updateUser, toPublicUser } from '@/lib/pg/user-queries';

export const runtime = 'nodejs';

// PATCH /api/users/[id]/tournaments — update a user's assignedTournaments (admin only)
// Used by the Expo mobile app's Tournament Access screen.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    if (!isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    if (!Array.isArray(body.assignedTournaments)) {
      return NextResponse.json(
        { error: 'assignedTournaments must be an array' },
        { status: 400 }
      );
    }

    const existing = await getUserById(id);
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updated = await updateUser(id, {
      assignedTournaments: body.assignedTournaments,
    });

    return NextResponse.json({
      success: true,
      user: updated ? toPublicUser(updated) : null,
    });
  } catch (error) {
    console.error('Update user tournaments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
