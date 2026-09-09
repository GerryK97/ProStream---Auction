import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { authorizeAuctionMutation } from '@/lib/auctionAuthorization';
import { buildTransferPlan } from '@/lib/transfer/scoreboardTransferPlan';
import { findExistingTransfers } from '@/lib/transfer/scoreboardTransferService';

export const runtime = 'nodejs';

/**
 * POST /api/transfer/scoreboard/preview
 *
 * Read-only dry run of an Auction → Scoreboard transfer. Writes nothing.
 *
 * Returns the exact rows that would be created plus every value that had to be
 * approximated, so the operator can see downgrades (e.g. a bowling style the
 * Scoreboard cannot represent) BEFORE anything is inserted.
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const tournamentId: string | undefined = body?.tournamentId;
    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    const access = await authorizeAuctionMutation(request, tournamentId);
    if (!access.authorized) return access.response;

    const [teams, players] = await Promise.all([
      TeamModel.find({ tournamentId }).lean(),
      PlayerModel.find({ tournamentId }).lean(),
    ]);

    const { plan, blockers } = buildTransferPlan(
      access.tournament as any,
      teams as any,
      players as any,
    );

    const existingTransfers = await findExistingTransfers(tournamentId);

    return NextResponse.json({
      plan,
      blockers,
      canTransfer: blockers.length === 0,
      existingTransfers: existingTransfers.map(t => ({
        scoreboardTournamentId: t.scoreboardTournamentId,
        transferredAt: t.transferredAt,
      })),
    });
  } catch (error) {
    console.error('[transfer/scoreboard/preview] failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Preview failed: ${message}` }, { status: 500 });
  }
}
