import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OverlaySessionModel } from '@/models/OverlaySession';
import { canAccessTournament } from '@/lib/permissions';
import { getUserFromRequest } from '@/lib/request-helpers';
import { triggerOverlayRevoke } from '@/lib/pusher-server';

// DELETE /api/overlay/sessions/[token] — revoke an accessible overlay session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { token: sessionToken } = await params;
    const existingSession = await OverlaySessionModel.findOne({ _id: sessionToken, isActive: true }).lean();

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found or already revoked' }, { status: 404 });
    }

    if (!canAccessTournament(user.userId, user.role, { _id: (existingSession as any).tournamentId }, user.assignedTournaments)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
