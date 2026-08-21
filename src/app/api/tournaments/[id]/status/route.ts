import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canAccessTournament } from '@/lib/permissions';

// PATCH /api/tournaments/[id]/status - Update tournament status
// Admin: can change to ANY status (including unarchiving). Others: assigned tournaments only.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;
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

    const existing = await TournamentModel.findById(id).lean();
    if (!existing) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    const isAdmin = user.role === 'Admin';

    // Admins can freely change any status (including archive/unarchive).
    // Non-admins must have tournament access and cannot touch archived tournaments.
    if (!isAdmin) {
      if (!canAccessTournament(user.userId, user.role, existing as any, user.assignedTournaments)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const currentStatus = (existing as { status?: string }).status;
      if (currentStatus === 'Archived' || status === 'Archived') {
        return NextResponse.json(
          { error: 'Only administrators can archive or unarchive tournaments' },
          { status: 403 }
        );
      }
    }

    // Update tournament status
    const updatedTournament = await TournamentModel.findOneAndUpdate(
      { _id: id },
      { $set: { status } },
      { returnDocument: 'after' }
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
