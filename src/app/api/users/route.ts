import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest, hashPassword, validateEmail, validateUsername } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import {
  createUser,
  getUserByEmail,
  getUserByUsername,
  listUsers,
  toPublicUser,
  type UserPlan,
  type UserRole,
  type UserStatus,
} from '@/lib/pg/user-queries';

const ALLOWED_ROLES: UserRole[] = ['Admin', 'Tournament', 'Player', 'Audience'];
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
 * GET /api/users - List all users (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const { rows, total } = await listUsers({ status, role, page, limit });

    return NextResponse.json(
      {
        success: true,
        data: rows.map(toPublicUser),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users - Create a new user (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const {
      username,
      email,
      password,
      role = 'Tournament',
      status = 'Active',
      assignedTournaments = [],
      plan = 'Free',
      mobileNumber = '',
    } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    if (!validateUsername(username)) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status selected' }, { status: 400 });
    }

    if (!ALLOWED_PLANS.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      username,
      email,
      passwordHash,
      displayName: username.toLowerCase(),
      role,
      status,
      assignedTournaments,
      plan,
      phone: mobileNumber || null,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: toPublicUser(user),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}