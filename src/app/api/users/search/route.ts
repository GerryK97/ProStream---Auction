import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { getUserByUsername } from '@/lib/pg/user-queries';

/**
 * GET /api/users/search?username=<exact>
 *
 * Available to any authenticated user.
 * Returns minimal public fields for the matched user.
 * Requires an exact username match (case-insensitive).
 */
export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const username = request.nextUrl.searchParams.get('username')?.trim().toLowerCase();
  if (!username) return NextResponse.json({ error: 'username query param is required' }, { status: 400 });

  try {
    const found = await getUserByUsername(username);
    if (!found) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Return only the fields the client needs — no sensitive data
    return NextResponse.json({
      _id: found._id,
      username: found.username,
      role: found.role,
      assignedTournaments: found.assignedTournaments ?? [],
    });
  } catch (err) {
    console.error('User search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
