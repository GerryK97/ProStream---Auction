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
