import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { validateOverlayToken, getOverlayTokenFromRequest } from '@/lib/overlay-auth';
import { getUserFromRequest } from '@/lib/request-helpers';

// GET /api/tournaments/active - Get currently active (Live or Stopped) tournament
// Supports overlay token authentication for OBS browser sources
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Check for overlay token in URL query params
    const overlayToken = getOverlayTokenFromRequest(request);

    // Only validate if it looks like an overlay token (not a JWT)
    // JWT tokens start with "eyJ", overlay tokens don't
    const isJWT = overlayToken?.startsWith('eyJ');

    if (overlayToken && !isJWT) {
      const isValidOverlayToken = validateOverlayToken(overlayToken);

      // If overlay token is provided but invalid, return 401
      if (!isValidOverlayToken) {
        return NextResponse.json(
          { error: 'Invalid overlay token' },
          { status: 401 }
        );
      }
    }

    // JWT tokens and Authorization headers are handled by middleware
    // For now, we allow access with valid overlay token OR JWT token OR no authentication
    // (the OverlayWrapper will handle authentication states)

    // If a user is authenticated, scope to their accessible tournaments (created or assigned)
    const user = await getUserFromRequest(request);
    const query: any = { status: { $in: ['Live', 'Stopped'] } };
    if (user) {
      query.$or = [
        { createdBy: user.userId },
        { _id: { $in: user.assignedTournaments || [] } },
      ];
    }

    // Find tournament with Live or Stopped status (scoped if user present)
    const activeTournament = await TournamentModel.findOne(query)
      .sort({ _id: -1 }) // Get most recent if multiple
      .lean();

    // Return null with 200 status if no active tournament (this is an expected state, not an error)
    // This prevents console errors when no auction is running
    if (!activeTournament) {
      return NextResponse.json(null);
    }

    return NextResponse.json(activeTournament);
  } catch (error) {
    console.error('Error fetching active tournament:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active tournament' },
      { status: 500 }
    );
  }
}
