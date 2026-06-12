/**
 * @prostream/shared — text.lk SMS gateway client
 *
 * API:  https://app.text.lk/api/v3/
 * Auth: Bearer token (OAuth 2.0)
 *
 * Credentials are read from environment variables:
 *   TEXTLK_API_TOKEN   — OAuth token from text.lk dashboard
 *   TEXTLK_SENDER_ID   — Approved sender ID (default: "ProStream")
 *
 * Both ProStream Auction and ProStream Scoreboard reference this module.
 * Do not duplicate — update here and rebuild.
 */

const BASE = 'https://app.text.lk/api/v3'

export interface SmsSendResult {
  ok: boolean
  messageId?: string
  error?: string
}

/**
 * Send an SMS via text.lk v3 API.
 *
 * @param to      Recipient phone in E.164 format (e.g. +94771234567)
 * @param message SMS body text
 * @param opts    Override token/senderId (useful for testing)
 */
export async function sendSMS(
  to: string,
  message: string,
  opts?: { token?: string; senderId?: string },
): Promise<SmsSendResult> {
  const token = opts?.token ?? process.env.TEXTLK_API_TOKEN
  const senderId = opts?.senderId ?? process.env.TEXTLK_SENDER_ID ?? 'ProStream'

  if (!token) {
    return { ok: false, error: 'TEXTLK_API_TOKEN is not set' }
  }

  try {
    const res = await fetch(`${BASE}/sms/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        recipient: to,
        sender_id: senderId,
        message,
      }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        ok: false,
        error: (json as any)?.message ?? (json as any)?.error ?? `text.lk HTTP ${res.status}`,
      }
    }

    return {
      ok: true,
      messageId: (json as any)?.data?.id ? String((json as any).data.id) : undefined,
    }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'SMS send failed' }
  }
}

/**
 * Generate a random numeric OTP string of the given length (default 6).
 */
export function generateOTP(length = 6): string {
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString()
  }
  return otp
}
