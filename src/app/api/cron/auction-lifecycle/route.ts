/**
 * GET /api/cron/auction-lifecycle
 *
 * Vercel cron job (runs daily at 02:00 UTC via vercel.json).
 * Secured by the CRON_SECRET header that Vercel injects automatically.
 *
 * Task:
 *  AUTO-DELETE — any tournament an ADMIN has deliberately Archived, whose
 *                completedAt (archive timestamp) is older than 60 days, is
 *                deleted along with all its players, teams, and auction state.
 *
 * NOTE: Date-based AUTO-COMPLETE was removed. A tournament's scheduled
 * `auctionDate` passing does NOT mean the auction happened — auctions slip,
 * span days, or are created with placeholder dates. Completion is driven only
 * by explicit actions: /api/auction/stop (all players sold) and
 * /api/tournaments/[id]/complete (manual). See incident: tournaments were being
 * force-completed on their auction morning by this cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { AuctionStateModel } from '@/models/AuctionState';

export const runtime = 'nodejs';

const RETENTION_DAYS = 60; // 2 months

function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Vercel injects the secret as the Authorization header:
  // "Bearer <CRON_SECRET>"
  if (secret) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth === `Bearer ${secret}`) return true;
    // Also accept direct header for manual curl testing
    if (req.headers.get('x-cron-secret') === secret) return true;
    return false;
  }
  // If CRON_SECRET is not configured, only allow in development
  return process.env.NODE_ENV !== 'production';
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const now = new Date();

    // ── AUTO-DELETE (Archived only) ──────────────────────────────────────────
    // Only tournaments an admin has explicitly Archived are eligible for
    // permanent cleanup. This requires a deliberate human action first, so no
    // active or merely-completed tournament is ever auto-deleted.
    const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const toDelete = await TournamentModel.find({
      status: 'Archived',
      completedAt: { $exists: true, $lte: cutoff },
    }).lean() as any[];

    let deleted = 0;
    if (toDelete.length > 0) {
      const ids = toDelete.map((t: any) => String(t._id));

      // Delete related data first, then the tournaments
      await Promise.all([
        PlayerModel.deleteMany({ tournamentId: { $in: ids } }),
        TeamModel.deleteMany({ tournamentId: { $in: ids } }),
        AuctionStateModel.deleteMany({ tournamentId: { $in: ids } }),
      ]);
      const result = await TournamentModel.deleteMany({ _id: { $in: ids } });
      deleted = result.deletedCount;
    }

    const summary = {
      ok: true,
      ranAt: now.toISOString(),
      autoCompleted: 0, // date-based auto-complete removed
      autoDeleted: deleted,
      retentionDays: RETENTION_DAYS,
    };

    console.log('[cron/auction-lifecycle]', summary);
    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('[cron/auction-lifecycle] error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal error' },
      { status: 500 },
    );
  }
}
