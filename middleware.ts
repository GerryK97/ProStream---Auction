import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest, getTokenFromCookies } from '@/lib/auth';
import { canAccessRoute } from '@/lib/permissions';
import { getOverlayTokenFromRequest, isOverlayReadApiRequest } from '@/lib/overlay-auth';


// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/unauthorized',
  '/contact',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/session',
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Overlay viewer pages are fully public — no auth required
  if (pathname.startsWith('/overlays/')) {
    return NextResponse.next();
  }

  // Get token from request - check Authorization header first, then cookies
  const token = getTokenFromRequest(request) || getTokenFromCookies(request);

  const isApiRoute = pathname.startsWith('/api/');

  // OBS browser sources authenticate with ?token= on read-only overlay APIs (no JWT/cookies).
  const overlayToken = getOverlayTokenFromRequest(request);
  if (isApiRoute && isOverlayReadApiRequest(pathname, request.method, overlayToken)) {
    return NextResponse.next();
  }

  if (!token) {
    // API routes: return 401 JSON (not a redirect, browser fetch can't redirect to login)
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Verify token
  const payload = verifyToken(token);

  if (!payload) {
    // Token is invalid or expired
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // For API routes: token is valid, let the route handler do fine-grained authorization
  if (isApiRoute) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Check if user has access to the UI route
  const hasAccess = canAccessRoute(payload.role as any, pathname);

  if (!hasAccess) {
    return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
  }

  // Create a response and add user info to headers for access in route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    // Apply middleware to all routes except static files
    // API routes are now protected - only public auth endpoints are exempt
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
