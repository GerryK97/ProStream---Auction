import { NextRequest, NextResponse } from 'next/server';
import { TournamentModel } from '@/models/Tournament';
import { getUserFromRequest, type RequestUser } from '@/lib/request-helpers';
import { canAccessTournament, canPerformAction } from '@/lib/permissions';

type AuthorizedAuctionMutation = {
  authorized: true;
  user: RequestUser;
  tournament: Record<string, any>;
};

type RejectedAuctionMutation = {
  authorized: false;
  response: NextResponse;
};

export async function authenticateAuctionManager(
  request: NextRequest,
): Promise<{ authorized: true; user: RequestUser } | RejectedAuctionMutation> {
  const user = await getUserFromRequest(request);
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!canPerformAction(user.role, 'manage', 'auction')) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { authorized: true, user };
}

export function authorizeAuctionTournament(
  user: RequestUser,
  tournament: Record<string, any> | null,
): { authorized: true; tournament: Record<string, any> } | RejectedAuctionMutation {
  if (!tournament) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Tournament not found' }, { status: 404 }),
    };
  }

  if (!canAccessTournament(
    user.userId,
    user.role,
    tournament as any,
    user.assignedTournaments,
  )) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'You do not have permission to manage this tournament.' },
        { status: 403 },
      ),
    };
  }

  return { authorized: true, tournament };
}

/**
 * Authenticate an auction mutation and scope it to a tournament the caller can manage.
 * Call after connectToDatabase() and after validating that tournamentId is present.
 */
export async function authorizeAuctionMutation(
  request: NextRequest,
  tournamentId: string,
): Promise<AuthorizedAuctionMutation | RejectedAuctionMutation> {
  const authentication = await authenticateAuctionManager(request);
  if (!authentication.authorized) return authentication;

  const tournament = await TournamentModel.findById(tournamentId).lean();
  const access = authorizeAuctionTournament(
    authentication.user,
    tournament as Record<string, any> | null,
  );
  if (!access.authorized) return access;

  return {
    authorized: true,
    user: authentication.user,
    tournament: access.tournament,
  };
}
