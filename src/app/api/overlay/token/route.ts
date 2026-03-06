import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request-helpers';

// GET /api/overlay/token - Returns the overlay secret token for authenticated users
// Used by the Overlays page to build complete OBS browser source URLs
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = process.env.OVERLAY_SECRET_TOKEN;
  if (!token) return NextResponse.json({ error: 'Token not configured' }, { status: 503 });

  return NextResponse.json({ token });
}
