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

import { eq, desc } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

// ── Types ────────────────────────────────────────────────────────────────────

export interface OtpRow {
  id: number
  userId: string
  phone: string
  otpHash: string
  attempts: number
  expiresAt: Date
  verifiedAt: Date | null
  createdAt: Date
}

/**
 * Minimal shape of the phone_verifications table we need.
 * Both apps export a table matching this shape.
 */
export type OtpTable = {
  id: any
  userId: any
  phone: any
  otpHash: any
  attempts: any
  expiresAt: any
  verifiedAt: any
  createdAt: any
}

export interface CreateOtpParams {
  userId: string
  phone: string
  otpHash: string
  expiresAt: Date
}

export interface VerifyOtpParams {
  userId: string
  /** bcrypt.compare result — pass the boolean from your route */
  isValid: boolean
  recordId: number
  currentAttempts: number
  maxAttempts?: number
}

export interface VerifyOtpResult {
  ok: boolean
  error?: string
  attemptsRemaining?: number
}

// ── Constants ────────────────────────────────────────────────────────────────

export const OTP_EXPIRY_MINUTES = 10
export const OTP_COOLDOWN_SECONDS = 60
export const OTP_MAX_ATTEMPTS = 5
export const OTP_LENGTH = 6

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Insert a new OTP record into the database.
 */
export async function createOtpRecord(
  db: any,
  table: OtpTable,
  params: CreateOtpParams,
): Promise<void> {
  await db.insert(table).values({
    userId: params.userId,
    phone: params.phone,
    otpHash: params.otpHash,
    expiresAt: params.expiresAt,
  })
}

/**
 * Fetch the most recent OTP record for a user.
 */
export async function getLatestOtpRecord(
  db: any,
  table: OtpTable,
  userId: string,
): Promise<OtpRow | null> {
  const rows = await db
    .select()
    .from(table)
    .where(eq(table.userId, userId))
    .orderBy(desc(table.createdAt))
    .limit(1)

  return (rows[0] as OtpRow) ?? null
}

/**
 * Check cooldown: returns seconds remaining (0 = no cooldown active).
 */
export function checkCooldown(record: OtpRow | null, cooldownSeconds = OTP_COOLDOWN_SECONDS): number {
  if (!record) return 0
  const elapsed = (Date.now() - new Date(record.createdAt).getTime()) / 1000
  const remaining = cooldownSeconds - elapsed
  return remaining > 0 ? Math.ceil(remaining) : 0
}

/**
 * Validate a fetched OTP record for common error cases.
 * Returns an error string or null if all checks pass.
 */
export function validateOtpRecord(
  record: OtpRow | null,
  maxAttempts = OTP_MAX_ATTEMPTS,
): string | null {
  if (!record) return 'No OTP found. Please request a new one.'
  if (record.verifiedAt) return 'This OTP has already been used.'
  if (new Date() > new Date(record.expiresAt)) return 'OTP has expired. Please request a new one.'
  if (record.attempts >= maxAttempts) return 'Too many incorrect attempts. Please request a new OTP.'
  return null
}

/**
 * Increment the attempt counter on a record after a failed attempt.
 */
export async function incrementOtpAttempts(
  db: any,
  table: OtpTable,
  recordId: number,
  currentAttempts: number,
): Promise<void> {
  await db
    .update(table)
    .set({ attempts: currentAttempts + 1 })
    .where(eq(table.id, recordId))
}

/**
 * Mark an OTP record as verified (sets verifiedAt = now).
 */
export async function markOtpVerified(
  db: any,
  table: OtpTable,
  recordId: number,
  currentAttempts: number,
): Promise<void> {
  await db
    .update(table)
    .set({ verifiedAt: new Date(), attempts: currentAttempts + 1 })
    .where(eq(table.id, recordId))
}
