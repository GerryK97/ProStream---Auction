"use strict";
/**
 * @prostream/shared — notify.lk SMS gateway client
 *
 * API:  https://app.notify.lk/api/v1/send
 * Auth: user_id + api_key query parameters
 *
 * Credentials are read from environment variables:
 *   NOTIFYLK_USER_ID   — User ID from notify.lk settings page
 *   NOTIFYLK_API_KEY   — API key from notify.lk settings page
 *   NOTIFYLK_SENDER_ID — Approved Sender ID (default: "NotifyDEMO" for dev)
 *
 * Both ProStream Auction and ProStream Scoreboard reference this module.
 * Do not duplicate — update here and rebuild.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMS = sendSMS;
exports.generateOTP = generateOTP;
const BASE = 'https://app.notify.lk/api/v1/send';
/**
 * Send an SMS via notify.lk API.
 *
 * @param to      Recipient phone — notify.lk expects format 9471XXXXXXX (no leading +)
 * @param message SMS body text (max 621 chars)
 * @param opts    Override credentials/senderId (useful for testing)
 */
async function sendSMS(to, message, opts) {
    const userId = opts?.userId ?? process.env.NOTIFYLK_USER_ID;
    const apiKey = opts?.apiKey ?? process.env.NOTIFYLK_API_KEY;
    const senderId = opts?.senderId ?? process.env.NOTIFYLK_SENDER_ID ?? 'NotifyDEMO';
    if (!userId || !apiKey) {
        return { ok: false, error: 'NOTIFYLK_USER_ID or NOTIFYLK_API_KEY is not set' };
    }
    // notify.lk expects the number without a leading '+', e.g. 94771234567
    const recipient = to.startsWith('+') ? to.slice(1) : to;
    const url = new URL(BASE);
    url.searchParams.set('user_id', userId);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('sender_id', senderId);
    url.searchParams.set('to', recipient);
    url.searchParams.set('message', message);
    try {
        const res = await fetch(url.toString(), { method: 'GET' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.status !== 'success') {
            return {
                ok: false,
                error: json.message ?? json.data ?? `notify.lk HTTP ${res.status}`,
            };
        }
        return { ok: true };
    }
    catch (err) {
        return { ok: false, error: err?.message ?? 'SMS send failed' };
    }
}
/**
 * Generate a random numeric OTP string of the given length (default 6).
 */
function generateOTP(length = 6) {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
}
//# sourceMappingURL=index.js.map