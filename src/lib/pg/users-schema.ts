import { sql } from 'drizzle-orm';
import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['Admin', 'Tournament', 'Player', 'Audience']);
export const userStatusEnum = pgEnum('user_status', ['Active', 'PendingApproval', 'Suspended']);
export const userPlanEnum = pgEnum('user_plan', ['Free', 'Standard', 'Offer']);
export const transactionTypeEnum = pgEnum('transaction_type', ['topup', 'deduction']);

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    username: varchar('username', { length: 50 }).notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name').notNull(),
    role: userRoleEnum('role').notNull().default('Audience'),
    status: userStatusEnum('status').notNull().default('Active'),
    plan: userPlanEnum('plan').notNull().default('Free'),
    phone: varchar('phone', { length: 20 }),
    phoneVerified: boolean('phone_verified').notNull().default(false),
    photoCloudinaryId: text('photo_cloudinary_id'),
    assignedTournaments: text('assigned_tournaments').array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: uniqueIndex('users_username_idx').on(table.username),
    emailIdx: uniqueIndex('users_email_idx').on(sql`lower(${table.email})`),
  }),
);

export type PgUser = typeof users.$inferSelect;
export type NewPgUser = typeof users.$inferInsert;

export const wallets = pgTable('wallets', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  balance: integer('balance').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: serial('id').primaryKey(),
  walletId: integer('wallet_id')
    .notNull()
    .references(() => wallets.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum('type').notNull(),
  amount: integer('amount').notNull(),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  description: text('description').notNull(),
  referenceId: integer('reference_id'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pricingConfig = pgTable('pricing_config', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 64 }).notNull().unique(),
  value: integer('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type PgWallet = typeof wallets.$inferSelect;
export type PgWalletTransaction = typeof walletTransactions.$inferSelect;
export type PgPricingConfig = typeof pricingConfig.$inferSelect;

/* ── Device push tokens ─────────────────────────────────────────────────── */
export const devicePushTokens = pgTable(
  'device_push_tokens',
  {
    id:             serial('id').primaryKey(),
    userId:         text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expoPushToken:  text('expo_push_token').notNull(),
    platform:       varchar('platform', { length: 16 }).notNull().default('android'),
    deviceId:       text('device_id'),
    createdAt:      timestamp('created_at').defaultNow().notNull(),
    updatedAt:      timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex('device_push_tokens_token_idx').on(table.expoPushToken),
  }),
);

export type PgDevicePushToken = typeof devicePushTokens.$inferSelect;

/* ── Phone OTP Verifications ─────────────────────────────────────────────── */
export const phoneVerifications = pgTable('phone_verifications', {
  id:         serial('id').primaryKey(),
  userId:     text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  phone:      varchar('phone', { length: 20 }).notNull(),
  otpHash:    text('otp_hash').notNull(),          // bcrypt hash of OTP
  attempts:   integer('attempts').notNull().default(0),
  expiresAt:  timestamp('expires_at').notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
});

export type PgPhoneVerification = typeof phoneVerifications.$inferSelect;
