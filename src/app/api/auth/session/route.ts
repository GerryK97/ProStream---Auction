import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { getUserById, toPublicUser } from '@/lib/pg/user-queries';

async function getSessionUser(token: string | null) {
  if (!token) {
    return { error: 'No token provided', status: 401 as const, user: null };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { error: 'Invalid or expired token', status: 401 as const, user: null };
  }

  const user = await getUserById(payload.userId);

  if (!user) {
    return { error: 'User not found', status: 404 as const, user: null };
  }

  if (user.status !== 'Active') {
    return { error: 'User account is not active', status: 403 as const, user: null };
  }

  return { error: null, status: 200 as const, user };
}

export async function GET(request: NextRequest) {
  try {
    const result = await getSessionUser(getTokenFromRequest(request));
    if (!result.user) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      {
        success: true,
        user: toPublicUser(result.user),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await getSessionUser(body.token);
    if (!result.user) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      {
        success: true,
        user: toPublicUser(result.user),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}