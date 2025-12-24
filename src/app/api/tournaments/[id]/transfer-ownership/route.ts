import { NextRequest, NextResponse } from 'next/server';
import { TournamentModel } from '@/models/Tournament';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/request-helpers';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * POST /api/tournaments/[id]/transfer-ownership
 * Transfer tournament ownership to another user (Admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admin can transfer ownership
    if (user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Only administrators can transfer tournament ownership' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id: tournamentId } = await params;
    const { newOwnerId } = await request.json();

    // Validate newOwnerId
    if (!newOwnerId) {
      return NextResponse.json(
        { error: 'New owner ID is required' },
        { status: 400 }
      );
    }

    // Check if new owner exists
    const newOwner = await User.findById(newOwnerId);
    if (!newOwner) {
      return NextResponse.json(
        { error: 'New owner not found' },
        { status: 404 }
      );
    }

    // Get tournament
    const tournament = await TournamentModel.findById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Store old owner for response
    const oldOwnerId = tournament.createdBy;

    // Update tournament owner
    tournament.createdBy = newOwnerId;
    await tournament.save();

    return NextResponse.json({
      success: true,
      message: `Tournament ownership transferred from ${oldOwnerId} to ${newOwnerId}`,
      tournament: tournament.toObject(),
      newOwner: {
        id: newOwner._id,
        username: newOwner.username,
        email: newOwner.email,
        role: newOwner.role,
      },
    });
  } catch (error: any) {
    console.error('Error transferring tournament ownership:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transfer tournament ownership' },
      { status: 500 }
    );
  }
}
