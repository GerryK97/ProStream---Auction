import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OverlaySessionModel } from '@/models/OverlaySession';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { triggerOverlayRevoke } from '@/lib/pusher-server';

// DELETE /api/overlay/sessions/[token] — revoke a session (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectToDatabase();

    const authToken = getTokenFromRequest(request);
    if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(authToken);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    if (!isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { token: sessionToken } = await params;

    const session = await OverlaySessionModel.findOneAndUpdate(
      { _id: sessionToken, isActive: true },
      { $set: { isActive: false, revokedAt: new Date() } },
      { new: true }
    ).lean();

    if (!session) {
      return NextResponse.json({ error: 'Session not found or already revoked' }, { status: 404 });
    }

    // Fire-and-forget: push revoke event so the active overlay disconnects immediately
    void triggerOverlayRevoke((session as any).tournamentId, sessionToken)
      .catch(err => console.error('[sessions] triggerOverlayRevoke failed:', err));

    return NextResponse.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Error revoking overlay session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
