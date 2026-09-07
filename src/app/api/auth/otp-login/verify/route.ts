import { NextRequest, NextResponse } from 'next/server';
import { eq, or } from 'drizzle-orm';
import { pgDb } from '@/lib/pg/db';
import { users, phoneVerifications } from '@/lib/pg/users-schema';
import { normalizeMobile, isValidE164 } from '@prostream/shared/phone';
import {
  getLatestOtpRecord,
  validateOtpRecord,
  incrementOtpAttempts,
  markOtpVerified,
  OTP_MAX_ATTEMPTS,
} from '@prostream/shared/otp';
import { comparePassword, generateToken } from '@/lib/auth';
import { toAuctionUser, toPublicUser } from '@/lib/pg/user-queries';

export const runtime = 'nodejs';

/**
 * POST /api/auth/otp-login/verify   (NO auth token required)
 * Body: { phone, otp }
 *
 * Verifies a login OTP for a phone and, on success, issues the same bearer
 * token as password login. Mirrors Scoreboard's route of the same name.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = normalizeMobile(body.phone ?? '');
    const otp = String(body.otp ?? '').trim();

    if (!isValidE164(phone)) return NextResponse.json({ error: 'Invalid mobile number format' }, { status: 400 });
    if (!otp) return NextResponse.json({ error: 'OTP is required' }, { status: 400 });

    const legacyLocalPhone = phone.startsWith('+94') ? `0${phone.slice(3)}` : null;
    const legacyInternationalPhone = phone.startsWith('+94') ? phone.slice(1) : null;
    const user = await pgDb.query.users.findFirst({
      where: or(
        eq(users.phone, phone),
        ...(legacyLocalPhone ? [eq(users.phone, legacyLocalPhone)] : []),
        ...(legacyInternationalPhone ? [eq(users.phone, legacyInternationalPhone)] : []),
      ),
      orderBy: (u, { asc }) => [asc(u.createdAt)],
    });
    if (!user) return NextResponse.json({ error: 'Invalid code or number' }, { status: 401 });
    if (user.status === 'Suspended') return NextResponse.json({ error: 'Account has been suspended' }, { status: 403 });

    const record = await getLatestOtpRecord(pgDb, phoneVerifications, user.id);
    const validationError = validateOtpRecord(record, OTP_MAX_ATTEMPTS);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const isValid = await comparePassword(otp, record!.otpHash);
    if (!isValid) {
      await incrementOtpAttempts(pgDb, phoneVerifications, record!.id, record!.attempts);
      const remaining = OTP_MAX_ATTEMPTS - (record!.attempts + 1);
      return NextResponse.json(
        { error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` },
        { status: 400 },
      );
    }

    await markOtpVerified(pgDb, phoneVerifications, record!.id, record!.attempts);

    const [updated] = await pgDb
      .update(users)
      .set({ phoneVerified: true, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();

    const token = generateToken(toAuctionUser(updated));

    const response = NextResponse.json({ success: true, token, user: toPublicUser(updated) });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Login OTP verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
