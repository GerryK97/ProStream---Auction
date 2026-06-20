/**
 * @prostream/shared — OTP verification business logic
 *
 * Database-agnostic: accepts a Drizzle table reference and a db instance
 * so it works with both ProStream Auction (pgDb) and Scoreboard (db)
 * without coupling to either project's schema file.
 *
 * Usage:
 *
 *   // In your API route:
 *   import { createOtpRecord, verifyOtpRecord, OtpTable } from '@prostream/shared/otp'
 *   import { phoneVerifications } from '@/lib/db/schema'   // your local schema
 *   import { db } from '@/lib/db'
 *
 *   await createOtpRecord(db, phoneVerifications, { userId, phone, otpHash, expiresAt })
 *   const result = await verifyOtpRecord(db, phoneVerifications, { userId, otpHash: inputHash })
 */
export interface OtpRow {
    id: number;
    userId: string;
    phone: string;
    otpHash: string;
    attempts: number;
    expiresAt: Date;
    verifiedAt: Date | null;
    createdAt: Date;
}
/**
 * Minimal shape of the phone_verifications table we need.
 * Both apps export a table matching this shape.
 */
export type OtpTable = {
    id: any;
    userId: any;
    phone: any;
    otpHash: any;
    attempts: any;
    expiresAt: any;
    verifiedAt: any;
    createdAt: any;
};
export interface CreateOtpParams {
    userId: string;
    phone: string;
    otpHash: string;
    expiresAt: Date;
}
export interface VerifyOtpParams {
    userId: string;
    /** bcrypt.compare result — pass the boolean from your route */
    isValid: boolean;
    recordId: number;
    currentAttempts: number;
    maxAttempts?: number;
}
export interface VerifyOtpResult {
    ok: boolean;
    error?: string;
    attemptsRemaining?: number;
}
export declare const OTP_EXPIRY_MINUTES = 10;
export declare const OTP_COOLDOWN_SECONDS = 60;
export declare const OTP_MAX_ATTEMPTS = 5;
export declare const OTP_LENGTH = 6;
/**
 * Insert a new OTP record into the database.
 */
export declare function createOtpRecord(db: any, table: OtpTable, params: CreateOtpParams): Promise<void>;
/**
 * Fetch the most recent OTP record for a user.
 */
export declare function getLatestOtpRecord(db: any, table: OtpTable, userId: string): Promise<OtpRow | null>;
/**
 * Check cooldown: returns seconds remaining (0 = no cooldown active).
 */
export declare function checkCooldown(record: OtpRow | null, cooldownSeconds?: number): number;
/**
 * Validate a fetched OTP record for common error cases.
 * Returns an error string or null if all checks pass.
 */
export declare function validateOtpRecord(record: OtpRow | null, maxAttempts?: number): string | null;
/**
 * Increment the attempt counter on a record after a failed attempt.
 */
export declare function incrementOtpAttempts(db: any, table: OtpTable, recordId: number, currentAttempts: number): Promise<void>;
/**
 * Mark an OTP record as verified (sets verifiedAt = now).
 */
export declare function markOtpVerified(db: any, table: OtpTable, recordId: number, currentAttempts: number): Promise<void>;
//# sourceMappingURL=index.d.ts.map