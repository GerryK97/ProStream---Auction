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

    let isValidOverlayAccess = false;
    if (overlayToken && !isJWT) {
      // If overlay token is provided but invalid, return 401
      if (!validateOverlayToken(overlayToken)) {
        return NextResponse.json(
          { error: 'Invalid overlay token' },
          { status: 401 }
        );
      }
      isValidOverlayAccess = true;
    }

    // Get authenticated user (if any)
    const user = await getUserFromRequest(request);

    // No user and no valid overlay token → deny
    if (!user && !isValidOverlayAccess) {
      return NextResponse.json(null);
    }

    // Valid overlay token but no user → return most recent Live/Stopped tournament (unscoped)
    if (!user && isValidOverlayAccess) {
      const activeTournament = await TournamentModel.findOne(
        { status: { $in: ['Live', 'Stopped'] } }
      ).sort({ _id: -1 }).lean();
      return NextResponse.json(activeTournament);
    }

    // Build query based on user role
    const query: any = { status: { $in: ['Live', 'Stopped'] } };

    // Admin sees ANY active tournament
    if (user.role === 'Admin') {
      // Query already set to find any active tournament
    }
    // Tournament role sees ONLY active tournaments they created
    else if (user.role === 'Tournament') {
      query.createdBy = user.userId;
    }
    // Other roles see active tournaments they created OR assigned to them
    else {
      query.$or = [
        { createdBy: user.userId },
        { _id: { $in: user.assignedTournaments || [] } },
      ];
    }

    // Find tournament with Live or Stopped status (scoped by user)
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
