import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from './auth';
import { canPerformAction } from './permissions';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userRole?: string;
}

/**
 * Middleware to check authentication
 * Returns user info if authenticated, null otherwise
 */
export async function checkAuth(request: NextRequest) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    username: payload.username,
    email: payload.email,
    role: payload.role,
  };
}

/**
 * Require authentication - returns 401 if not authenticated
 */
export async function requireAuth(request: NextRequest) {
  const auth = await checkAuth(request);

  if (!auth) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      ),
      user: null,
    };
  }

  return {
    authorized: true,
    response: null,
    user: auth,
  };
}

/**
 * Require specific role
 */
export async function requireRole(request: NextRequest, allowedRoles: string[]) {
  const auth = await checkAuth(request);

  if (!auth) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      ),
      user: null,
    };
  }

  if (!allowedRoles.includes(auth.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      ),
      user: null,
    };
  }

  return {
    authorized: true,
    response: null,
    user: auth,
  };
}

/**
 * Require specific action permission
 */
export async function requirePermission(
  request: NextRequest,
  action: 'create' | 'read' | 'update' | 'delete' | 'manage',
  resourceType: string
) {
  const auth = await checkAuth(request);

  if (!auth) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      ),
      user: null,
    };
  }

  // Admin can do everything
  if (auth.role === 'Admin') {
    return {
      authorized: true,
      response: null,
      user: auth,
    };
  }

  const hasPermission = canPerformAction(auth.role, action, resourceType);

  if (!hasPermission) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      ),
      user: null,
    };
  }

  return {
    authorized: true,
    response: null,
    user: auth,
  };
}

/**
 * Helper to add auth info to response
 * Useful for debugging
 */
export function withAuthInfo(
  response: NextResponse,
  user: {
    userId: string;
    username: string;
    role: string;
  }
) {
  response.headers.set('X-Auth-User-ID', user.userId);
  response.headers.set('X-Auth-User-Role', user.role);
  return response;
}
