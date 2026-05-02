import { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { UserRole } from '@/lib/permissions';
import { User } from '@/models/User';

/**
 * Extracted user information from authenticated request
 */
export interface RequestUser {
  userId: string;
  role: UserRole;
  assignedTournaments: string[];
  assignedTeams: string[];
  plan: 'Free' | 'Standard' | 'Offer';
}

/**
 * Extract authenticated user from request JWT token
 * Fetches additional user data like assigned tournaments/teams
 *
 * @param request - NextRequest object
 * @returns User info or null if not authenticated
 */
export async function getUserFromRequest(request: NextRequest): Promise<RequestUser | null> {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    // New tokens have assignedTeams embedded — no DB query needed
    if (payload.assignedTeams !== undefined) {
      return {
        userId: payload.userId,
        role: payload.role as UserRole,
        assignedTournaments: payload.assignedTournaments || [],
        assignedTeams: payload.assignedTeams || [],
        plan: (payload as any).plan || 'Free',
      };
    }

    // Legacy token (pre-embed): fall back to DB once so old sessions keep working
    await require('@/lib/mongodb').connectToDatabase();
    const user = await User.findById(payload.userId).select('role assignedTournaments assignedTeams plan');
    if (!user) return null;
    return {
      userId: payload.userId,
      role: user.role as UserRole,
      assignedTournaments: user.assignedTournaments || [],
      assignedTeams: user.assignedTeams || [],
      plan: (user as any).plan || 'Free',
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
