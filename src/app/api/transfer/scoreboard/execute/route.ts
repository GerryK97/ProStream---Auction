import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { authorizeAuctionMutation } from '@/lib/auctionAuthorization';
import { buildTransferPlan } from '@/lib/transfer/scoreboardTransferPlan';
import {
  executeTransfer,
  findExistingTransfers,
} from '@/lib/transfer/scoreboardTransferService';

export const runtime = 'nodejs';

/**
 * POST /api/transfer/scoreboard/execute
 *
 * Create a fresh Scoreboard tournament from a finished auction, with every team
 * and its squad, inside a single transaction.
 *
 * The plan is rebuilt server-side from current data rather than trusting a plan
 * posted by the client, so a stale or tampered preview cannot decide what gets
 * written. `confirmDuplicate` must be set to re-transfer an auction that has
 * already been transferred.
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const tournamentId: string | undefined = body?.tournamentId;
    const confirmDuplicate: boolean = body?.confirmDuplicate === true;

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    const access = await authorizeAuctionMutation(request, tournamentId);
    if (!access.authorized) return access.response;

    const [teams, players] = await Promise.all([
      TeamModel.find({ tournamentId }).lean(),
      PlayerModel.find({ tournamentId }).lean(),
    ]);

    // Rebuild from source: never trust a client-supplied plan.
    const { plan, blockers } = buildTransferPlan(
      access.tournament as any,
      teams as any,
      players as any,
    );

    if (blockers.length > 0) {
      return NextResponse.json(
        { error: 'This auction cannot be transferred.', blockers },
        { status: 400 },
      );
    }

    const existing = await findExistingTransfers(tournamentId);
    if (existing.length > 0 && !confirmDuplicate) {
      return NextResponse.json(
        {
          error: 'This auction has already been transferred to the Scoreboard.',
          requiresConfirmation: true,
          existingTransfers: existing.map(t => ({
            scoreboardTournamentId: t.scoreboardTournamentId,
            transferredAt: t.transferredAt,
          })),
        },
        { status: 409 },
      );
    }

    const result = await executeTransfer(tournamentId, plan, access.user.userId ?? null);

    return NextResponse.json({
      ok: true,
      scoreboardTournamentId: result.scoreboardTournamentId,
      teamsCreated: result.teamsCreated,
      playersCreated: result.playersCreated,
      warnings: plan.warnings,
      skippedPlayers: plan.skippedPlayers,
    });
  } catch (error) {
    console.error('[transfer/scoreboard/execute] failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Transfer failed: ${message}` }, { status: 500 });
  }
}
