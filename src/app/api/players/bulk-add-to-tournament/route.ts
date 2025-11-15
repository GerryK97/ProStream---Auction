import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { MasterPlayerModel } from '@/models/MasterPlayer';
import { PlayerModel } from '@/models/Player';
import { TournamentModel } from '@/models/Tournament';
import { playerDB } from '@/lib/db-mongodb';
import { Tournament } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';

interface ExcelRow {
  'Master Player ID'?: string;
  'Name'?: string;
  'Position'?: string;
  'Current Club'?: string;
  'Matches'?: number;
  'Score'?: number;
  'Wickets'?: number;
  'Add (Yes/No)'?: string;
  'Player Class'?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  total: number;
  errors: Array<{ row: number; error: string; player?: string }>;
  duplicates: Array<{ row: number; player: string; reason: string }>;
  message: string;
}

/**
 * Map short codes or full names to player class names
 * Supports:
 * - Exact class name match (case-insensitive)
 * - Official short code from tournament config (e.g., "PT" -> "Platinum")
 * - Legacy short codes for backward compatibility
 */
function resolvePlayerClassShortCode(
  input: string,
  tournament: Tournament
): string | null {
  const trimmedInput = input.trim();
  const normalizedInput = trimmedInput.toLowerCase();

  // Get available classes from tournament
  const playerClasses = tournament.playerClasses || [];

  // First, check for exact class name match (case-insensitive)
  const exactNameMatch = playerClasses.find(
    c => c.name.toLowerCase() === normalizedInput
  );
  if (exactNameMatch) {
    return exactNameMatch.name;
  }

  // Second, check for official short code match (case-insensitive)
  const codeMatch = playerClasses.find(
    c => c.code && c.code.toLowerCase() === normalizedInput
  );
  if (codeMatch) {
    return codeMatch.name;
  }

  // Third, legacy short code support for backward compatibility
  // Only used if no official code matches
  const legacyShortCodeMap: Record<string, string[]> = {
    'p': ['Platinum', 'Premium'],
    'plat': ['Platinum'],
    'prem': ['Premium'],
    'pr': ['Premium'],
    'g': ['Gold'],
    's': ['Silver', 'Standard'],
    'sil': ['Silver'],
    'std': ['Standard'],
    'st': ['Standard'],
    'b': ['Bronze'],
    'bro': ['Bronze'],
    'd': ['Diamond'],
    'dia': ['Diamond'],
    'e': ['Elite'],
  };

  const possibleClasses = legacyShortCodeMap[normalizedInput] || [];
  for (const className of possibleClasses) {
    const match = playerClasses.find(
      c => c.name.toLowerCase() === className.toLowerCase()
    );
    if (match) {
      return match.name;
    }
  }

  // No match found
  return null;
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tournamentId = formData.get('tournamentId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file.' },
        { status: 400 }
      );
    }

    // Fetch tournament
    const tournament = await TournamentModel.findById(tournamentId).lean() as Tournament | null;
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get tournament's player classes
    const tournamentClasses = tournament.usePlayerClasses && tournament.playerClasses
      ? tournament.playerClasses.map((c: any) => c.name)
      : [];

    // Get tournament's player class codes for display in error messages
    const classCodesDisplay = tournament.usePlayerClasses && tournament.playerClasses
      ? tournament.playerClasses.map((c: any) => `${c.code} (${c.name})`).join(', ')
      : '';

    // Parse Excel file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: 'Excel file is empty or has no data rows' },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      skipped: 0,
      total: jsonData.length,
      errors: [],
      duplicates: [],
      message: ''
    };

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // +2 for Excel row (header + 0-index)

      // Check if user wants to add this player
      const addPlayer = row['Add (Yes/No)']?.toString().trim().toLowerCase();
      if (addPlayer !== 'yes') {
        result.skipped++;
        continue;
      }

      // Validate required fields
      const masterPlayerId = row['Master Player ID']?.toString().trim();
      const playerName = row['Name']?.toString().trim();

      if (!masterPlayerId || !playerName) {
        result.errors.push({
          row: rowNumber,
          error: 'Missing Master Player ID or Name',
          player: playerName || 'Unknown'
        });
        result.failed++;
        continue;
      }

      // Validate player class if tournament uses classes
      let playerClass = row['Player Class']?.toString().trim() || '';
      if (tournamentClasses.length > 0) {
        if (!playerClass) {
          result.errors.push({
            row: rowNumber,
            error: 'Player Class is required for this tournament',
            player: playerName
          });
          result.failed++;
          continue;
        }

        // Try to resolve code or name to full class name
        const resolvedClass = resolvePlayerClassShortCode(playerClass, tournament);

        if (!resolvedClass) {
          result.errors.push({
            row: rowNumber,
            error: `Invalid Player Class '${playerClass}'. Available: ${classCodesDisplay || tournamentClasses.join(', ')}`,
            player: playerName
          });
          result.failed++;
          continue;
        }

        // Use resolved class name for consistency
        playerClass = resolvedClass;
      }

      // Check if master player exists
      const masterPlayer = await MasterPlayerModel.findById(masterPlayerId).lean();
      if (!masterPlayer) {
        result.errors.push({
          row: rowNumber,
          error: `Master player not found (ID: ${masterPlayerId})`,
          player: playerName
        });
        result.failed++;
        continue;
      }

      // Check if player already exists in tournament
      const existing = await PlayerModel.findOne({
        masterPlayerId,
        tournamentId
      }).lean() as { _id: string } | null;

      if (existing) {
        result.duplicates.push({
          row: rowNumber,
          player: playerName,
          reason: `Already added to tournament (Player ID: ${existing._id})`
        });
        result.failed++;
        continue;
      }

      // Add player to tournament
      try {
        await playerDB.createFromMaster(
          masterPlayerId,
          tournamentId,
          playerClass || undefined
        );
        result.imported++;
      } catch (error: any) {
        result.errors.push({
          row: rowNumber,
          error: `Failed to add player: ${error.message}`,
          player: playerName
        });
        result.failed++;
      }
    }

    result.message = `Successfully added ${result.imported} players. ${result.failed} failed, ${result.skipped} skipped.`;

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Bulk add to tournament error:', error);
    return NextResponse.json(
      { error: `Failed to process file: ${error.message}` },
      { status: 500 }
    );
  }
}
