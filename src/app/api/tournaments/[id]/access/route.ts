import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { User } from '@/models/User';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';

// GET /api/tournaments/[id]/access — list all users who have access to this tournament
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    if (!isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: tournamentId } = await params;

    const tournament = await TournamentModel.findById(tournamentId).lean();
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    // Find all non-admin users who have this tournament in their assignedTournaments
    const users = await User.find({
      assignedTournaments: tournamentId,
      role: { $ne: 'Admin' },
    }).select('_id username email role status').lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching tournament access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tournaments/[id]/access — grant or revoke a user's access to this tournament
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    if (!isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: tournamentId } = await params;
    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields: userId, action' }, { status: 400 });
    }

    if (action !== 'grant' && action !== 'revoke') {
      return NextResponse.json({ error: 'action must be "grant" or "revoke"' }, { status: 400 });
    }

    const tournament = await TournamentModel.findById(tournamentId).lean();
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    const targetUser = await User.findById(userId).lean();
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if ((targetUser as any).role === 'Admin') {
      return NextResponse.json(
        { error: 'Admin users always have access — no assignment needed' },
        { status: 400 }
      );
    }

    const update =
      action === 'grant'
        ? { $addToSet: { assignedTournaments: tournamentId } }
        : { $pull: { assignedTournaments: tournamentId } };

    await User.findByIdAndUpdate(userId, update);

    return NextResponse.json({
      message:
        action === 'grant'
          ? 'Access granted successfully'
          : 'Access revoked successfully',
    });
  } catch (error) {
    console.error('Error updating tournament access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
