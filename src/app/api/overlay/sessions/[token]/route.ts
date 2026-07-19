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
      { returnDocument: 'after' }
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

// PATCH /api/overlay/sessions/[token] — update palette only (theme is locked at creation)
export async function PATCH(
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

    const body = await request.json();

    // Guard: theme and overlayType are immutable after creation.
    if ('theme' in body || 'overlayType' in body) {
      return NextResponse.json({
        error: 'theme_locked',
        message: 'Theme and overlay type are locked at creation. Generate a new session to use a different theme.',
      }, { status: 400 });
    }

    const { palette } = body;
    if (!palette || typeof palette !== 'string' || !palette.trim()) {
      return NextResponse.json({ error: 'palette is required' }, { status: 400 });
    }

    const updated = await OverlaySessionModel.findOneAndUpdate(
      { _id: sessionToken, isActive: true },
      { $set: { palette: palette.trim() } },
      { returnDocument: 'after' }
    ).lean();

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error('Error updating overlay session palette:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

