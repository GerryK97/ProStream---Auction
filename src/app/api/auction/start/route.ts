import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { AuctionStateModel } from '@/models/AuctionState';
import { triggerAuctionStarted } from '@/lib/pusher-server';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

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
    // Tournament role: can only manage tournaments they created
    const hasAccess = user.role === 'Admin' ||
                     (user.role === 'Tournament' && (tournament as any).createdBy === user.userId);

    if (!hasAccess) {
      return NextResponse.json({
        error: 'You do not have permission to manage this tournament.'
      }, { status: 403 });
    }

    // Check if this user has another tournament already live
    // Only restrict the same user from running multiple tournaments simultaneously
    // Different users can run their own tournaments at the same time
    const userLiveTournament = await TournamentModel.findOne({
      status: 'Live',
      _id: { $ne: tournamentId },
      createdBy: user.userId  // Only check tournaments created by this user
    }).lean();

    if (userLiveTournament) {
      return NextResponse.json(
        { error: `Your tournament "${(userLiveTournament as any).name}" is already live. Stop it before starting this auction.` },
        { status: 400 }
      );
    }

    // Validate: At least 2 teams
    const teamsCount = await TeamModel.countDocuments({ tournamentId });
    if (teamsCount < 2) {
      return NextResponse.json(
        { error: 'At least 2 teams are required to start the auction' },
        { status: 400 }
      );
    }

    // Validate: At least 1 player
    const playersCount = await PlayerModel.countDocuments({ tournamentId });
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
      { new: true }
    ).lean();

    // Initialize or reset auction state
    await AuctionStateModel.findOneAndUpdate(
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
      { upsert: true, new: true }
    );

    // Fetch teams and players for Pusher event
    const teams = await TeamModel.find({ tournamentId }).lean();
    const players = await PlayerModel.find({ tournamentId }).lean();

    // Trigger Pusher event
    try {
      await triggerAuctionStarted({
        tournament: updatedTournament as any,
        teams: teams as any,
        players: players as any,
        message: 'Auction started successfully',
      });
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
