import { NextRequest, NextResponse } from 'next/server';
import { tournamentDB } from '@/lib/db-mongodb';
import { PlayerClassConfig } from '@/types';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import { getUsersByIds } from '@/lib/pg/user-queries';

/**
 * Validate player class codes
 * Ensures all classes have codes and no duplicates exist
 */
function validatePlayerClassCodes(playerClasses?: PlayerClassConfig[]): { valid: boolean; error?: string } {
  if (!playerClasses || playerClasses.length === 0) {
    return { valid: true };
  }

  // Check for empty codes
  const hasEmptyCode = playerClasses.some(cls => !cls.code || cls.code.trim() === '');
  if (hasEmptyCode) {
    return {
      valid: false,
      error: 'All player classes must have a code. Please provide a code for each class.'
    };
  }

  // Check for duplicate codes
  const codes = playerClasses.map(cls => cls.code.toUpperCase());
  const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
  if (duplicates.length > 0) {
    return {
      valid: false,
      error: `Duplicate player class code detected: "${duplicates[0]}". Each class must have a unique code.`
    };
  }

  return { valid: true };
}

// GET /api/tournaments - Get tournaments accessible to the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to read tournaments
    if (!canPerformAction(user.role, 'read', 'tournament')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get tournaments accessible to this user
    const tournaments = await tournamentDB.getAllForUser(
      user.userId,
      user.role,
      user.assignedTournaments
    );

    const creatorIds = Array.from(
      new Set(
        tournaments
          .map(tournament => tournament.createdBy)
          .filter((createdBy): createdBy is string => Boolean(createdBy))
      )
    );

    const creators = creatorIds.length > 0
      ? await getUsersByIds(creatorIds)
      : [];

    const creatorNameById = new Map(creators.map(creator => [creator.id, creator.username || creator.id]));
    const tournamentsWithCreatorName = tournaments.map(tournament => ({
      ...tournament,
      createdByUsername: tournament.createdBy ? creatorNameById.get(tournament.createdBy) : undefined,
    }));

    return NextResponse.json(tournamentsWithCreatorName);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

// POST /api/tournaments - Create new tournament
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create tournaments
    if (!canPerformAction(user.role, 'create', 'tournament')) {
      return NextResponse.json({
        error: `Your role (${user.role}) does not have permission to create tournaments. Please contact an administrator.`
      }, { status: 403 });
    }

    const body = await request.json();

    // Validate player class codes if player classes are enabled
    if (body.usePlayerClasses && body.playerClasses) {
      const validation = validatePlayerClassCodes(body.playerClasses);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    // Create tournament with createdBy tracking
    const newTournament = await tournamentDB.create(body, user.userId);

    // Ensure creator immediately has explicit access to the new tournament
    const accessAssigned = await tournamentDB.grantUserAccess(user.userId, newTournament._id);
    if (!accessAssigned) {
      console.error('Tournament created but creator access assignment failed', {
        tournamentId: newTournament._id,
        userId: user.userId,
      });
      return NextResponse.json(
        { error: 'Failed to initialize creator access for new tournament' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ...newTournament, createdByUsername: user.userId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}
