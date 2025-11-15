import { NextRequest, NextResponse } from 'next/server';
import { tournamentDB } from '@/lib/db-mongodb';
import { PlayerClassConfig } from '@/types';

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

// GET /api/tournaments - Get all tournaments
export async function GET() {
  try {
    const tournaments = await tournamentDB.getAll();
    return NextResponse.json(tournaments);
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

    const newTournament = await tournamentDB.create(body);
    return NextResponse.json(newTournament, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}
