import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * POST /api/users/approve - Approve pending user registration (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Verify authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!isAdmin(payload.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { userId, approve = true } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.status !== 'PendingApproval') {
      return NextResponse.json(
        { error: 'User is not pending approval' },
        { status: 400 }
      );
    }

    if (approve) {
      user.status = 'Active';
      await user.save();

      return NextResponse.json(
        {
          success: true,
          message: 'User approved successfully',
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
          },
        },
        { status: 200 }
      );
    } else {
      // Reject (delete) the user
      await User.deleteOne({ _id: userId });

      return NextResponse.json(
        {
          success: true,
          message: 'User rejected and deleted',
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Approve user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/approve - Get pending users (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Verify authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!isAdmin(payload.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const pendingUsers = await User.find({ status: 'PendingApproval' })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: pendingUsers,
        count: pendingUsers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get pending users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
