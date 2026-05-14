import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    await connectToDatabase();
    await User.findByIdAndUpdate(payload.userId, { expoPushToken: null });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[push/unregister]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
