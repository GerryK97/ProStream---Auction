import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { getUserById } from '@/lib/pg/user-queries';
import { pgDb } from '@/lib/pg/db';
import { phoneVerifications } from '@/lib/pg/users-schema';
import { generateOTP, normalizeMobile, sendSMS } from '@/lib/textlk';
import { hashPassword } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

const OTP_EXPIRY_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 60; // prevent spam — 1 request per minute per user

export async function POST(request: NextRequest) {
  try {
    // Auth
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const user = await getUserById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Get phone from request body (or fall back to user's saved phone)
    const body = await request.json().catch(() => ({}));
    const rawPhone = body.phone || user.phone;

    if (!rawPhone) {
      return NextResponse.json(
        { error: 'Mobile number is required. Please update your profile first.' },
        { status: 400 }
      );
    }

    const phone = normalizeMobile(rawPhone);
    if (!/^\+[1-9]\d{6,19}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid mobile number format' }, { status: 400 });
    }

    // Cooldown check — prevent OTP spam
    const recent = await pgDb
      .select()
      .from(phoneVerifications)
      .where(eq(phoneVerifications.userId, payload.userId))
      .orderBy(desc(phoneVerifications.createdAt))
      .limit(1);

    if (recent.length > 0) {
      const secondsAgo = (Date.now() - new Date(recent[0].createdAt).getTime()) / 1000;
      if (secondsAgo < OTP_COOLDOWN_SECONDS) {
        const waitSecs = Math.ceil(OTP_COOLDOWN_SECONDS - secondsAgo);
        return NextResponse.json(
          { error: `Please wait ${waitSecs}s before requesting another OTP.` },
          { status: 429 }
        );
      }
    }

    // Generate OTP and hash it
    const otp = generateOTP(6);
    const otpHash = await hashPassword(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store in DB (invalidates any previous entry implicitly via latest-row logic on verify)
    await pgDb.insert(phoneVerifications).values({
      userId: payload.userId,
      phone,
      otpHash,
      expiresAt,
    });

    // Send SMS
    const smsResult = await sendSMS(
      phone,
      `Your ProStream verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`
    );

    if (!smsResult.ok) {
      console.error('text.lk SMS error:', smsResult.error);
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${phone.slice(0, 4)}****${phone.slice(-3)}`,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
