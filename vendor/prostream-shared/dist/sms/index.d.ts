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
export interface SmsSendResult {
    ok: boolean;
    messageId?: string;
    error?: string;
}
/**
 * Send an SMS via notify.lk API.
 *
 * @param to      Recipient phone — notify.lk expects format 9471XXXXXXX (no leading +)
 * @param message SMS body text (max 621 chars)
 * @param opts    Override credentials/senderId (useful for testing)
 */
export declare function sendSMS(to: string, message: string, opts?: {
    userId?: string;
    apiKey?: string;
    senderId?: string;
}): Promise<SmsSendResult>;
/**
 * Generate a random numeric OTP string of the given length (default 6).
 */
export declare function generateOTP(length?: number): string;
//# sourceMappingURL=index.d.ts.map