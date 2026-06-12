import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { updateUser, toPublicUser } from '@/lib/pg/user-queries';
import { pgDb } from '@/lib/pg/db';
import { phoneVerifications } from '@/lib/pg/users-schema';
import { normalizeMobile } from '@prostream/shared/phone';
import {
  getLatestOtpRecord,
  validateOtpRecord,
  incrementOtpAttempts,
  markOtpVerified,
  OTP_MAX_ATTEMPTS,
} from '@prostream/shared/otp';
import { comparePassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const { otp, phone: rawPhone } = await request.json();
    if (!otp) return NextResponse.json({ error: 'OTP is required' }, { status: 400 });

    const record = await getLatestOtpRecord(pgDb, phoneVerifications, payload.userId);
    const validationError = validateOtpRecord(record, OTP_MAX_ATTEMPTS);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const isValid = await comparePassword(String(otp).trim(), record!.otpHash);

    if (!isValid) {
      await incrementOtpAttempts(pgDb, phoneVerifications, record!.id, record!.attempts);
      const remaining = OTP_MAX_ATTEMPTS - (record!.attempts + 1);
      return NextResponse.json(
        { error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` },
        { status: 400 },
      );
    }

    await markOtpVerified(pgDb, phoneVerifications, record!.id, record!.attempts);

    const verifiedPhone = rawPhone ? normalizeMobile(rawPhone) : record!.phone;
    const updatedUser = await updateUser(payload.userId, {
      phone: verifiedPhone,
      phoneVerified: true,
    });

    if (!updatedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      message: 'Mobile number verified successfully.',
      user: toPublicUser(updatedUser),
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
