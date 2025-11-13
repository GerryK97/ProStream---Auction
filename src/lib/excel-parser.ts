import * as XLSX from 'xlsx';

export interface ParsedPlayerData {
  name: string;
  position: string;
  currentClub: string;
  suggestedClass?: string;
  matchesPlayed?: number;
  totalScore?: number;
  totalWickets?: number;
  photoURL?: string;
}

export interface ParseResult {
  success: boolean;
  data: ParsedPlayerData[];
  errors: string[];
}

/**
 * Parse Excel/CSV file containing player data
 * @param file - File buffer or ArrayBuffer
 * @returns Parsed player data or errors
 */
export function parsePlayerExcel(file: ArrayBuffer): ParseResult {
  try {
    // Read the workbook
    const workbook = XLSX.read(file, { type: 'array' });

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        data: [],
        errors: ['No sheets found in the Excel file'],
      };
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Use array of arrays format first
      defval: '', // Default value for empty cells
    }) as any[][];

    if (jsonData.length === 0) {
      return {
        success: false,
        data: [],
        errors: ['Excel file is empty'],
      };
    }

    // Get headers (first row)
    const headers = jsonData[0] as string[];

    // Validate required headers
    const requiredHeaders = ['Player Name', 'Position', 'Current Club'];
    const missingHeaders = requiredHeaders.filter(
      (header) => !headers.some((h) => h.trim().toLowerCase() === header.toLowerCase())
    );

    if (missingHeaders.length > 0) {
      return {
        success: false,
        data: [],
        errors: [`Missing required columns: ${missingHeaders.join(', ')}`],
      };
    }

    // Map headers to indexes
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
      const normalizedHeader = header.trim().toLowerCase();
      if (normalizedHeader === 'player name') headerMap.name = index;
      else if (normalizedHeader === 'position') headerMap.position = index;
      else if (normalizedHeader === 'current club') headerMap.currentClub = index;
      else if (normalizedHeader === 'suggested class') headerMap.suggestedClass = index;
      else if (normalizedHeader === 'matches played') headerMap.matchesPlayed = index;
      else if (normalizedHeader === 'total score') headerMap.totalScore = index;
      else if (normalizedHeader === 'total wickets') headerMap.totalWickets = index;
      else if (normalizedHeader === 'photo url') headerMap.photoURL = index;
    });

    // Parse data rows (skip header)
    const players: ParsedPlayerData[] = [];
    const errors: string[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];

      // Skip empty rows
      if (!row || row.every((cell) => !cell || cell.toString().trim() === '')) {
        continue;
      }

      try {
        const player: ParsedPlayerData = {
          name: row[headerMap.name]?.toString().trim() || '',
          position: row[headerMap.position]?.toString().trim() || '',
          currentClub: row[headerMap.currentClub]?.toString().trim() || '',
        };

        // Optional fields
        if (headerMap.suggestedClass !== undefined && row[headerMap.suggestedClass]) {
          player.suggestedClass = row[headerMap.suggestedClass].toString().trim();
        }

        if (headerMap.matchesPlayed !== undefined && row[headerMap.matchesPlayed]) {
          const matches = parseNumber(row[headerMap.matchesPlayed]);
          if (matches !== null) player.matchesPlayed = matches;
        }

        if (headerMap.totalScore !== undefined && row[headerMap.totalScore]) {
          const score = parseNumber(row[headerMap.totalScore]);
          if (score !== null) player.totalScore = score;
        }

        if (headerMap.totalWickets !== undefined && row[headerMap.totalWickets]) {
          const wickets = parseNumber(row[headerMap.totalWickets]);
          if (wickets !== null) player.totalWickets = wickets;
        }

        if (headerMap.photoURL !== undefined && row[headerMap.photoURL]) {
          player.photoURL = row[headerMap.photoURL].toString().trim();
        }

        players.push(player);
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Invalid data'}`);
      }
    }

    if (players.length === 0 && errors.length === 0) {
      return {
        success: false,
        data: [],
        errors: ['No valid player data found in the Excel file'],
      };
    }

    return {
      success: errors.length === 0,
      data: players,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [error instanceof Error ? error.message : 'Failed to parse Excel file'],
    };
  }
}

/**
 * Helper function to parse number from various formats
 */
function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;

  const num = typeof value === 'number' ? value : parseFloat(value.toString().replace(/,/g, ''));

  return isNaN(num) ? null : Math.max(0, Math.floor(num)); // Non-negative integers
}
