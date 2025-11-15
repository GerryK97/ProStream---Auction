/**
 * API Endpoint: Migrate Player Class Codes
 *
 * POST /api/migrate/player-class-codes
 *
 * Runs the migration to add codes to player classes in existing tournaments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { migratePlayerClassCodes } from '@/scripts/migratePlayerClassCodes';

export async function POST(req: NextRequest) {
  try {
    // Run migration
    await migratePlayerClassCodes();

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Migration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
