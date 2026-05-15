import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    return NextResponse.json(
      { error: 'Push notification registration is unavailable after the Postgres user-store cutover.' },
      { status: 410 }
    );
  } catch (err) {
    console.error('[push/register]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}