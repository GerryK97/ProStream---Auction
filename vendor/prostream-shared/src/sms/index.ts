/**
 * @prostream/shared — text.lk SMS gateway client
 *
 * API:  https://app.text.lk/api/v3/sms/send
 * Auth: Bearer token in Authorization header
 *
 * Credentials are read from environment variables:
 *   TEXTLK_API_TOKEN  — Bearer token from text.lk dashboard
 *   TEXTLK_SENDER_ID  — Approved Sender ID (e.g. "ProStream")
 *
 * Both ProStream Auction and ProStream Scoreboard reference this module.
 * Do not duplicate — update here and rebuild.
 */

const BASE = 'https://app.text.lk/api/v3/sms/send'

export interface SmsSendResult {
  ok: boolean
  messageId?: string
  error?: string
}

/**
 * Send an SMS via text.lk v3 API.
 *
 * @param to      Recipient phone in E.164 format (+94XXXXXXXXX) or 94XXXXXXXXX
 * @param message SMS body text
 * @param opts    Override credentials/senderId (useful for testing)
 */
export async function sendSMS(
  to: string,
  message: string,
  opts?: { apiToken?: string; senderId?: string },
): Promise<SmsSendResult> {
  const apiToken = opts?.apiToken ?? process.env.TEXTLK_API_TOKEN
  const senderId = opts?.senderId ?? process.env.TEXTLK_SENDER_ID ?? 'ProStream'

  if (!apiToken) {
    return { ok: false, error: 'TEXTLK_API_TOKEN is not set' }
  }

  // text.lk expects the number without a leading '+', e.g. 94772801110
  const recipient = to.startsWith('+') ? to.slice(1) : to

  try {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        recipient,
        sender_id: senderId,
        message,
      }),
    })

    const json = await res.json().catch(() => ({})) as {
      status?: string
      message?: string
      data?: { uid?: string; status?: string }
    }

    if (!res.ok || json.status !== 'success') {
      return {
        ok: false,
        error: json.message ?? `text.lk HTTP ${res.status}`,
      }
    }

    return { ok: true, messageId: json.data?.uid }
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
