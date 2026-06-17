import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, comparePassword, hashPassword } from '@/lib/auth';
import { getUserById, setUserPassword } from '@/lib/pg/user-queries';
import { pgDb } from '@/lib/pg/db';
import { phoneVerifications } from '@/lib/pg/users-schema';
import {
  getLatestOtpRecord,
  validateOtpRecord,
  incrementOtpAttempts,
  markOtpVerified,
  OTP_MAX_ATTEMPTS,
} from '@prostream/shared/otp';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { currentPassword, newPassword, otp } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If the user has a verified phone, require OTP confirmation
    if (user.phoneVerified) {
      if (!otp) {
        return NextResponse.json(
          { error: 'OTP is required to change your password. Please verify via SMS first.', requiresOtp: true },
          { status: 400 },
        );
      }

      const record = await getLatestOtpRecord(pgDb, phoneVerifications, payload.userId);
      const validationError = validateOtpRecord(record, OTP_MAX_ATTEMPTS);
      if (validationError) {
        return NextResponse.json({ error: validationError, requiresOtp: true }, { status: 400 });
      }

      const isValidOtp = await comparePassword(String(otp).trim(), record!.otpHash);
      if (!isValidOtp) {
        await incrementOtpAttempts(pgDb, phoneVerifications, record!.id, record!.attempts);
        const remaining = OTP_MAX_ATTEMPTS - (record!.attempts + 1);
        return NextResponse.json(
          { error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`, requiresOtp: true },
          { status: 400 },
        );
      }

      // Mark OTP used so it can't be reused
      await markOtpVerified(pgDb, phoneVerifications, record!.id, record!.attempts);
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password must differ from current password' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await setUserPassword(payload.userId, newHash);

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}