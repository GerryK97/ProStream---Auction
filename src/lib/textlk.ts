/**
 * text.lk SMS gateway client
 * API: https://app.text.lk/api/v3/
 * Auth: Bearer token (OAuth 2.0)
 */

const BASE = 'https://app.text.lk/api/v3';
const TOKEN = process.env.TEXTLK_API_TOKEN!;
const SENDER_ID = process.env.TEXTLK_SENDER_ID ?? 'ProStream';

export interface TextLKResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Normalise a Sri Lankan mobile number to international format.
 * Accepts: 077..., +9477..., 0094 77...
 */
export function normalizeMobile(raw: string): string {
  const digits = raw.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('0094')) return '+' + digits.slice(2);
  if (digits.startsWith('94') && digits.length >= 11) return '+' + digits;
  if (digits.startsWith('0') && digits.length === 10) return '+94' + digits.slice(1);
  return digits; // return as-is if unrecognised
}

/**
 * Send an SMS message via text.lk v3 API.
 */
export async function sendSMS(to: string, message: string): Promise<TextLKResult> {
  try {
    const res = await fetch(`${BASE}/sms/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        recipient: normalizeMobile(to),
        sender_id: SENDER_ID,
        message,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        error: json?.message ?? json?.error ?? `text.lk HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      messageId: json?.data?.id ? String(json.data.id) : undefined,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'SMS send failed' };
  }
}

/**
 * Generate a random numeric OTP string.
 */
export function generateOTP(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}
