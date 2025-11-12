import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PlayerModel } from '@/models/Player';

// POST /api/database/remove-duplicates - Remove duplicate players
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { tournamentId } = await request.json();

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'tournamentId is required' },
        { status: 400 }
      );
    }

    // Find all players for this tournament
    const players = await PlayerModel.find({ tournamentId }).lean();

    // Group players by name
    const playersByName: { [key: string]: any[] } = {};
    players.forEach((player: any) => {
      const name = player.name;
      if (!playersByName[name]) {
        playersByName[name] = [];
      }
      playersByName[name].push(player);
    });

    // Find duplicates (players with same name)
    const duplicates: string[] = [];
    const toDelete: string[] = [];

    for (const [name, playerGroup] of Object.entries(playersByName)) {
      if (playerGroup.length > 1) {
        duplicates.push(name);

        // Sort by _id (older players first based on ObjectId timestamp)
        playerGroup.sort((a, b) => {
          const aId = a._id.toString();
          const bId = b._id.toString();
          return aId.localeCompare(bId);
        });

        // Keep the first one (oldest), delete the rest
        for (let i = 1; i < playerGroup.length; i++) {
          if (!playerGroup[i].isSold) {
            // Only delete if not sold
            toDelete.push(playerGroup[i]._id.toString());
          }
        }
      }
    }

    // Delete duplicate players
    if (toDelete.length > 0) {
      await PlayerModel.deleteMany({
        _id: { $in: toDelete }
      });
    }

    return NextResponse.json({
      message: 'Duplicate players removed',
      duplicatesFound: duplicates.length,
      playersDeleted: toDelete.length,
      duplicateNames: duplicates,
      details: {
        totalPlayers: players.length,
        remainingPlayers: players.length - toDelete.length
      }
    });
  } catch (error) {
    console.error('Error removing duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to remove duplicates' },
      { status: 500 }
    );
  }
}

// GET /api/database/remove-duplicates - Check for duplicates without removing
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'tournamentId query parameter is required' },
        { status: 400 }
      );
    }

    // Find all players for this tournament
    const players = await PlayerModel.find({ tournamentId }).lean();

    // Group players by name
    const playersByName: { [key: string]: any[] } = {};
    players.forEach((player: any) => {
      const name = player.name;
      if (!playersByName[name]) {
        playersByName[name] = [];
      }
      playersByName[name].push(player);
    });

    // Find duplicates
    const duplicates: { name: string; count: number; players: any[] }[] = [];

    for (const [name, playerGroup] of Object.entries(playersByName)) {
      if (playerGroup.length > 1) {
        duplicates.push({
          name,
          count: playerGroup.length,
          players: playerGroup.map((p: any) => ({
            _id: p._id.toString(),
            name: p.name,
            position: p.position,
            isSold: p.isSold
          }))
        });
      }
    }

    return NextResponse.json({
      totalPlayers: players.length,
      duplicatesFound: duplicates.length,
      duplicates
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    );
  }
}
