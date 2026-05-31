import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, validateEmail, validateUsername } from '@/lib/auth';
import { getUserByEmail, getUserById, getUserByUsername, toPublicUser, updateUser } from '@/lib/pg/user-queries';

function isValidMobileNumber(mobileNumber: string): boolean {
  return /^[+\d][\d\s\-()]{6,19}$/.test(mobileNumber);
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { username, email, mobileNumber = '', logoURL = '' } = await request.json();

    if (!username || !email) {
      return NextResponse.json({ error: 'Username and email are required' }, { status: 400 });
    }

    if (!validateUsername(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const normalizedMobile = String(mobileNumber || '').trim();
    if (normalizedMobile && !isValidMobileNumber(normalizedMobile)) {
      return NextResponse.json({ error: 'Invalid mobile number format' }, { status: 400 });
    }

    const normalizedUsername = username.toLowerCase();
    const normalizedEmail = email.toLowerCase();

    const existingUsername = await getUserByUsername(normalizedUsername);
    if (existingUsername && existingUsername.id !== payload.userId) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const existingEmail = await getUserByEmail(normalizedEmail);
    if (existingEmail && existingEmail.id !== payload.userId) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const updatedUser = await updateUser(payload.userId, {
      username: normalizedUsername,
      email: normalizedEmail,
      displayName: normalizedUsername,
      phone: normalizedMobile,
      photoCloudinaryId: logoURL || null,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: toPublicUser(updatedUser),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}