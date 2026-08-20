import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { getUserById, updateUser, toPublicUser } from '@/lib/pg/user-queries';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { notifyUser } from '@/lib/notifications/store';

export const runtime = 'nodejs';

// PATCH /api/users/[id]/tournaments — update a user's assignedTournaments (admin only)
// Used by the Expo mobile app's Tournament Access screen.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    if (!isAdmin(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    if (!Array.isArray(body.assignedTournaments)) {
      return NextResponse.json(
        { error: 'assignedTournaments must be an array' },
        { status: 400 }
      );
    }

    const existing = await getUserById(id);
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Determine which tournaments are newly assigned (added, not previously present).
    const before = new Set((existing.assignedTournaments ?? []).map(String));
    const after: string[] = body.assignedTournaments.map(String);
    const newlyAdded = after.filter((tid) => !before.has(tid));

    const updated = await updateUser(id, {
      assignedTournaments: body.assignedTournaments,
    });

    // ── Notify the user for each newly assigned tournament (persist + push) ──
    if (newlyAdded.length > 0) {
      try {
        await connectToDatabase();
        const tournaments = await TournamentModel.find(
          { _id: { $in: newlyAdded } },
          { name: 1, year: 1 },
        ).lean() as Array<{ _id: unknown; name?: string; year?: number }>;
        const nameById = new Map(tournaments.map((t) => [String(t._id), t]));

        for (const tid of newlyAdded) {
          const t = nameById.get(tid);
          const label = t?.name ? `${t.name}${t.year ? ` (${t.year})` : ''}` : 'a tournament';
          await notifyUser({
            userId: id,
            type: 'tournament_assigned',
            title: 'New tournament assigned',
            body: `You now have access to ${label}.`,
            data: { tournamentId: tid },
          });
        }
      } catch (notifyErr) {
        console.warn('[users/tournaments] assignment notify failed:', notifyErr);
      }
    }

    return NextResponse.json({
      success: true,
      user: updated ? toPublicUser(updated) : null,
    });
  } catch (error) {
    console.error('Update user tournaments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
