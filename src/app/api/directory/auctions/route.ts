import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { getUserFromRequest } from '@/lib/request-helpers';

export const runtime = 'nodejs';

/**
 * GET /api/directory/auctions?ids=<comma-separated auction ids>
 *
 * Authenticated Registry-only auction metadata. This deliberately returns only
 * display fields, so a member profile can show an assigned auction's identity
 * without granting access to its private auction data or navigation.
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ids = Array.from(new Set(
    (request.nextUrl.searchParams.get('ids') ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => /^[a-f\d]{24}$/i.test(id)),
  )).slice(0, 50);

  if (ids.length === 0) return NextResponse.json([]);

  try {
    await connectToDatabase();
    const rows = await TournamentModel.find(
      { _id: { $in: ids } },
      { _id: 1, name: 1, year: 1, status: 1, logoURL: 1 },
    ).lean() as Array<{
      _id: { toString(): string };
      name?: string;
      year?: number;
      status?: string;
      logoURL?: string;
    }>;

    const byId = new Map(rows.map((row) => [String(row._id), row]));
    return NextResponse.json(ids.flatMap((id) => {
      const row = byId.get(id);
      return row ? [{
        id,
        name: row.name ?? 'Untitled auction',
        year: row.year ?? null,
        status: row.status ?? null,
        logoURL: row.logoURL ?? null,
      }] : [];
    }));
  } catch (error) {
    console.error('Directory auction summary error:', error);
    return NextResponse.json({ error: 'Failed to load auction details' }, { status: 500 });
  }
}
