import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { verifyTournamentManagement } from '@/lib/api-auth';

// PATCH /api/tournaments/[id]/status - Update tournament status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify user can manage this tournament
    const auth = await verifyTournamentManagement(request, id);
    if (!auth.authorized) {
      return auth.error;
    }

    await connectToDatabase();
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Missing required field: status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['Draft', 'Completed', 'Setup', 'Pending', 'Live', 'Paused', 'Stopped', 'Archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update tournament status
    const updatedTournament = await TournamentModel.findOneAndUpdate(
      { _id: id },
      { $set: { status } },
      { new: true }
    ).lean();

    if (!updatedTournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTournament);
  } catch (error) {
    console.error('Error updating tournament status:', error);
    return NextResponse.json(
      { error: 'Failed to update tournament status' },
      { status: 500 }
    );
  }
}
