import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { pgDb } from '@/lib/pg/db';
import { devicePushTokens } from '@/lib/pg/users-schema';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { expoPushToken } = body;

    if (!expoPushToken || typeof expoPushToken !== 'string') {
      return NextResponse.json({ error: 'expoPushToken is required' }, { status: 400 });
    }

    await pgDb
      .delete(devicePushTokens)
      .where(eq(devicePushTokens.expoPushToken, expoPushToken));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[push/unregister]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
