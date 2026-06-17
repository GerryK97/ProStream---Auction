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
export interface SmsSendResult {
    ok: boolean;
    messageId?: string;
    error?: string;
}
/**
 * Send an SMS via text.lk v3 API.
 *
 * @param to      Recipient phone in E.164 format (+94XXXXXXXXX) or 94XXXXXXXXX
 * @param message SMS body text
 * @param opts    Override credentials/senderId (useful for testing)
 */
export declare function sendSMS(to: string, message: string, opts?: {
    apiToken?: string;
    senderId?: string;
}): Promise<SmsSendResult>;
/**
 * Generate a random numeric OTP string of the given length (default 6).
 */
export declare function generateOTP(length?: number): string;
//# sourceMappingURL=index.d.ts.map