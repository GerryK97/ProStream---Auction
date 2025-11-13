import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { masterPlayerDB } from '@/lib/db-mongodb';
import { parsePlayerExcel } from '@/lib/excel-parser';
import { validateBulkPlayerData, ValidationError } from '@/lib/bulk-upload-validator';
import { MasterPlayer } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface BulkImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  failed: number;
  errors: ValidationError[];
  duplicates?: string[];
}

/**
 * POST /api/master-players/bulk-import
 * Bulk import master players from Excel/CSV file
 *
 * Accepts: multipart/form-data with 'file' field
 * Returns: Import results with success/failure counts and detailed errors
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Check if user has admin or manager role
    const userRole = (session.user as any).role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden - Only admins and managers can bulk import players' },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please upload an Excel or CSV file.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit. Please upload a smaller file.' },
        { status: 400 }
      );
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse Excel file
    const parseResult = parsePlayerExcel(arrayBuffer);

    if (!parseResult.success || parseResult.data.length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to parse Excel file',
          details: parseResult.errors,
        },
        { status: 400 }
      );
    }

    // Validate all player data
    const validationResult = validateBulkPlayerData(parseResult.data);

    // If there are validation errors, return them without importing
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          totalRows: parseResult.data.length,
          imported: 0,
          failed: parseResult.data.length,
          errors: validationResult.errors,
        } as BulkImportResult,
        { status: 400 }
      );
    }

    // Check for duplicates in database before importing
    const duplicateChecks = await Promise.all(
      parseResult.data.map(async (player) => {
        const existing = await masterPlayerDB.getAll();
        return existing.find(
          (p) =>
            p.name.toLowerCase() === player.name.toLowerCase() &&
            p.currentClub.toLowerCase() === player.currentClub.toLowerCase()
        );
      })
    );

    const duplicates = parseResult.data
      .map((player, index) => (duplicateChecks[index] ? player.name : null))
      .filter((name): name is string => name !== null);

    // If there are duplicates, return error
    if (duplicates.length > 0) {
      return NextResponse.json(
        {
          success: false,
          totalRows: parseResult.data.length,
          imported: 0,
          failed: duplicates.length,
          errors: duplicates.map((name, index) => ({
            row: index + 2,
            field: 'Player Name',
            message: `Player "${name}" already exists in the database`,
          })),
          duplicates,
        } as BulkImportResult,
        { status: 409 }
      );
    }

    // All validation passed - proceed with bulk import
    const importResults: { success: MasterPlayer[]; failed: ValidationError[] } = {
      success: [],
      failed: [],
    };

    // Import players one by one
    for (let i = 0; i < parseResult.data.length; i++) {
      const playerData = parseResult.data[i];
      const rowNumber = i + 2; // +2 because row 1 is header, index starts at 0

      try {
        // Map parsed data to MasterPlayer format
        const masterPlayerData: Omit<MasterPlayer, '_id'> = {
          name: playerData.name,
          position: playerData.position,
          currentClub: playerData.currentClub,
          suggestedClass: playerData.suggestedClass,
          photoURL: playerData.photoURL,
          careerStats: {
            matchesPlayed: playerData.matchesPlayed || 0,
            totalScore: playerData.totalScore || 0,
            totalWickets: playerData.totalWickets || 0,
          },
        };

        // Create player in database
        const createdPlayer = await masterPlayerDB.create(masterPlayerData);
        importResults.success.push(createdPlayer);
      } catch (error) {
        console.error(`Error importing player at row ${rowNumber}:`, error);
        importResults.failed.push({
          row: rowNumber,
          field: 'Database',
          message: error instanceof Error ? error.message : 'Failed to create player',
        });
      }
    }

    // Return results
    const result: BulkImportResult = {
      success: importResults.failed.length === 0,
      totalRows: parseResult.data.length,
      imported: importResults.success.length,
      failed: importResults.failed.length,
      errors: importResults.failed,
    };

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      // Partial success
      return NextResponse.json(result, { status: 207 }); // 207 Multi-Status
    }
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during bulk import',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
