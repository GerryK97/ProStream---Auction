import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { getPushTokensForRole, sendExpoPush } from '@/lib/push/sendPush';
import { createNotificationForRole } from '@/lib/notifications/store';

/**
 * POST /api/directory/player-requests
 *
 * Any authenticated user can request that an Admin add a player profile from
 * CricHeroes. This is fire-and-forget: it does not persist a record, it only
 * sends a push notification to all Admin users. Admins remain the sole authority
 * for actually importing player JSON.
 *
 * Body: { playerName: string; cricheroesId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const playerName = String(body?.playerName ?? '').trim();
    const cricheroesId = String(body?.cricheroesId ?? '').trim();

    if (!playerName) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }
    if (!cricheroesId) {
      return NextResponse.json({ error: 'CricHeroes ID is required' }, { status: 400 });
    }

    const requester = payload.username || payload.userId;
    const adminTokens = await getPushTokensForRole('Admin');

    const title = 'New player profile request';
    const message = `${requester} requested "${playerName}" (CricHeroes ID: ${cricheroesId})`;
    const data = {
      type: 'player_request',
      playerName,
      cricheroesId,
      requestedBy: requester,
      requestedByUserId: payload.userId,
    };

    // Persist an inbox notification for every admin (so it is not lost if their
    // device is offline), then fire the push best-effort.
    const persisted = await createNotificationForRole('Admin', {
      type: 'player_request',
      title,
      body: message,
      data,
    });

    const result = await sendExpoPush(adminTokens, { title, body: message, data });

    return NextResponse.json({
      ok: true,
      notifiedAdmins: persisted,
      pushed: result.sent,
      message: 'Your request has been sent to the admin.',
    });
  } catch (err) {
    console.error('[directory/player-requests]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
