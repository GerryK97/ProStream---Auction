import { NextRequest, NextResponse } from 'next/server';
import {
  hashPassword,
  validatePassword,
  validateEmail,
  validateUsername,
  generateToken,
} from '@/lib/auth';
import { shouldAutoApproveRole } from '@/lib/permissions';
import { createUser, getUserByEmail, getUserByUsername, toAuctionUser, toPublicUser } from '@/lib/pg/user-queries';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    if (!validateUsername(username)) {
      return NextResponse.json(
        {
          error: 'Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens',
        },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', errors: passwordValidation.errors },
        { status: 400 }
      );
    }

    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const defaultRole = 'Tournament';
    const isAutoApproved = shouldAutoApproveRole(defaultRole);
    const status = isAutoApproved ? 'Active' : 'PendingApproval';

    const user = await createUser({
      username,
      email,
      passwordHash,
      displayName: username.toLowerCase(),
      role: defaultRole,
      plan: 'Free',
      status,
      assignedTournaments: [],
    });

    let token = null;
    if (isAutoApproved) {
      token = generateToken(toAuctionUser(user));
    }

    const response = NextResponse.json(
      {
        success: true,
        message: isAutoApproved
          ? 'Account created successfully'
          : 'Account created. Please wait for admin approval.',
        user: toPublicUser(user),
        token: isAutoApproved ? token : null,
      },
      { status: 201 }
    );

    if (isAutoApproved && token) {
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}