import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { verifyAdminAccess, verifyAuth } from '@/lib/api-auth';

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return auth.error;
    }

    await connectToDatabase();
    const users = await UserModel.find({}, { googleId: 0 }).lean();

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
