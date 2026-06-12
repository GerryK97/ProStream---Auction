import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { getUserById, updateUser, toPublicUser } from '@/lib/pg/user-queries';
import { pgDb } from '@/lib/pg/db';
import { phoneVerifications } from '@/lib/pg/users-schema';
import { normalizeMobile } from '@/lib/textlk';
import { comparePassword } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    // Auth
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const { otp, phone: rawPhone } = await request.json();

    if (!otp) return NextResponse.json({ error: 'OTP is required' }, { status: 400 });

    // Get the latest OTP record for this user
    const [record] = await pgDb
      .select()
      .from(phoneVerifications)
      .where(eq(phoneVerifications.userId, payload.userId))
      .orderBy(desc(phoneVerifications.createdAt))
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    // Already verified
    if (record.verifiedAt) {
      return NextResponse.json({ error: 'This OTP has already been used.' }, { status: 400 });
    }

    // Expired
    if (new Date() > new Date(record.expiresAt)) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Max attempts
    if (record.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Verify OTP
    const isValid = await comparePassword(String(otp).trim(), record.otpHash);

    if (!isValid) {
      // Increment attempts
      await pgDb
        .update(phoneVerifications)
        .set({ attempts: record.attempts + 1 })
        .where(eq(phoneVerifications.id, record.id));

      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      return NextResponse.json(
        { error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await pgDb
      .update(phoneVerifications)
      .set({ verifiedAt: new Date(), attempts: record.attempts + 1 })
      .where(eq(phoneVerifications.id, record.id));

    // Determine which phone to mark as verified:
    // Use the phone from the OTP record (what was actually verified)
    const verifiedPhone = rawPhone ? normalizeMobile(rawPhone) : record.phone;

    // Mark user's phone as verified in users table
    const updatedUser = await updateUser(payload.userId, {
      phone: verifiedPhone,
      phoneVerified: true,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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
