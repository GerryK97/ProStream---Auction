import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { getUserById } from '@/lib/pg/user-queries';
import { pgDb } from '@/lib/pg/db';
import { phoneVerifications } from '@/lib/pg/users-schema';
import { sendSMS, generateOTP } from '@prostream/shared/sms';
import { normalizeMobile, isValidE164, maskPhone } from '@prostream/shared/phone';
import {
  createOtpRecord,
  getLatestOtpRecord,
  checkCooldown,
  OTP_EXPIRY_MINUTES,
  OTP_COOLDOWN_SECONDS,
} from '@prostream/shared/otp';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const user = await getUserById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const rawPhone = body.phone || user.phone;

    if (!rawPhone) {
      return NextResponse.json(
        { error: 'Mobile number is required. Please update your profile first.' },
        { status: 400 },
      );
    }

    const phone = normalizeMobile(rawPhone);
    if (!isValidE164(phone)) {
      return NextResponse.json({ error: 'Invalid mobile number format' }, { status: 400 });
    }

    // Cooldown check
    const recent = await getLatestOtpRecord(pgDb, phoneVerifications, payload.userId);
    const waitSecs = checkCooldown(recent, OTP_COOLDOWN_SECONDS);
    if (waitSecs > 0) {
      return NextResponse.json(
        { error: `Please wait ${waitSecs}s before requesting another OTP.` },
        { status: 429 },
      );
    }

    const otp = generateOTP(6);
    const otpHash = await hashPassword(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await createOtpRecord(pgDb, phoneVerifications, { userId: payload.userId, phone, otpHash, expiresAt });

    const smsResult = await sendSMS(
      phone,
      `Your ProStream verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`,
    );

    if (!smsResult.ok) {
      console.error('notify.lk SMS error:', smsResult.error);
      return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${maskPhone(phone)}`,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
