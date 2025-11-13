/**
 * ID Generator utility for creating unique IDs across the application
 */

/**
 * Generate a unique ID with a given prefix
 * Format: prefix + timestamp + random string
 * Example: user1699876543210a1b2c3d
 */
export const generateId = (prefix: string): string => {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate a user ID
 * Example: user1699876543210a1b2c3d
 */
export const generateUserId = (): string => {
  return generateId('user');
};

/**
 * Generate a tournament ID
 * Example: t1699876543210a1b2c3d
 */
export const generateTournamentId = (): string => {
  return generateId('t');
};

/**
 * Generate a team ID
 * Example: team1699876543210a1b2c3d
 */
export const generateTeamId = (): string => {
  return generateId('team');
};

/**
 * Generate a player ID
 * Example: p1699876543210a1b2c3d
 */
export const generatePlayerId = (): string => {
  return generateId('p');
};
