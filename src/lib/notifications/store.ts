import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { pgDb } from '@/lib/pg/db';
import { notifications, users, type PgNotification } from '@/lib/pg/users-schema';

export type NotificationInput = {
  userId: string;
  type?: string;
  title: string;
  body: string;
  /** Any JSON-serialisable payload; stored as text. */
  data?: unknown;
};

/** Insert a single notification. */
export async function createNotification(input: NotificationInput): Promise<PgNotification> {
  const [row] = await pgDb
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type ?? 'system',
      title: input.title,
      body: input.body,
      data: input.data != null ? JSON.stringify(input.data) : null,
    })
    .returning();
  return row;
}

/** Insert the same notification for many users (e.g. all admins). */
export async function createNotificationForUsers(
  userIds: string[],
  input: Omit<NotificationInput, 'userId'>,
): Promise<number> {
  if (userIds.length === 0) return 0;
  const dataStr = input.data != null ? JSON.stringify(input.data) : null;
  const rows = await pgDb
    .insert(notifications)
    .values(
      userIds.map((userId) => ({
        userId,
        type: input.type ?? 'system',
        title: input.title,
        body: input.body,
        data: dataStr,
      })),
    )
    .returning({ id: notifications.id });
  return rows.length;
}

/** Fan a notification out to every user with the given role. Returns count. */
export async function createNotificationForRole(
  role: string,
  input: Omit<NotificationInput, 'userId'>,
): Promise<number> {
  const targets = await pgDb.select({ id: users.id }).from(users).where(eq(users.role, role as any));
  return createNotificationForUsers(targets.map((u) => u.id), input);
}

export type NotificationDTO = {
  id: number;
  type: string;
  title: string;
  body: string;
  data: unknown;
  read: boolean;
  createdAt: string;
};

function toDTO(row: PgNotification): NotificationDTO {
  let data: unknown = null;
  if (row.data) {
    try { data = JSON.parse(row.data); } catch { data = row.data; }
  }
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data,
    read: row.readAt != null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** List a user's notifications (newest first) plus their unread count. */
export async function listNotifications(
  userId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ items: NotificationDTO[]; unread: number; total: number }> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  const rows = await pgDb
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.id))
    .limit(limit)
    .offset(offset);

  const [{ unread } = { unread: 0 }] = await pgDb
    .select({ unread: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

  const [{ total } = { total: 0 }] = await pgDb
    .select({ total: sql<number>`count(*)::int` })
    .from(notifications)
    .where(eq(notifications.userId, userId));

  return {
    items: rows.map(toDTO),
    unread: Number(unread) || 0,
    total: Number(total) || 0,
  };
}

/** Unread count only (cheap, for the badge). */
export async function unreadCount(userId: string): Promise<number> {
  const [{ unread } = { unread: 0 }] = await pgDb
    .select({ unread: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return Number(unread) || 0;
}

/** Mark specific notifications (or all) as read for a user. Returns count updated. */
export async function markRead(
  userId: string,
  ids?: number[],
): Promise<number> {
  const now = new Date();
  if (ids && ids.length > 0) {
    const rows = await pgDb
      .update(notifications)
      .set({ readAt: now })
      .where(and(
        eq(notifications.userId, userId),
        inArray(notifications.id, ids),
        isNull(notifications.readAt),
      ))
      .returning({ id: notifications.id });
    return rows.length;
  }
  const rows = await pgDb
    .update(notifications)
    .set({ readAt: now })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });
  return rows.length;
}
