import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { comparePassword, generateToken, validateUsername } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { username, password } = await request.json();

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await User.findOne({
      username: username.toLowerCase(),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if user is suspended
    if (user.status === 'Suspended') {
      return NextResponse.json(
        { error: 'Account has been suspended' },
        { status: 403 }
      );
    }

    // Check if user is pending approval
    if (user.status === 'PendingApproval') {
      return NextResponse.json(
        { error: 'Account is pending admin approval' },
        { status: 403 }
      );
    }

    // Compare password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    user.lastIPAddress = request.headers.get('x-forwarded-for') || 'unknown';
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Create response with token in body
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          plan: (user as any).plan || 'Free',
          tournamentAllowance: (user as any).tournamentAllowance ?? 1,
        },
        token,
      },
      { status: 200 }
    );

    // Set HttpOnly cookie for server-side authentication (middleware)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
