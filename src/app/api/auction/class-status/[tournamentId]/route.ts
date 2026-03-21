import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { PlayerModel } from '@/models/Player';
import { AuctionStateModel } from '@/models/AuctionState';

// GET /api/auction/class-status/[tournamentId]
// Returns per-class player counts and completion status.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    await connectToDatabase();
    const { tournamentId } = await params;

    const tournament = await TournamentModel.findById(tournamentId).lean();
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const playerClasses: any[] = (tournament as any).playerClasses ?? [];
    if (!(tournament as any).usePlayerClasses || playerClasses.length === 0) {
      return NextResponse.json({ classes: [] });
    }

    const auctionState = await AuctionStateModel.findOne({ tournamentId }).lean();
    const currentAuctionClass: string | null = (auctionState as any)?.currentAuctionClass ?? null;
    const completedClasses: string[] = (auctionState as any)?.completedClasses ?? [];

    // Build per-class stats using parallel queries
    // player.playerClass stores the class NAME (e.g. "Platinum"), not the code
    const classStats = await Promise.all(
      playerClasses.map(async (cls: any) => {
        const [total, sold, unsold] = await Promise.all([
          PlayerModel.countDocuments({ tournamentId, playerClass: cls.name }),
          PlayerModel.countDocuments({ tournamentId, playerClass: cls.name, isSold: true }),
          PlayerModel.countDocuments({ tournamentId, playerClass: cls.name, isUnsold: true }),
        ]);
        const remaining = total - sold - unsold;

        return {
          code: cls.code,
          name: cls.name,
          color: cls.color,
          icon: cls.icon,
          order: cls.order,
          total,
          sold,
          unsold,
          remaining,
          isActive: currentAuctionClass === cls.name,
          isCompleted: completedClasses.includes(cls.name),
        };
      })
    );

    // Sort by class order
    classStats.sort((a, b) => a.order - b.order);

    return NextResponse.json({ classes: classStats, currentAuctionClass, completedClasses });
  } catch (error) {
    console.error('Error in /api/auction/class-status:', error);
    return NextResponse.json({ error: 'Failed to fetch class status' }, { status: 500 });
  }
}
