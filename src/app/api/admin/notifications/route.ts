import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { isAdmin } from '@/lib/permissions';
import { User } from '@/models/User';
import Expo from 'expo-server-sdk';

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

    const { title, body } = await request.json();
    if (!title || !body) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
    }

    await connectToDatabase();
    const users = await User.find({ expoPushToken: { $ne: null } }).select('expoPushToken').lean();

    const tokens = users
      .map((u: any) => u.expoPushToken as string)
      .filter((t) => Expo.isExpoPushToken(t));

    const messages = tokens.map((pushToken) => ({
      to: pushToken,
      sound: 'default' as const,
      title,
      body,
    }));

    const chunks = expo.chunkPushNotifications(messages);
    let sent = 0;
    let failed = 0;
    let invalidTokens = 0;

    for (const chunk of chunks) {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      for (const receipt of receipts) {
        if (receipt.status === 'ok') {
          sent++;
        } else {
          if (receipt.details?.error === 'DeviceNotRegistered') invalidTokens++;
          else failed++;
        }
      }
    }

    return NextResponse.json({ sent, failed, invalidTokens });
  } catch (err) {
    console.error('[admin/notifications]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
