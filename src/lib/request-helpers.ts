import { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { User } from '@/models/User';
import { UserRole } from '@/lib/permissions';

/**
 * Extracted user information from authenticated request
 */
export interface RequestUser {
  userId: string;
  role: UserRole;
  assignedTournaments: string[];
  assignedTeams: string[];
  plan: 'Free' | 'Standard' | 'Offer';
  tournamentAllowance: number;
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
    // Get token from Authorization header
    const token = getTokenFromRequest(request);
    if (!token) {
      return null;
    }

    // Verify and decode JWT token
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    // Fetch user from database to get assigned tournaments/teams
    await require('@/lib/mongodb').connectToDatabase();
    const user = await User.findById(payload.userId).select(
      'role assignedTournaments assignedTeams plan tournamentAllowance'
    );

    if (!user) {
      return null;
    }

    return {
      userId: payload.userId,
      role: user.role as UserRole,
      assignedTournaments: user.assignedTournaments || [],
      assignedTeams: user.assignedTeams || [],
      plan: (user as any).plan || 'Free',
      tournamentAllowance: (user as any).tournamentAllowance ?? 1,
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
