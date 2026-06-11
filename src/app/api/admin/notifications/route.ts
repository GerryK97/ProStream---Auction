import { NextRequest, NextResponse } from 'next/server';
import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { pgDb } from '@/lib/pg/db';
import { devicePushTokens } from '@/lib/pg/users-schema';

const expo = new Expo();

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

    // Fetch all registered device tokens
    const rows = await pgDb.select({ expoPushToken: devicePushTokens.expoPushToken }).from(devicePushTokens);

    if (rows.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, invalidTokens: 0 });
    }

    // Build messages for valid Expo tokens only
    const messages: ExpoPushMessage[] = [];
    const invalidTokens: string[] = [];

    for (const { expoPushToken } of rows) {
      if (!Expo.isExpoPushToken(expoPushToken)) {
        invalidTokens.push(expoPushToken);
        continue;
      }
      messages.push({
        to:    expoPushToken,
        sound: 'default',
        title: title.trim(),
        body:  messageBody.trim(),
        data:  { type: 'admin_broadcast' },
      });
    }

    // Send in chunks (Expo limit: 100 per request)
    const chunks  = expo.chunkPushNotifications(messages);
    let sent      = 0;
    let failed    = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      try {
        const receipts = await expo.sendPushNotificationsAsync(chunk);
        for (const receipt of receipts) {
          if (receipt.status === 'ok') {
            sent++;
          } else {
            failed++;
            if (receipt.message) errors.push(receipt.message);
          }
        }
      } catch (err: any) {
        failed += chunk.length;
        errors.push(err?.message ?? 'Chunk send failed');
      }
    }

    return NextResponse.json({
      sent,
      failed,
      invalidTokens: invalidTokens.length,
      ...(errors.length ? { errors } : {}),
    });
  } catch (err) {
    console.error('[admin/notifications]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
