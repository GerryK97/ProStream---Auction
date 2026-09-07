import { NextRequest, NextResponse } from 'next/server';
import { eq, or } from 'drizzle-orm';
import { pgDb } from '@/lib/pg/db';
import { users, phoneVerifications } from '@/lib/pg/users-schema';
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

export const runtime = 'nodejs';

/**
 * POST /api/auth/otp-login/send   (NO auth token required)
 * Body: { phone }
 *
 * Sends a login OTP to a mobile that already belongs to a user. Mirrors the
 * Scoreboard route of the same name — they share the users and
 * phone_verifications tables, so a code sent from either surface verifies on
 * either surface. Does not reveal whether the number exists.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = normalizeMobile(body.phone ?? '');
    if (!isValidE164(phone)) {
      return NextResponse.json({ error: 'Invalid mobile number format' }, { status: 400 });
    }

    // Accept legacy pre-normalisation local-format numbers still on file.
    const legacyLocalPhone = phone.startsWith('+94') ? `0${phone.slice(3)}` : null;
    const legacyInternationalPhone = phone.startsWith('+94') ? phone.slice(1) : null;
    const user = await pgDb.query.users.findFirst({
      where: or(
        eq(users.phone, phone),
        ...(legacyLocalPhone ? [eq(users.phone, legacyLocalPhone)] : []),
        ...(legacyInternationalPhone ? [eq(users.phone, legacyInternationalPhone)] : []),
      ),
      orderBy: (u, { asc }) => [asc(u.createdAt)],
      columns: { id: true, status: true },
    });

    // Anti-enumeration: pretend success for unknown / suspended numbers.
    if (!user || user.status === 'Suspended') {
      return NextResponse.json({ success: true, sent: false, phone: maskPhone(phone) });
    }

    const recent = await getLatestOtpRecord(pgDb, phoneVerifications, user.id);
    const waitSecs = checkCooldown(recent, OTP_COOLDOWN_SECONDS);
    if (waitSecs > 0) {
      return NextResponse.json({ error: `Please wait ${waitSecs}s before requesting another OTP.` }, { status: 429 });
    }

    const otp = generateOTP(6);
    const otpHash = await hashPassword(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const smsResult = await sendSMS(
      phone,
      `Your ProStream login code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`,
    );
    if (!smsResult.ok) {
      console.error('Login OTP SMS error:', smsResult.error);
      return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 502 });
    }

    // Only persist a code once the SMS provider has accepted it for delivery.
    await createOtpRecord(pgDb, phoneVerifications, { userId: user.id, phone, otpHash, expiresAt });

    return NextResponse.json({ success: true, sent: true, phone: maskPhone(phone) });
  } catch (error) {
    console.error('Login OTP send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
