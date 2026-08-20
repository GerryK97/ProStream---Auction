import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { getAllPushTokens, sendExpoPush } from '@/lib/push/sendPush';
import { pgDb } from '@/lib/pg/db';
import { users } from '@/lib/pg/users-schema';
import { createNotificationForUsers } from '@/lib/notifications/store';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    if (!isAdmin(payload.role)) {
      return NextResponse.json({ error: 'Only Admin users can send notifications.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: messageBody } = body;

    if (!title?.trim() || !messageBody?.trim()) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
    }

    const tokens = await getAllPushTokens();

    // Persist an inbox notification for every user (Active accounts).
    const allUsers = await pgDb.select({ id: users.id }).from(users);
    const persisted = await createNotificationForUsers(
      allUsers.map((u) => u.id),
      { type: 'admin_broadcast', title: title.trim(), body: messageBody.trim() },
    );

    if (tokens.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, invalidTokens: 0, persisted });
    }

    const result = await sendExpoPush(tokens, {
      title: title.trim(),
      body: messageBody.trim(),
      data: { type: 'admin_broadcast' },
    });

    return NextResponse.json({ ...result, persisted });
  } catch (err) {
    console.error('[admin/notifications]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
