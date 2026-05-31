import { and, count, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { pgDb } from './db';
import { users, type NewPgUser, type PgUser } from './users-schema';

export type UserRole = 'Admin' | 'Tournament' | 'Player' | 'Audience';
export type UserStatus = 'Active' | 'PendingApproval' | 'Suspended';
export type UserPlan = 'Free' | 'Standard' | 'Offer';

export type AuctionUser = {
  _id: string;
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  plan: UserPlan;
  logoURL: string;
  mobileNumber: string;
  assignedTournaments: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type PublicAuctionUser = Omit<AuctionUser, 'passwordHash'>;

export function generateUserId() {
  return `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toAuctionUser(user: PgUser): AuctionUser {
  return {
    _id: user.id,
    id: user.id,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    plan: user.plan,
    logoURL: user.photoCloudinaryId ?? '',   // stored as full URL in this column
    mobileNumber: user.phone ?? '',
    assignedTournaments: user.assignedTournaments ?? [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toPublicUser(user: PgUser): PublicAuctionUser {
  const { passwordHash: _passwordHash, ...publicUser } = toAuctionUser(user);
  return publicUser;
}

export async function getUserByUsername(username: string) {
  return pgDb.query.users.findFirst({
    where: eq(users.username, username.trim().toLowerCase()),
  });
}

export async function getUserByEmail(email: string) {
  return pgDb.query.users.findFirst({
    where: eq(users.email, email.trim().toLowerCase()),
  });
}

export async function getUserById(id: string) {
  return pgDb.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function getUsersByIds(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return [];
  return pgDb.select().from(users).where(inArray(users.id, uniqueIds));
}

export async function createUser(data: Omit<NewPgUser, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const [created] = await pgDb
    .insert(users)
    .values({
      id: data.id ?? generateUserId(),
      username: data.username.trim().toLowerCase(),
      email: data.email.trim().toLowerCase(),
      passwordHash: data.passwordHash,
      displayName: data.displayName || data.username.trim().toLowerCase(),
      role: data.role ?? 'Audience',
      status: data.status ?? 'Active',
      plan: data.plan ?? 'Free',
      phone: data.phone ?? null,
      photoCloudinaryId: data.photoCloudinaryId ?? null,
      assignedTournaments: data.assignedTournaments ?? [],
    })
    .returning();

  return created;
}

export async function updateUser(id: string, patch: Partial<Omit<NewPgUser, 'id' | 'createdAt'>>) {
  const cleanPatch = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as Partial<Omit<NewPgUser, 'id' | 'createdAt'>>;

  const [updated] = await pgDb
    .update(users)
    .set({ ...cleanPatch, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteUser(id: string) {
  const [deleted] = await pgDb.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  return deleted !== undefined;
}

export async function listUsers({
  status,
  role,
  page = 1,
  limit = 20,
}: {
  status?: string | null;
  role?: string | null;
  page?: number;
  limit?: number;
}) {
  const conditions: SQL[] = [];
  if (status) conditions.push(eq(users.status, status as UserStatus));
  if (role) conditions.push(eq(users.role, role as UserRole));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = Math.max(0, page - 1) * limit;

  const totalRows = where
    ? await pgDb.select({ value: count() }).from(users).where(where)
    : await pgDb.select({ value: count() }).from(users);

  const rows = where
    ? await pgDb.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset(offset)
    : await pgDb.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);

  return {
    rows,
    total: totalRows[0]?.value ?? 0,
  };
}

export async function listUsersByAssignedTournament(tournamentId: string) {
  return pgDb
    .select()
    .from(users)
    .where(sql`${tournamentId} = ANY(${users.assignedTournaments}) AND ${users.role} <> 'Admin'`)
    .orderBy(desc(users.createdAt));
}

export async function setUserStatus(id: string, status: UserStatus) {
  return updateUser(id, { status });
}

export async function setUserPassword(id: string, passwordHash: string) {
  return updateUser(id, { passwordHash });
}

export async function addAssignedTournament(userId: string, tournamentId: string) {
  const [updated] = await pgDb
    .update(users)
    .set({
      assignedTournaments: sql`
        CASE
          WHEN ${tournamentId} = ANY(${users.assignedTournaments}) THEN ${users.assignedTournaments}
          ELSE array_append(${users.assignedTournaments}, ${tournamentId})
        END
      `,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return updated ?? null;
}

export async function removeAssignedTournament(userId: string, tournamentId: string) {
  const [updated] = await pgDb
    .update(users)
    .set({
      assignedTournaments: sql`array_remove(${users.assignedTournaments}, ${tournamentId})`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return updated ?? null;
}

export async function getAssignedTournaments(userId: string) {
  const user = await getUserById(userId);
  return user?.assignedTournaments ?? [];
}