import { ParsedPlayerData } from './excel-parser';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a single player data row
 * @param player - Parsed player data
 * @param rowNumber - Row number in Excel (for error reporting)
 * @returns Validation result with any errors
 */
export function validatePlayerData(
  player: ParsedPlayerData,
  rowNumber: number
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate required fields
  if (!player.name || player.name.trim().length === 0) {
    errors.push({
      row: rowNumber,
      field: 'Player Name',
      message: 'Player Name is required',
    });
  } else if (player.name.length < 2) {
    errors.push({
      row: rowNumber,
      field: 'Player Name',
      message: 'Player Name must be at least 2 characters',
    });
  } else if (player.name.length > 100) {
    errors.push({
      row: rowNumber,
      field: 'Player Name',
      message: 'Player Name must not exceed 100 characters',
    });
  }

  if (!player.position || player.position.trim().length === 0) {
    errors.push({
      row: rowNumber,
      field: 'Position',
      message: 'Position is required',
    });
  }

  if (!player.currentClub || player.currentClub.trim().length === 0) {
    errors.push({
      row: rowNumber,
      field: 'Current Club',
      message: 'Current Club is required',
    });
  } else if (player.currentClub.length < 2) {
    errors.push({
      row: rowNumber,
      field: 'Current Club',
      message: 'Current Club must be at least 2 characters',
    });
  }

  // Validate optional numeric fields
  if (
    player.matchesPlayed !== undefined &&
    (player.matchesPlayed < 0 || !Number.isInteger(player.matchesPlayed))
  ) {
    errors.push({
      row: rowNumber,
      field: 'Matches Played',
      message: 'Matches Played must be a non-negative integer',
    });
  }

  if (
    player.totalScore !== undefined &&
    (player.totalScore < 0 || !Number.isInteger(player.totalScore))
  ) {
    errors.push({
      row: rowNumber,
      field: 'Total Score',
      message: 'Total Score must be a non-negative integer',
    });
  }

  if (
    player.totalWickets !== undefined &&
    (player.totalWickets < 0 || !Number.isInteger(player.totalWickets))
  ) {
    errors.push({
      row: rowNumber,
      field: 'Total Wickets',
      message: 'Total Wickets must be a non-negative integer',
    });
  }

  // Validate photo URL if provided
  if (player.photoURL && player.photoURL.length > 0) {
    if (!isValidURL(player.photoURL)) {
      errors.push({
        row: rowNumber,
        field: 'Photo URL',
        message: 'Photo URL must be a valid URL',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all player data in bulk
 * @param players - Array of parsed player data
 * @returns Combined validation result
 */
export function validateBulkPlayerData(
  players: ParsedPlayerData[]
): ValidationResult {
  const allErrors: ValidationError[] = [];

  players.forEach((player, index) => {
    const result = validatePlayerData(player, index + 2); // +2 because row 1 is header, index starts at 0
    allErrors.push(...result.errors);
  });

  // Check for duplicate names within the upload
  const nameMap = new Map<string, number[]>();
  players.forEach((player, index) => {
    const key = `${player.name.toLowerCase()}_${player.currentClub.toLowerCase()}`;
    if (!nameMap.has(key)) {
      nameMap.set(key, []);
    }
    nameMap.get(key)!.push(index + 2); // +2 for Excel row number
  });

  // Report duplicates within the file
  nameMap.forEach((rows, key) => {
    if (rows.length > 1) {
      rows.forEach((row) => {
        allErrors.push({
          row,
          field: 'Player Name',
          message: `Duplicate player found in rows: ${rows.join(', ')}`,
        });
      });
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Helper function to validate URL format
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

/**
 * Suggested positions for validation (optional feature)
 */
export const SUGGESTED_POSITIONS = [
  'Batsman',
  'Bowler',
  'All-rounder',
  'Wicket-keeper',
  'Batting All-rounder',
  'Bowling All-rounder',
];

/**
 * Suggested classes for validation (optional feature)
 */
export const SUGGESTED_CLASSES = [
  'Platinum',
  'Gold',
  'Silver',
  'Bronze',
  'Emerging',
];
