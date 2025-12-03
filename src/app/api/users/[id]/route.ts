import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { verifyToken, getTokenFromRequest, hashPassword } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * GET /api/users/[id] - Get user details (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const user = await User.findById(id).select('-passwordHash');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id] - Update user (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const {
      username,
      email,
      password,
      role,
      status,
      assignedTournaments,
      assignedTeams,
      assignedPlayer,
      plan,
      tournamentAllowance,
    } = await request.json();

    // Update fields
    if (username) user.username = username.toLowerCase();
    if (email) user.email = email.toLowerCase();
    if (password) user.passwordHash = await hashPassword(password);
    if (role) user.role = role;
    if (status) user.status = status;
    if (assignedTournaments) user.assignedTournaments = assignedTournaments;
    if (assignedTeams) user.assignedTeams = assignedTeams;
    if (assignedPlayer !== undefined) user.assignedPlayer = assignedPlayer;
    if (plan) {
      const allowedPlans = ['Free', 'Standard', 'Offer'];
      if (!allowedPlans.includes(plan)) {
        return NextResponse.json(
          { error: 'Invalid plan selected' },
          { status: 400 }
        );
      }
      (user as any).plan = plan;
    }
    if (tournamentAllowance !== undefined) {
      const parsedAllowance = Number(tournamentAllowance);
      if (!Number.isFinite(parsedAllowance) || parsedAllowance < 0) {
        return NextResponse.json(
          { error: 'Invalid tournament allowance' },
          { status: 400 }
        );
      }
      (user as any).tournamentAllowance = parsedAllowance;
    }

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'User updated successfully',
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
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id] - Delete user (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Prevent admin from deleting themselves
    if (id === payload.userId) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    const result = await User.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
