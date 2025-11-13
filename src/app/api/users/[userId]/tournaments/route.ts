import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';
import { verifyAdminAccess } from '@/lib/api-auth';

// PATCH /api/users/[userId]/tournaments - Assign or unassign tournaments to a user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const auth = await verifyAdminAccess(request);

    if (!auth.authorized) {
      return auth.error;
    }

    await connectToDatabase();
    const { tournamentId, action } = await request.json();

    if (!tournamentId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: tournamentId, action' },
        { status: 400 }
      );
    }

    if (action !== 'assign' && action !== 'unassign') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "assign" or "unassign"' },
        { status: 400 }
      );
    }

    // Find user
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'assign') {
      // Add tournament to user's assignedTournaments if not already present
      if (!user.assignedTournaments.includes(tournamentId)) {
        user.assignedTournaments.push(tournamentId);
        await user.save();
      }
    } else if (action === 'unassign') {
      // Remove tournament from user's assignedTournaments
      user.assignedTournaments = user.assignedTournaments.filter(
        (id: string) => id !== tournamentId
      );
      await user.save();
    }

    return NextResponse.json({
      message: `Tournament ${action}ed successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedTournaments: user.assignedTournaments,
      },
    });
  } catch (error) {
    console.error('Error updating user tournament assignments:', error);
    return NextResponse.json(
      { error: 'Failed to update tournament assignments' },
      { status: 500 }
    );
  }
}

// GET /api/users/[userId]/tournaments - Get user's assigned tournaments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const auth = await verifyAdminAccess(request);

    if (!auth.authorized) {
      return auth.error;
    }

    await connectToDatabase();
    const user = await UserModel.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedTournaments: user.assignedTournaments,
    });
  } catch (error) {
    console.error('Error fetching user tournament assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament assignments' },
      { status: 500 }
    );
  }
}
