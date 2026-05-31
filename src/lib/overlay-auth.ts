/**
 * Overlay Authentication Utility
 *
 * Provides token-based authentication for overlay access in OBS and other browser sources.
 * Uses a simple shared secret token configured via environment variable.
 */

/**
 * Validates an overlay token against the configured secret
 * @param token - The token to validate
 * @returns true if token is valid, false otherwise
 */
export function validateOverlayToken(token: string | null | undefined): boolean {
    if (!token) {
        return false;
    }

    const secretToken = process.env.OVERLAY_SECRET_TOKEN;

    if (!secretToken) {
        console.warn('OVERLAY_SECRET_TOKEN environment variable is not set. Overlay token authentication is disabled.');
        return false;
    }

    return token === secretToken;
}

/**
 * Validates a token against the DB-stored overlay sessions.
 * Used for per-session tokens created via the Session Manager.
 * @param token - The session token to validate
 * @returns true if the token exists and is active, false otherwise
 */
export async function validateOverlaySessionToken(
  token: string | null | undefined,
  expectedOverlayType?: string | null,
  expectedTournamentId?: string | null,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { connectToDatabase } = await import('@/lib/mongodb');
    const { OverlaySessionModel } = await import('@/models/OverlaySession');
    await connectToDatabase();
    const query: Record<string, unknown> = { _id: token, isActive: true };
    if (expectedOverlayType) query.overlayType = expectedOverlayType;
    if (expectedTournamentId) query.tournamentId = expectedTournamentId;
    const session = await OverlaySessionModel.findOne(query).lean();
    return !!session;
  } catch {
    return false;
  }
}

/**
 * Gets the overlay token from various sources (URL params, headers, etc.)
 * @param request - Next.js request object
 * @returns The token if found, null otherwise
 */
export function getOverlayTokenFromRequest(request: Request): string | null {
    try {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');
        return token;
    } catch (error) {
        console.error('Error extracting token from request:', error);
        return null;
    }
}
