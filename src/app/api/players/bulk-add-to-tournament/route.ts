import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { PlayerModel } from '@/models/Player';
import { TournamentModel } from '@/models/Tournament';
import { playerDB } from '@/lib/db-mongodb';
import { Tournament } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

interface ExcelRow {
  'Name'?: string;
  'Position'?: string;
  'Current Club'?: string;
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

function resolvePlayerClassShortCode(input: string, tournament: Tournament): string | null {
  const normalizedInput = input.trim().toLowerCase();
  const playerClasses = tournament.playerClasses || [];

  const exactNameMatch = playerClasses.find(c => c.name.toLowerCase() === normalizedInput);
  if (exactNameMatch) return exactNameMatch.name;

  const codeMatch = playerClasses.find(c => c.code && c.code.toLowerCase() === normalizedInput);
  if (codeMatch) return codeMatch.name;

  const legacyShortCodeMap: Record<string, string[]> = {
    'p': ['Platinum', 'Premium'], 'plat': ['Platinum'], 'prem': ['Premium'], 'pr': ['Premium'],
    'g': ['Gold'], 's': ['Silver', 'Standard'], 'sil': ['Silver'],
    'std': ['Standard'], 'st': ['Standard'], 'b': ['Bronze'], 'bro': ['Bronze'],
    'd': ['Diamond'], 'dia': ['Diamond'], 'e': ['Elite'],
  };

  for (const className of (legacyShortCodeMap[normalizedInput] || [])) {
    const match = playerClasses.find(c => c.name.toLowerCase() === className.toLowerCase());
    if (match) return match.name;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canPerformAction(user.role, 'create', 'player')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tournamentId = formData.get('tournamentId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!tournamentId) return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.' }, { status: 400 });
    }

    const tournament = await TournamentModel.findById(tournamentId).lean() as Tournament | null;
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    const tournamentClasses = tournament.usePlayerClasses && tournament.playerClasses
      ? tournament.playerClasses.map((c: any) => c.name)
      : [];

    const classCodesDisplay = tournament.usePlayerClasses && tournament.playerClasses
      ? tournament.playerClasses.map((c: any) => `${c.code} (${c.name})`).join(', ')
      : '';

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty or has no data rows' }, { status: 400 });
    }

    const result: ImportResult = {
      success: true, imported: 0, failed: 0, skipped: 0,
      total: jsonData.length, errors: [], duplicates: [], message: ''
    };

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2;

      if (row['Add (Yes/No)']?.toString().trim().toLowerCase() !== 'yes') {
        result.skipped++;
        continue;
      }

      const playerName = row['Name']?.toString().trim();
      const position = row['Position']?.toString().trim();
      const currentClub = row['Current Club']?.toString().trim();

      if (!playerName) {
        result.errors.push({ row: rowNumber, error: 'Missing player Name', player: 'Unknown' });
        result.failed++;
        continue;
      }

      if (!position) {
        result.errors.push({ row: rowNumber, error: 'Missing Position', player: playerName });
        result.failed++;
        continue;
      }

      if (!currentClub) {
        result.errors.push({ row: rowNumber, error: 'Missing Current Club', player: playerName });
        result.failed++;
        continue;
      }

      // Validate player class if tournament uses classes
      let playerClass = row['Player Class']?.toString().trim() || '';
      if (tournamentClasses.length > 0) {
        if (!playerClass) {
          result.errors.push({ row: rowNumber, error: 'Player Class is required for this tournament', player: playerName });
          result.failed++;
          continue;
        }
        const resolvedClass = resolvePlayerClassShortCode(playerClass, tournament);
        if (!resolvedClass) {
          result.errors.push({ row: rowNumber, error: `Invalid Player Class '${playerClass}'. Available: ${classCodesDisplay || tournamentClasses.join(', ')}`, player: playerName });
          result.failed++;
          continue;
        }
        playerClass = resolvedClass;
      }

      // Duplicate check by name within tournament
      const existing = await PlayerModel.findOne({ tournamentId, name: playerName }).lean() as { _id: string } | null;
      if (existing) {
        result.duplicates.push({ row: rowNumber, player: playerName, reason: `Player already exists in tournament (ID: ${existing._id})` });
        result.failed++;
        continue;
      }

      try {
        await playerDB.create(
          { name: playerName, position, currentClub, playerClass: playerClass || undefined, tournamentId },
          user.userId
        );
        result.imported++;
      } catch (error: any) {
        result.errors.push({ row: rowNumber, error: `Failed to add player: ${error.message}`, player: playerName });
        result.failed++;
      }
    }

    result.message = `Successfully added ${result.imported} players. ${result.failed} failed, ${result.skipped} skipped.`;
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Bulk add to tournament error:', error);
    return NextResponse.json({ error: `Failed to process file: ${error.message}` }, { status: 500 });
  }
}
