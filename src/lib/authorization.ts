import { User } from '@/types';

/**
 * Check if user can access a tournament
 * Admin can access all tournaments
 * Others can only access tournaments they're assigned to
 */
export function canAccessTournament(user: User | null | undefined, tournamentId: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.assignedTournaments.includes(tournamentId);
}

/**
 * Check if user can manage/edit a tournament
 * Only admin can manage tournaments
 */
export function canManageTournament(user: User | null | undefined, tournamentId: string): boolean {
  if (!user) return false;
  return user.role === 'admin';
}

/**
 * Check if user can manage users (assign tournaments, change roles, etc.)
 * Only admin can manage users
 */
export function canManageUsers(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin';
}

/**
 * Get list of tournament IDs user can access
 * For admin: returns empty (meaning all)
 * For others: returns their assigned tournaments
 */
export function getAccessibleTournamentIds(user: User | null | undefined): string[] | null {
  if (!user) return [];
  if (user.role === 'admin') return null; // null means all tournaments
  return user.assignedTournaments;
}
