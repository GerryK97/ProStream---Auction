import { NextRequest, NextResponse } from 'next/server';
import { triggerOverlaySettings } from '@/lib/pusher-server';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// POST /api/overlay/settings - Broadcast overlay display settings to OBS overlay via Pusher
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'manage', 'auction')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tournamentId, size, tickerMode, displayMode, hidePremiumCard, customTickerLine1, customTickerLine2, soldMessagePosition, hideTickerCustom, hideTickerFullscreen, teamWiseTeamId } = await request.json();

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    await triggerOverlaySettings(tournamentId, {
      size: size ?? 'large',
      tickerMode: tickerMode ?? 'sold',
      displayMode: displayMode ?? 'standard',
      hidePremiumCard: hidePremiumCard ?? false,
      customTickerLine1: customTickerLine1 ?? '',
      customTickerLine2: customTickerLine2 ?? '',
      soldMessagePosition: soldMessagePosition ?? 'bottom-right',
      hideTickerCustom: hideTickerCustom ?? false,
      hideTickerFullscreen: hideTickerFullscreen ?? false,
      teamWiseTeamId: teamWiseTeamId ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating overlay settings:', error);
    return NextResponse.json({ error: 'Failed to update overlay settings' }, { status: 500 });
  }
}
