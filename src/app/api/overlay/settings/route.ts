import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { triggerOverlaySettings } from '@/lib/pusher-server';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import {
  normalizeOverlayControlSettings,
  overlayControlSettingsFromEvent,
} from '@/lib/overlays/overlayControlSettings';
import type { OverlayControlSettings } from '@/types';

const OVERLAY_SETTING_KEYS = [
  'size',
  'tickerMode',
  'displayMode',
  'hidePremiumCard',
  'customTickerLine1',
  'customTickerLine2',
  'soldMessagePosition',
  'hideTickerCustom',
  'hideTickerFullscreen',
  'teamWiseTeamId',
  'bidCardTop',
  'bidCardLeft',
  'hideTeamCards',
  'teamCardSize',
  'teamCardPosition',
  'bidCardPosition',
] as const satisfies readonly (keyof OverlayControlSettings)[];

// GET /api/overlay/settings?tournamentId=xxx — load persisted overlay control settings
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'manage', 'auction')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tournamentId = request.nextUrl.searchParams.get('tournamentId');
    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    await connectToDatabase();
    const tournament = await TournamentModel.findById(tournamentId)
      .select('overlayControlSettings')
      .lean();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return NextResponse.json({
      settings: normalizeOverlayControlSettings(
        (tournament as { overlayControlSettings?: Record<string, unknown> }).overlayControlSettings,
      ),
    });
  } catch (error) {
    console.error('Error fetching overlay settings:', error);
    return NextResponse.json({ error: 'Failed to fetch overlay settings' }, { status: 500 });
  }
}

// POST /api/overlay/settings — persist + broadcast overlay display settings
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'manage', 'auction')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { tournamentId } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    const settings = overlayControlSettingsFromEvent(body);

    await connectToDatabase();
    await TournamentModel.findByIdAndUpdate(tournamentId, {
      $set: { overlayControlSettings: settings },
    });

    await triggerOverlaySettings(tournamentId, settings);

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error('Error updating overlay settings:', error);
    return NextResponse.json({ error: 'Failed to update overlay settings' }, { status: 500 });
  }
}

// PATCH /api/overlay/settings — atomically update only the supplied settings.
// Automatic updates such as player-card auto-size must not replace unrelated
// persisted settings (notably FullScreen2 bidCardTop/bidCardLeft).
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'manage', 'auction')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { tournamentId } = body;
    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    for (const key of OVERLAY_SETTING_KEYS) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updates[`overlayControlSettings.${key}`] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No overlay settings supplied' }, { status: 400 });
    }

    await connectToDatabase();
    const tournament = await TournamentModel.findByIdAndUpdate(
      tournamentId,
      { $set: updates },
      { returnDocument: 'after', runValidators: true },
    )
      .select('overlayControlSettings')
      .lean();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const settings = normalizeOverlayControlSettings(
      (tournament as { overlayControlSettings?: Partial<OverlayControlSettings> }).overlayControlSettings,
    );
    // sizeRev is ephemeral (not persisted) — used so overlays can drop stale size patches
    // that were already in-flight when auto-switch flipped Large → Small → Large.
    const sizeRev = typeof body.sizeRev === 'number' && Number.isFinite(body.sizeRev)
      ? body.sizeRev
      : undefined;
    await triggerOverlaySettings(tournamentId, {
      ...settings,
      ...(sizeRev !== undefined ? { sizeRev } : {}),
    });

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error('Error patching overlay settings:', error);
    return NextResponse.json({ error: 'Failed to update overlay settings' }, { status: 500 });
  }
}
