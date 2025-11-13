import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { masterPlayerDB } from '@/lib/db-mongodb';
import MasterPlayerModel from '@/models/MasterPlayer';

interface ExcelRow {
  Name?: string;
  Position?: string;
  'Current Club'?: string;
  'Photo URL'?: string;
  'Matches Played'?: number;
  'Total Score'?: number;
  'Total Wickets'?: number;
  'Suggested Class'?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  duplicates: Array<{ row: number; name: string; reason: string }>;
}

async function generateSequentialPlayerId(): Promise<string> {
  const count = await MasterPlayerModel.countDocuments();
  const playerNumber = (count + 1).toString().padStart(3, '0');
  return `PS${playerNumber}`;
}

function validateRow(row: ExcelRow, rowNumber: number): { valid: boolean; error?: string } {
  if (!row.Name || row.Name.trim() === '') {
    return { valid: false, error: `Row ${rowNumber}: Name is required` };
  }
  if (!row.Position || row.Position.trim() === '') {
    return { valid: false, error: `Row ${rowNumber}: Position is required` };
  }
  if (!row['Current Club'] || row['Current Club'].trim() === '') {
    return { valid: false, error: `Row ${rowNumber}: Current Club is required` };
  }
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel file
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
      errors: [],
      duplicates: []
    };

    // Track names in this upload to prevent duplicates within the file
    const uploadedNames = new Map<string, number>();
    const validPlayers = [];

    // Validate all rows first
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have a header

      // Validate required fields
      const validation = validateRow(row, rowNumber);
      if (!validation.valid) {
        result.errors.push({ row: rowNumber, error: validation.error!, data: row });
        result.failed++;
        continue;
      }

      const playerKey = `${row.Name!.trim().toLowerCase()}_${row.Position!.trim().toLowerCase()}`;

      // Check for duplicates within the upload file
      if (uploadedNames.has(playerKey)) {
        result.duplicates.push({
          row: rowNumber,
          name: row.Name!,
          reason: `Duplicate entry in file (first seen at row ${uploadedNames.get(playerKey)})`
        });
        result.failed++;
        continue;
      }

      // Check for existing player in database
      const existingPlayer = await MasterPlayerModel.findOne({
        name: { $regex: new RegExp(`^${row.Name!.trim()}$`, 'i') },
        position: { $regex: new RegExp(`^${row.Position!.trim()}$`, 'i') }
      });

      if (existingPlayer) {
        result.duplicates.push({
          row: rowNumber,
          name: row.Name!,
          reason: `Player already exists in database (ID: ${existingPlayer._id})`
        });
        result.failed++;
        continue;
      }

      uploadedNames.set(playerKey, rowNumber);

      // Prepare player data
      const playerData: any = {
        name: row.Name.trim(),
        position: row.Position.trim(),
        currentClub: row['Current Club'].trim(),
      };

      if (row['Photo URL'] && row['Photo URL'].trim()) {
        playerData.photoURL = row['Photo URL'].trim();
      }

      if (row['Matches Played'] || row['Total Score'] || row['Total Wickets']) {
        playerData.careerStats = {
          matchesPlayed: Number(row['Matches Played']) || 0,
          totalScore: Number(row['Total Score']) || 0,
          totalWickets: Number(row['Total Wickets']) || 0,
        };
      }

      if (row['Suggested Class'] && row['Suggested Class'].trim()) {
        playerData.suggestedClass = row['Suggested Class'].trim();
      }

      validPlayers.push({ data: playerData, rowNumber });
    }

    // Bulk insert valid players
    if (validPlayers.length > 0) {
      try {
        for (const player of validPlayers) {
          try {
            // Generate sequential ID for each player
            const playerId = await generateSequentialPlayerId();
            const playerWithId = { ...player.data, _id: playerId };

            await masterPlayerDB.create(playerWithId);
            result.imported++;
          } catch (error: any) {
            result.errors.push({
              row: player.rowNumber,
              error: `Failed to create player: ${error.message}`,
              data: player.data
            });
            result.failed++;
          }
        }
      } catch (error: any) {
        return NextResponse.json(
          { error: `Bulk insert failed: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      imported: result.imported,
      failed: result.failed,
      total: jsonData.length,
      errors: result.errors,
      duplicates: result.duplicates,
      message: `Successfully imported ${result.imported} players. ${result.failed} failed.`
    });

  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: `Failed to process file: ${error.message}` },
      { status: 500 }
    );
  }
}
