import { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { UserRole } from '@/lib/permissions';
import { getUserById } from '@/lib/pg/user-queries';

/**
 * Extracted user information from authenticated request
 */
export interface RequestUser {
  userId: string;
  role: UserRole;
  assignedTournaments: string[];
  plan: 'Free' | 'Standard' | 'Offer';
}

/**
 * Extract authenticated user from request JWT token
 * Fetches current role/access data from Postgres so JWT access claims cannot go stale.
 */
export async function getUserFromRequest(request: NextRequest): Promise<RequestUser | null> {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    // Always load the latest role/plan/tournament assignments from Postgres.
    // JWTs live for 7 days and include assignedTournaments for bootstrapping,
    // so relying on the token makes newly-created/granted tournaments invisible
    // until the user logs out/in. This keeps access changes immediately visible
    // on web and Expo without forcing a fresh login.
    const user = await getUserById(payload.userId);
    if (!user) return null;

    return {
      userId: payload.userId,
      role: user.role as UserRole,
      assignedTournaments: user.assignedTournaments || [],
      plan: user.plan || 'Free',
    };
  } catch (error) {
    console.error('Error extracting user from request:', error);
    return null;
  }
}

/**
 * Check if user is authenticated from request
 * Returns boolean without throwing
 */
export async function isAuthenticatedRequest(request: NextRequest): Promise<boolean> {
  const user = await getUserFromRequest(request);
  return user !== null;
}