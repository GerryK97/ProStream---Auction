import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { AuctionStateModel } from '@/models/AuctionState';
import { triggerAuctionStarted, triggerWake } from '@/lib/pusher-server';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import { serializeTeam, serializePlayer } from '@/lib/cloudinaryUtils';

// POST /api/auction/start - Start auction with validation
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage auctions
    if (!canPerformAction(user.role, 'manage', 'auction')) {
      return NextResponse.json({
        error: `Your role (${user.role}) does not have permission to start auctions.`
      }, { status: 403 });
    }

    await connectToDatabase();
    const { tournamentId } = await request.json();

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Missing required field: tournamentId' },
        { status: 400 }
      );
    }

    // Get tournament
    const tournament = await TournamentModel.findById(tournamentId).lean();
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this tournament
    // Admin: can manage any tournament
    // Tournament role: creator OR explicitly assigned to this tournament
    const hasAccess = user.role === 'Admin' ||
                     (user.role === 'Tournament' && (
                       (tournament as any).createdBy === user.userId ||
                       user.assignedTournaments.includes(tournamentId)
                     ));

    if (!hasAccess) {
      return NextResponse.json({
        error: 'You do not have permission to manage this tournament.'
      }, { status: 403 });
    }

    // Admin users may run multiple tournaments concurrently.
    // Non-Admin users are restricted to one live tournament at a time.
    if (user.role !== 'Admin') {
      const userLiveTournament = await TournamentModel.findOne({
        status: 'Live',
        _id: { $ne: tournamentId },
        createdBy: user.userId
      }).lean();

      if (userLiveTournament) {
        return NextResponse.json(
          { error: `Your tournament "${(userLiveTournament as any).name}" is already live. Stop it before starting this auction.` },
          { status: 400 }
        );
      }
    }

    // Validate: At least 2 teams + at least 1 player — parallel counts
    const [teamsCount, playersCount] = await Promise.all([
      TeamModel.countDocuments({ tournamentId }),
      PlayerModel.countDocuments({ tournamentId }),
    ]);
    if (teamsCount < 2) {
      return NextResponse.json(
        { error: 'At least 2 teams are required to start the auction' },
        { status: 400 }
      );
    }
    if (playersCount < 1) {
      return NextResponse.json(
        { error: 'At least 1 player is required to start the auction' },
        { status: 400 }
      );
    }

    // Update tournament status to Live
    const updatedTournament = await TournamentModel.findByIdAndUpdate(
      tournamentId,
      { $set: { status: 'Live' } },
      { returnDocument: 'after' }
    ).lean();

    // Initialize or reset auction state
    const resetAuctionState = await AuctionStateModel.findOneAndUpdate(
      { tournamentId },
      {
        $set: {
          tournamentId,
          currentPlayerId: null,
          currentBid: 0,
          winningTeamId: null,
          currentAuctionStatus: 'Pending',
          history: []
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    const playerEventFields = {
      tournamentId: 1, name: 1, displayName: 1, playerNo: 1, position: 1,
      playerClass: 1, basePrice: 1, photoURL: 1, secondaryImageURL: 1,
      isSold: 1, isUnsold: 1, finalPrice: 1, winningTeamId: 1,
    };
    const teamEventFields = {
      tournamentId: 1, name: 1, shortCode: 1, ownerName: 1, logoURL: 1,
      initialBudget: 1, currentBalance: 1, playersPurchased: 1,
    };

    // Fetch only fields needed by auction clients for the Pusher event.
    // Full bootstrap fetch remains available for explicit refresh/reconnect.
    const [teams, players] = await Promise.all([
      TeamModel.find({ tournamentId }, teamEventFields).lean(),
      PlayerModel.find({ tournamentId }, playerEventFields).lean(),
    ]);

    // Trigger Pusher events — wake + started in parallel
    try {
      await Promise.all([
        triggerWake(tournamentId),
        triggerAuctionStarted({
          tournament: updatedTournament as any,
          teams: teams.map(serializeTeam) as any,
          players: players.map(serializePlayer) as any,
          auctionState: resetAuctionState as any,
          message: 'Auction started successfully',
        }),
      ]);
    } catch (pusherError) {
      console.error('Failed to trigger Pusher event:', pusherError);
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json({
      message: 'Auction started successfully',
      tournament: updatedTournament,
      teamsCount,
      playersCount
    });
  } catch (error) {
    console.error('Error starting auction:', error);
    return NextResponse.json(
      { error: 'Failed to start auction' },
      { status: 500 }
    );
  }
}
