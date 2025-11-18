import { NextRequest, NextResponse } from 'next/server';
import { getAuctionBootstrapData } from '@/lib/auctionBootstrap';
import { AUCTION_BOOTSTRAP_CACHE_HEADERS } from '@/lib/auctionDefaults';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tournamentId = url.searchParams.get('tournamentId');

    const payload = await getAuctionBootstrapData(tournamentId);

    return NextResponse.json(payload, {
      headers: AUCTION_BOOTSTRAP_CACHE_HEADERS,
    });
  } catch (error) {
    console.error('Error bootstrapping auction data:', error);
    return NextResponse.json({ error: 'Failed to load auction data' }, { status: 500 });
  }
}
