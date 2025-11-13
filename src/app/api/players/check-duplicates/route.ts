import { NextRequest, NextResponse } from 'next/server';
import PlayerModel from '@/models/Player';

/**
 * Diagnostic endpoint to check for duplicate players in tournaments
 * GET /api/players/check-duplicates?tournamentId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'tournamentId is required' },
        { status: 400 }
      );
    }

    // Find all players in this tournament
    const players = await PlayerModel.find({ tournamentId })
      .select('_id masterPlayerId name tournamentId')
      .lean();

    // Group by masterPlayerId to find duplicates
    const masterPlayerMap = new Map<string, any[]>();

    for (const player of players) {
      const existing = masterPlayerMap.get(player.masterPlayerId) || [];
      existing.push(player);
      masterPlayerMap.set(player.masterPlayerId, existing);
    }

    // Find duplicates
    const duplicates = [];
    for (const [masterPlayerId, playerList] of masterPlayerMap.entries()) {
      if (playerList.length > 1) {
        duplicates.push({
          masterPlayerId,
          count: playerList.length,
          players: playerList
        });
      }
    }

    return NextResponse.json({
      tournamentId,
      totalPlayers: players.length,
      uniqueMasterPlayers: masterPlayerMap.size,
      duplicatesFound: duplicates.length,
      duplicates
    });

  } catch (error: any) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      { error: `Failed to check duplicates: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Remove duplicate players from a tournament
 * DELETE /api/players/check-duplicates?tournamentId=xxx&masterPlayerId=yyy
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const masterPlayerId = searchParams.get('masterPlayerId');

    if (!tournamentId || !masterPlayerId) {
      return NextResponse.json(
        { error: 'tournamentId and masterPlayerId are required' },
        { status: 400 }
      );
    }

    // Find all duplicate instances
    const duplicates = await PlayerModel.find({
      tournamentId,
      masterPlayerId
    }).sort({ createdAt: 1 }); // Sort by creation date, oldest first

    if (duplicates.length <= 1) {
      return NextResponse.json({
        message: 'No duplicates found for this player',
        count: duplicates.length
      });
    }

    // Keep the first one, delete the rest
    const toDelete = duplicates.slice(1);
    const deleteIds = toDelete.map(p => p._id);

    await PlayerModel.deleteMany({ _id: { $in: deleteIds } });

    return NextResponse.json({
      message: `Removed ${toDelete.length} duplicate(s)`,
      kept: duplicates[0]._id,
      removed: deleteIds,
      remainingPlayer: duplicates[0]
    });

  } catch (error: any) {
    console.error('Error removing duplicates:', error);
    return NextResponse.json(
      { error: `Failed to remove duplicates: ${error.message}` },
      { status: 500 }
    );
  }
}
