/**
 * GET /api/cron/auction-lifecycle
 *
 * Vercel cron job (runs daily at 02:00 UTC via vercel.json).
 * Secured by the CRON_SECRET header that Vercel injects automatically.
 *
 * Two tasks:
 *  1. AUTO-COMPLETE  — any tournament whose auctionDate is today or earlier AND
 *                      whose status is NOT already Completed / Archived gets
 *                      bumped to "Completed" and stamped with completedAt.
 *
 *  2. AUTO-DELETE    — any tournament with status === "Completed" and
 *                      completedAt older than 60 days is deleted along with
 *                      all its players, teams, and auction state.
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

    // ── 1. AUTO-COMPLETE ─────────────────────────────────────────────────────
    // Build today's date string in YYYY-MM-DD (UTC)
    const todayStr = now.toISOString().slice(0, 10); // e.g. "2026-06-27"

    const ACTIVE_STATUSES = ['Draft', 'Setup', 'Pending', 'Live', 'Paused', 'Stopped'];

    const toComplete = await TournamentModel.find({
      status: { $in: ACTIVE_STATUSES },
      auctionDate: { $exists: true, $ne: '', $lte: todayStr },
    }).lean() as any[];

    let completed = 0;
    if (toComplete.length > 0) {
      const ids = toComplete.map((t: any) => t._id);
      const result = await TournamentModel.updateMany(
        { _id: { $in: ids } },
        { $set: { status: 'Completed', completedAt: now } },
      );
      completed = result.modifiedCount;
    }

    // ── 2. AUTO-DELETE ───────────────────────────────────────────────────────
    const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const toDelete = await TournamentModel.find({
      status: 'Completed',
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
      autoCompleted: completed,
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
