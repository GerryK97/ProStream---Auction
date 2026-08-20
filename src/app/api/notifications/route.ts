import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { listNotifications, markRead } from '@/lib/notifications/store';

/**
 * GET /api/notifications?limit=&offset=
 * Returns the caller's notifications (newest first) with unread + total counts.
 */
export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const limit = parseInt(sp.get('limit') ?? '50', 10) || 50;
  const offset = parseInt(sp.get('offset') ?? '0', 10) || 0;

  try {
    const result = await listNotifications(payload.userId, { limit, offset });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[notifications GET]', err);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

/**
 * POST /api/notifications  { action: 'read', ids?: number[] }
 * Marks the given notifications (or all) as read for the caller.
 */
export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const action = body?.action ?? 'read';
  if (action !== 'read') {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const ids: number[] | undefined = Array.isArray(body?.ids)
    ? body.ids.map((n: unknown) => Number(n)).filter((n: number) => Number.isFinite(n))
    : undefined;

  try {
    const updated = await markRead(payload.userId, ids);
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    console.error('[notifications POST]', err);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
