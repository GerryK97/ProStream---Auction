import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest, hashPassword, validateEmail, validateUsername } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import {
  deleteUser,
  getUserByEmail,
  getUserById,
  getUserByUsername,
  toPublicUser,
  updateUser,
  type UserPlan,
  type UserRole,
  type UserStatus,
} from '@/lib/pg/user-queries';

const ALLOWED_ROLES: UserRole[] = ['Admin', 'Operator', 'Scorer', 'Player', 'Audience'];
const ALLOWED_STATUSES: UserStatus[] = ['Active', 'PendingApproval', 'Suspended'];
const ALLOWED_PLANS: UserPlan[] = ['Free', 'Standard', 'Offer'];

async function requireAdmin(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const payload = verifyToken(token);
  if (!payload) return { ok: false as const, response: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) };
  if (!isAdmin(payload.role)) return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { ok: true as const, payload };
}

/**
 * GET /api/users/[id] - Get user details (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: toPublicUser(user),
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
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const {
      username,
      email,
      password,
      role,
      status,
      assignedTournaments,
      plan,
      mobileNumber,
      canRechargeWallet,
    } = await request.json();

    const updateDoc: Record<string, any> = {};

    if (username) {
      if (!validateUsername(username)) return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
      const existing = await getUserByUsername(username);
      if (existing && existing.id !== id) return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
      updateDoc.username = username.toLowerCase();
      updateDoc.displayName = username.toLowerCase();
    }

    if (email) {
      if (!validateEmail(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      const existing = await getUserByEmail(email);
      if (existing && existing.id !== id) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      updateDoc.email = email.toLowerCase();
    }

    if (password) updateDoc.passwordHash = await hashPassword(password);

    if (role) {
      if (!ALLOWED_ROLES.includes(role)) return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 });
      updateDoc.role = role;
    }

    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status selected' }, { status: 400 });
      updateDoc.status = status;
    }

    if (assignedTournaments !== undefined) updateDoc.assignedTournaments = assignedTournaments;
    if (typeof canRechargeWallet === 'boolean') updateDoc.canRechargeWallet = canRechargeWallet;
    if (mobileNumber !== undefined) {
      updateDoc.phone = mobileNumber || null;
      // Reset verification status whenever the phone number is changed by admin
      updateDoc.phoneVerified = false;
    }

    if (plan) {
      if (!ALLOWED_PLANS.includes(plan)) {
        return NextResponse.json(
          { error: 'Invalid plan selected' },
          { status: 400 }
        );
      }
      updateDoc.plan = plan;
    }

    const updatedUser = await updateUser(id, updateDoc);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User updated successfully',
        user: toPublicUser(updatedUser),
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
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    if (id === auth.payload.userId) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    const deleted = await deleteUser(id);

    if (!deleted) {
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