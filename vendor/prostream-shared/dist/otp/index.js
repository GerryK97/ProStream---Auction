"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTP_LENGTH = exports.OTP_MAX_ATTEMPTS = exports.OTP_COOLDOWN_SECONDS = exports.OTP_EXPIRY_MINUTES = void 0;
exports.createOtpRecord = createOtpRecord;
exports.getLatestOtpRecord = getLatestOtpRecord;
exports.checkCooldown = checkCooldown;
exports.validateOtpRecord = validateOtpRecord;
exports.incrementOtpAttempts = incrementOtpAttempts;
exports.markOtpVerified = markOtpVerified;
const drizzle_orm_1 = require("drizzle-orm");
// ── Constants ────────────────────────────────────────────────────────────────
exports.OTP_EXPIRY_MINUTES = 10;
exports.OTP_COOLDOWN_SECONDS = 60;
exports.OTP_MAX_ATTEMPTS = 5;
exports.OTP_LENGTH = 6;
// ── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Insert a new OTP record into the database.
 */
async function createOtpRecord(db, table, params) {
    await db.insert(table).values({
        userId: params.userId,
        phone: params.phone,
        otpHash: params.otpHash,
        expiresAt: params.expiresAt,
    });
}
/**
 * Fetch the most recent OTP record for a user.
 */
async function getLatestOtpRecord(db, table, userId) {
    const rows = await db
        .select()
        .from(table)
        .where((0, drizzle_orm_1.eq)(table.userId, userId))
        .orderBy((0, drizzle_orm_1.desc)(table.createdAt))
        .limit(1);
    return rows[0] ?? null;
}
/**
 * Check cooldown: returns seconds remaining (0 = no cooldown active).
 */
function checkCooldown(record, cooldownSeconds = exports.OTP_COOLDOWN_SECONDS) {
    if (!record)
        return 0;
    const elapsed = (Date.now() - new Date(record.createdAt).getTime()) / 1000;
    const remaining = cooldownSeconds - elapsed;
    return remaining > 0 ? Math.ceil(remaining) : 0;
}
/**
 * Validate a fetched OTP record for common error cases.
 * Returns an error string or null if all checks pass.
 */
function validateOtpRecord(record, maxAttempts = exports.OTP_MAX_ATTEMPTS) {
    if (!record)
        return 'No OTP found. Please request a new one.';
    if (record.verifiedAt)
        return 'This OTP has already been used.';
    if (new Date() > new Date(record.expiresAt))
        return 'OTP has expired. Please request a new one.';
    if (record.attempts >= maxAttempts)
        return 'Too many incorrect attempts. Please request a new OTP.';
    return null;
}
/**
 * Increment the attempt counter on a record after a failed attempt.
 */
async function incrementOtpAttempts(db, table, recordId, currentAttempts) {
    await db
        .update(table)
        .set({ attempts: currentAttempts + 1 })
        .where((0, drizzle_orm_1.eq)(table.id, recordId));
}
/**
 * Mark an OTP record as verified (sets verifiedAt = now).
 */
async function markOtpVerified(db, table, recordId, currentAttempts) {
    await db
        .update(table)
        .set({ verifiedAt: new Date(), attempts: currentAttempts + 1 })
        .where((0, drizzle_orm_1.eq)(table.id, recordId));
}
//# sourceMappingURL=index.js.map