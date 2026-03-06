import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PlayerModel } from '@/models/Player';
import { getUserFromRequest } from '@/lib/request-helpers';

// POST /api/admin/migrate-player-age
// One-time migration: sets age=30 on all players that have no age field.
// Admin only. Safe to run multiple times (idempotent).
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await connectToDatabase();
  const result = await PlayerModel.updateMany(
    { age: { $exists: false } },
    { $set: { age: 30 } }
  );
  return NextResponse.json({ updated: result.modifiedCount });
}
