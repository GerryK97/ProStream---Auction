import { NextRequest, NextResponse } from 'next/server';
import { tournamentDB } from '@/lib/db-mongodb';
import { PlayerClassConfig } from '@/types';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction, canAccessTournament } from '@/lib/permissions';
import { validateOverlayToken, validateOverlaySessionToken, getOverlayTokenFromRequest } from '@/lib/overlay-auth';

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

// GET /api/tournaments/[id] - Get tournament by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Overlay token auth — allows OBS browser sources to read tournament data without JWT
    const overlayToken = getOverlayTokenFromRequest(request);
    const isOverlayAuth = overlayToken && (
      validateOverlayToken(overlayToken) ||
      await validateOverlaySessionToken(overlayToken)
    );

    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user && !isOverlayAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tournament = await tournamentDB.getById(id);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Overlay access: return tournament directly — the ID is already scoped in the URL
    if (!user && isOverlayAuth) {
      return NextResponse.json(tournament);
    }

    // Check if user has permission to read tournaments
    if (!canPerformAction(user!.role, 'read', 'tournament')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user has access to this tournament
    if (!canAccessTournament(user!.userId, user!.role, tournament, user!.assignedTournaments)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(tournament);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}

// PUT /api/tournaments/[id] - Update tournament
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update tournaments
    if (!canPerformAction(user.role, 'update', 'tournament')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const tournament = await tournamentDB.getById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this tournament
    if (!canAccessTournament(user.userId, user.role, tournament, user.assignedTournaments)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    const updatedTournament = await tournamentDB.update(id, body);
    if (!updatedTournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(updatedTournament);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/[id] - Delete tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete tournaments
    if (!canPerformAction(user.role, 'delete', 'tournament')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const tournament = await tournamentDB.getById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this tournament
    if (!canAccessTournament(user.userId, user.role, tournament, user.assignedTournaments)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await tournamentDB.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 }
    );
  }
}
