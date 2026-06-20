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

// ── In-process user cache ────────────────────────────────────────────────────
// Neon Postgres adds 50–200ms per serverless cold call. User roles/plans change
// at most a few times per year, so caching for 60 seconds is safe and
// eliminates the auth round-trip from every bid, sell, select, and settings call.
// For immediate role changes (admin promotion), call invalidateUserCache(userId).
interface CacheEntry { data: RequestUser; expiresAt: number }
const _userCache = new Map<string, CacheEntry>();
const USER_CACHE_TTL_MS = 60_000; // 60 seconds

export function invalidateUserCache(userId: string): void {
  _userCache.delete(userId);
}

function _pruneExpired(): void {
  const now = Date.now();
  for (const [k, v] of _userCache) {
    if (v.expiresAt <= now) _userCache.delete(k);
  }
}

/**
 * Extract authenticated user from request JWT token.
 * First hit per userId queries Neon PG; subsequent hits within 60 s use the
 * in-process cache, eliminating the Neon round-trip from every auction action.
 */
export async function getUserFromRequest(request: NextRequest): Promise<RequestUser | null> {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const now = Date.now();
    const cached = _userCache.get(payload.userId);
    if (cached && cached.expiresAt > now) return cached.data;

    // Cache miss — hit Neon PG for latest role/plan/tournament assignments.
    // JWTs live for 7 days; without this fetch, revoked access / promotions
    // would not be visible until the user re-logs.
    const user = await getUserById(payload.userId);
    if (!user) return null;

    const result: RequestUser = {
      userId: payload.userId,
      role: user.role as UserRole,
      assignedTournaments: user.assignedTournaments || [],
      plan: user.plan || 'Free',
    };

    // Prune stale entries occasionally (every ~100 calls) to avoid unbounded growth
    if (_userCache.size > 100) _pruneExpired();
    _userCache.set(payload.userId, { data: result, expiresAt: now + USER_CACHE_TTL_MS });

    return result;
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