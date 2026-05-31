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
 * Fetches additional user data for legacy tokens only.
 */
export async function getUserFromRequest(request: NextRequest): Promise<RequestUser | null> {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    if (payload.assignedTournaments !== undefined && payload.plan) {
      return {
        userId: payload.userId,
        role: payload.role as UserRole,
        assignedTournaments: payload.assignedTournaments || [],
        plan: payload.plan || 'Free',
      };
    }

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