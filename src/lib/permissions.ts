import { JWTPayload } from './auth';

export type UserRole = 'Admin' | 'Tournament' | 'MasterManager' | 'Team' | 'Player' | 'Audience';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
}

/**
 * Define which roles can access which routes
 */
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Public routes (no authentication required)
  { path: '/', allowedRoles: ['Admin', 'Tournament', 'MasterManager', 'Team', 'Player', 'Audience'] },
  { path: '/auth/login', allowedRoles: ['Admin', 'Tournament', 'MasterManager', 'Team', 'Player', 'Audience'] },
  { path: '/auth/signup', allowedRoles: ['Admin', 'Tournament', 'MasterManager', 'Team', 'Player', 'Audience'] },
  { path: '/contact', allowedRoles: ['Admin', 'Tournament', 'MasterManager', 'Team', 'Player', 'Audience'] },

  // Auction routes
  { path: '/auction', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/auction/setup', allowedRoles: ['Admin', 'Tournament'] },

  // Management routes
  { path: '/manage', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/manage/tournaments', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/manage/teams', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/manage/players', allowedRoles: ['Admin', 'Tournament'] },

  // Overlay management page (Admin only - this is where overlay URLs are generated)
  { path: '/overlays', allowedRoles: ['Admin'] },
  // Overlay viewer sub-paths (all registered users - for in-browser preview)
  { path: '/overlays/', allowedRoles: ['Admin', 'Tournament', 'MasterManager', 'Team', 'Player', 'Audience'] },

  // User management (Admin only)
  { path: '/users', allowedRoles: ['Admin'] },
];

/**
 * Check if a user has access to a specific route
 */
export function canAccessRoute(userRole: UserRole | string, path: string): boolean {
  // Extract the base path (remove trailing slash and query params)
  const basePath = path.split('?')[0].replace(/\/$/, '') || '/';

  const permission = ROUTE_PERMISSIONS.find((perm) => {
    // Exact match
    if (perm.path === basePath) return true;
    // Trailing-slash prefix match (e.g., '/overlays/' matches '/overlays/abc123' and sub-paths)
    if (perm.path.endsWith('/') && basePath.startsWith(perm.path)) return true;
    return false;
  });

  if (!permission) {
    // If no specific permission found, deny access (default deny)
    return false;
  }

  return permission.allowedRoles.includes(userRole as any);
}

/**
 * Check if a user can perform an action on a resource
 */
export function canPerformAction(
  userRole: UserRole | string,
  action: Action,
  resourceType: string
): boolean {
  const permissions: Record<string, Record<string, Action[]>> = {
    Admin: {
      tournament: ['create', 'read', 'update', 'delete', 'manage'],
      team: ['create', 'read', 'update', 'delete', 'manage'],
      player: ['create', 'read', 'update', 'delete', 'manage'],
      auction: ['create', 'read', 'update', 'delete', 'manage'],
      user: ['create', 'read', 'update', 'delete', 'manage'],
      overlayConfig: ['create', 'read', 'update', 'delete', 'manage'],
      invoice: ['create', 'read', 'update', 'delete', 'manage'],
    },
    Tournament: {
      tournament: ['create', 'read'],
      team: ['create', 'read', 'update', 'delete', 'manage'],
      player: ['create', 'read', 'update', 'delete', 'manage'],
      auction: ['read', 'update', 'manage'],
      overlayConfig: ['create', 'read', 'update', 'delete'],
      invoice: ['create', 'read', 'update', 'delete'],
      user: [],
    },
    Team: {
      tournament: ['read'],
      team: ['read'],
      player: ['read'],
      auction: ['read'],
      overlayConfig: ['read'],
      user: [],
    },
    Player: {
      tournament: ['read'],
      player: ['read'],
      auction: ['read'],
      overlayConfig: ['read'],
      team: [],
      user: [],
    },
    Audience: {
      auction: ['read'],
      tournament: ['read'],
      player: ['read'],
      team: ['read'],
      overlayConfig: ['read'],
      user: [],
    },
  };

  const userPermissions = permissions[userRole] || {};
  const resourceActions = userPermissions[resourceType] || [];

  return resourceActions.includes(action);
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole | string): boolean {
  return userRole === 'Admin';
}

/**
 * Check if user can manage resources
 */
export function canManageResources(userRole: UserRole | string): boolean {
  return ['Admin', 'Tournament'].includes(userRole);
}

/**
 * Get allowed tournaments for a user
 */
export function getAllowedTournaments(
  userRole: UserRole,
  assignedTournaments: string[] | undefined,
  allTournaments: string[]
): string[] {
  if (userRole === 'Admin') {
    return allTournaments;
  }
  if (userRole === 'Tournament') {
    return assignedTournaments || [];
  }
  return [];
}

/**
 * Get allowed teams for a user
 */
export function getAllowedTeams(
  userRole: UserRole,
  assignedTeams: string[] | undefined,
  allTeams: string[]
): string[] {
  if (userRole === 'Admin') {
    return allTeams;
  }
  if (userRole === 'Team') {
    return assignedTeams || [];
  }
  return [];
}

/**
 * Check if user should be auto-approved on signup
 */
export function shouldAutoApproveRole(role: UserRole): boolean {
  return role !== 'Audience';
}

/**
 * Check if user can access a tournament
 * User can access if:
 * - User is Admin (can access all)
 * - User created the tournament (createdBy === userId)
 * - Tournament is assigned to user (in assignedTournaments)
 */
export function canAccessTournament(
  userId: string,
  userRole: UserRole | string,
  tournament: { _id: string; createdBy?: string },
  assignedTournaments: string[] = []
): boolean {
  // Admin can access all tournaments
  if (userRole === 'Admin') return true;

  // User can access if they created it
  if (tournament.createdBy === userId) return true;

  // User can access if it's assigned to them
  if (assignedTournaments.includes(tournament._id)) return true;

  return false;
}

/**
 * Check if user can access a team
 * User can access if:
 * - User is Admin (can access all)
 * - User has access to team's tournament
 * - User created the team (createdBy === userId)
 */
export function canAccessTeam(
  userId: string,
  userRole: UserRole | string,
  team: { _id: string; tournamentId?: string; createdBy?: string },
  canAccessTournament: boolean
): boolean {
  // Admin can access all teams
  if (userRole === 'Admin') return true;

  // User can access if tournament is accessible
  if (canAccessTournament) return true;

  // User can access if they created the team
  if (team.createdBy === userId) return true;

  return false;
}

/**
 * Check if user can access a player
 * User can access if:
 * - User is Admin (can access all)
 * - User has access to player's tournament
 * - User created the player (createdBy === userId)
 */
export function canAccessPlayer(
  userId: string,
  userRole: UserRole | string,
  player: { _id: string; tournamentId?: string; createdBy?: string },
  canAccessTournament: boolean
): boolean {
  // Admin can access all players
  if (userRole === 'Admin') return true;

  // User can access if tournament is accessible
  if (canAccessTournament) return true;

  // User can access if they created the player
  if (player.createdBy === userId) return true;

  return false;
}

/**
 * Check if user can modify (edit/delete) a resource
 * User can modify if:
 * - User is Admin (can modify all)
 * - User created the resource (createdBy === userId)
 */
export function canModifyResource(
  userId: string,
  userRole: UserRole | string,
  resource: { createdBy?: string }
): boolean {
  // Admin can modify all
  if (userRole === 'Admin') return true;

  // User can modify if they created it
  if (resource.createdBy === userId) return true;

  return false;
}

/**
 * Check if user can transfer ownership
 * Only Admin can transfer ownership
 */
export function canTransferOwnership(userRole: UserRole | string): boolean {
  return userRole === 'Admin';
}
