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
