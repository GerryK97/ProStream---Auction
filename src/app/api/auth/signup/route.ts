import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import {
  hashPassword,
  validatePassword,
  validateEmail,
  validateUsername,
  generateUserId,
  generateToken,
} from '@/lib/auth';
import { shouldAutoApproveRole } from '@/lib/permissions';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { username, email, password } = await request.json();

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (!validateUsername(username)) {
      return NextResponse.json(
        {
          error: 'Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens',
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', errors: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Determine if user should be auto-approved
    const defaultRole: 'Tournament' = 'Tournament';
    const isAutoApproved = shouldAutoApproveRole(defaultRole);
    const status = isAutoApproved ? 'Active' : 'PendingApproval';

    // Create user
    const userId = generateUserId();
    const user = new User({
      _id: userId,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      role: defaultRole,
      plan: 'Free',
      status,
    });

    await user.save();

    // Generate token if auto-approved
    let token = null;
    if (isAutoApproved) {
      token = generateToken(user);
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: isAutoApproved
          ? 'Account created successfully'
          : 'Account created. Please wait for admin approval.',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          plan: user.plan,
        },
        token: isAutoApproved ? token : null,
      },
      { status: 201 }
    );

    // Set HttpOnly cookie if auto-approved
    if (isAutoApproved && token) {
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
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
