import { NextRequest, NextResponse } from 'next/server';
import { tournamentDB } from '@/lib/db-mongodb';
import { PlayerClassConfig } from '@/types';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import { getUsersByIds } from '@/lib/pg/user-queries';
import { serializeTournament } from '@/lib/cloudinaryUtils';
import { connectToDatabase } from '@/lib/mongodb';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { normalizeTeamOfficialsConfig } from '@/lib/teamOfficials';

/**
 * Fields the Tournament mongoose schema marks `required: true`.
 * Kept here so a missing field is reported as a 400 naming the field,
 * rather than surfacing as an opaque 500.
 */
const REQUIRED_TOURNAMENT_FIELDS = [
  'name',
  'year',
  'budgetPerTeam',
  'squadSize',
  'basePricePerPlayer',
] as const;

const NUMERIC_TOURNAMENT_FIELDS = [
  'year',
  'budgetPerTeam',
  'squadSize',
  'basePricePerPlayer',
] as const;

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

    const tournamentIds = tournaments.map(t => String(t._id));

    const creatorIds = Array.from(
      new Set(
        tournaments
          .map(tournament => tournament.createdBy)
          .filter((createdBy): createdBy is string => Boolean(createdBy))
      )
    );

    // Fetch creator names + team/player counts in parallel with a single
    // $group aggregation per collection — no N×2 fan-out from the client.
    const [creators, teamCountAgg, playerCountAgg] = await Promise.all([
      creatorIds.length > 0 ? getUsersByIds(creatorIds) : Promise.resolve([]),
      TeamModel.aggregate<{ _id: string; count: number }>([
        { $match: { tournamentId: { $in: tournamentIds } } },
        { $group: { _id: '$tournamentId', count: { $sum: 1 } } },
      ]),
      PlayerModel.aggregate<{ _id: string; count: number }>([
        { $match: { tournamentId: { $in: tournamentIds } } },
        { $group: { _id: '$tournamentId', count: { $sum: 1 } } },
      ]),
    ]);

    const teamCountById   = new Map(teamCountAgg.map(r => [r._id, r.count]));
    const playerCountById = new Map(playerCountAgg.map(r => [r._id, r.count]));

    const creatorNameById = new Map(creators.map(creator => [creator.id, creator.username || creator.id]));
    const tournamentsWithCreatorName = tournaments.map(tournament => ({
      ...serializeTournament(tournament as any),
      createdByUsername: tournament.createdBy ? creatorNameById.get(tournament.createdBy) : undefined,
      teamCount:   teamCountById.get(String(tournament._id)) ?? 0,
      playerCount: playerCountById.get(String(tournament._id)) ?? 0,
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

    // Auction date is mandatory
    if (!body.auctionDate || String(body.auctionDate).trim() === '') {
      return NextResponse.json(
        { error: 'Auction date is required' },
        { status: 400 }
      );
    }

    // Validate the fields the Tournament schema marks as required before
    // hitting Mongoose. Without this the schema throws a ValidationError that
    // the catch block flattens into a generic 500, which gives the client no
    // idea which field is missing.
    const missing = REQUIRED_TOURNAMENT_FIELDS.filter((field) => {
      const value = body[field];
      return value === undefined || value === null || value === '';
    });
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
          fields: missing,
        },
        { status: 400 }
      );
    }

    const numericErrors = NUMERIC_TOURNAMENT_FIELDS.filter(
      (field) => body[field] !== undefined && !Number.isFinite(Number(body[field]))
    );
    if (numericErrors.length > 0) {
      return NextResponse.json(
        {
          error: `These fields must be numeric: ${numericErrors.join(', ')}`,
          fields: numericErrors,
        },
        { status: 400 }
      );
    }

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

    // Normalize team officials config (Owner always enabled + required)
    body.teamOfficialsConfig = normalizeTeamOfficialsConfig(body.teamOfficialsConfig);

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
    // Log the real cause: the response is deliberately generic, but silently
    // discarding the error made a simple missing-field mistake look like a
    // server fault and cost real debugging time.
    console.error('[POST /api/tournaments] create failed:', error);

    // Surface mongoose validation failures as 400 with the offending fields,
    // since they are caused by the request, not by the server.
    const err = error as { name?: string; errors?: Record<string, unknown>; message?: string };
    if (err?.name === 'ValidationError' && err.errors) {
      const fields = Object.keys(err.errors);
      return NextResponse.json(
        {
          error: `Invalid tournament data: ${fields.join(', ')}`,
          fields,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create tournament',
        // Detail is safe here: it is a validation/DB message, and without it
        // the client has no way to tell a bad request from an outage.
        detail: err?.message ?? undefined,
      },
      { status: 500 }
    );
  }
}
