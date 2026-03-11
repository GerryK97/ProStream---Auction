import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Get token from request
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Connect to database and fetch user
    await connectToDatabase();
    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is still active
    if (user.status !== 'Active') {
      return NextResponse.json(
        { error: 'User account is not active' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          assignedTournaments: user.assignedTournaments,
          assignedTeams: user.assignedTeams,
          assignedPlayer: user.assignedPlayer,
          plan: (user as any).plan || 'Free',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Connect to database and fetch user
    await connectToDatabase();
    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is still active
    if (user.status !== 'Active') {
      return NextResponse.json(
        { error: 'User account is not active' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          assignedTournaments: user.assignedTournaments,
          assignedTeams: user.assignedTeams,
          assignedPlayer: user.assignedPlayer,
          plan: (user as any).plan || 'Free',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
