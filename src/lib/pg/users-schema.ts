import { sql } from 'drizzle-orm';
import { boolean, index, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['Admin', 'Operator', 'Player', 'Audience', 'Scorer']);
export const userStatusEnum = pgEnum('user_status', ['Active', 'PendingApproval', 'Suspended']);
export const userPlanEnum = pgEnum('user_plan', ['Free', 'Standard', 'Offer']);
export const transactionTypeEnum = pgEnum('transaction_type', ['topup', 'deduction']);
// Semantic category layered on top of `type`. `paid_recharge` = cash collected
// from a customer (revenue), `free_credit` = admin promo credit (not revenue),
// `overlay_charge` = a deduction for overlay/session usage.
export const transactionCategoryEnum = pgEnum('transaction_category', [
  'paid_recharge',
  'free_credit',
  'overlay_charge',
]);

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
    // Per-user capability grant: allow this user to take paid wallet recharges
    // for any user and view the Accounts ledger, without granting full Admin.
    // Checked per request (the JWT is minted for 7 days and cannot carry it).
    canRechargeWallet: boolean('can_recharge_wallet').notNull().default(false),
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
  // Nullable during backfill; new rows always set it. See transactionCategoryEnum.
  category: transactionCategoryEnum('category'),
  amount: integer('amount').notNull(),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  description: text('description').notNull(),
  referenceId: integer('reference_id'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  categoryCreatedIdx: index('wallet_tx_category_created_idx').on(table.category, table.createdAt),
}));

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

/* ── In-app Notifications (persistent inbox) ─────────────────────────────── */
export const notifications = pgTable(
  'notifications',
  {
    id:        serial('id').primaryKey(),
    userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // Free-form category, e.g. 'player_request', 'admin_broadcast', 'system'.
    type:      varchar('type', { length: 40 }).notNull().default('system'),
    title:     text('title').notNull(),
    body:      text('body').notNull(),
    // Optional structured payload (deep-link target, entity ids, etc.).
    data:      text('data'),
    readAt:    timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx:     uniqueIndex('notifications_user_created_idx').on(table.userId, table.id),
  }),
);

export type PgNotification = typeof notifications.$inferSelect;
export type PgNewNotification = typeof notifications.$inferInsert;

/* ── App config (singleton key/value; e.g. version gating) ───────────────── */
export const appConfig = pgTable('app_config', {
  key:       varchar('key', { length: 64 }).primaryKey(),
  value:     text('value'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type PgAppConfig = typeof appConfig.$inferSelect;

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
