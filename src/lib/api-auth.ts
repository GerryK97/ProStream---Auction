import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { canAccessTournament, canManageTournament, canManageUsers } from './authorization';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'manager' | 'viewer';
    assignedTournaments: string[];
  };
}

/**
 * Verify that the request is authenticated
 * Returns user data if authenticated, otherwise returns error response
 */
export async function verifyAuth(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token) {
      return {
        authenticated: false,
        error: NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401 }
        ),
      };
    }

    return {
      authenticated: true,
      user: {
        id: token.userId as string,
        email: token.email as string,
        name: token.name as string,
        role: token.role as 'admin' | 'manager' | 'viewer',
        assignedTournaments: token.assignedTournaments as string[],
      },
    };
  } catch (error) {
    console.error('Error verifying auth:', error);
    return {
      authenticated: false,
      error: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Verify that the user has access to a specific tournament
 */
export async function verifyTournamentAccess(
  request: NextRequest,
  tournamentId: string
) {
  const auth = await verifyAuth(request);

  if (!auth.authenticated) {
    return { authorized: false, error: auth.error };
  }

  if (!canAccessTournament(auth.user! as any, tournamentId)) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Forbidden - No access to this tournament' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user: auth.user };
}

/**
 * Verify that the user can manage a specific tournament
 */
export async function verifyTournamentManagement(
  request: NextRequest,
  tournamentId: string
) {
  const auth = await verifyAuth(request);

  if (!auth.authenticated) {
    return { authorized: false, error: auth.error };
  }

  if (!canManageTournament(auth.user! as any, tournamentId)) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Forbidden - You can only manage tournaments you created (admins only)' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user: auth.user };
}

/**
 * Verify that the user has admin privileges
 */
export async function verifyAdminAccess(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (!auth.authenticated) {
    return { authorized: false, error: auth.error };
  }

  if (!canManageUsers(auth.user! as any)) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user: auth.user };
}
