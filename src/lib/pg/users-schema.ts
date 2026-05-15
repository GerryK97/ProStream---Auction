import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['Admin', 'Tournament', 'Player', 'Audience']);
export const userStatusEnum = pgEnum('user_status', ['Active', 'PendingApproval', 'Suspended']);
export const userPlanEnum = pgEnum('user_plan', ['Free', 'Standard', 'Offer']);

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