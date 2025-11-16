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

  // Auction routes
  { path: '/auction', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/auction/setup', allowedRoles: ['Admin', 'Tournament'] },

  // Management routes
  { path: '/manage/tournaments', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/manage/teams', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/manage/players', allowedRoles: ['Admin', 'Tournament', 'MasterManager'] },

  // Overlay routes (accessible to all registered users)
  { path: '/overlays', allowedRoles: ['Admin', 'Tournament', 'MasterManager', 'Team', 'Player', 'Audience'] },
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
    // Wildcard match (e.g., /overlays/* matches /overlays/auction-overview)
    if (perm.path === '/overlays' && basePath.startsWith('/overlays')) return true;
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
      masterPlayer: ['create', 'read', 'update', 'delete', 'manage'],
      masterTeam: ['create', 'read', 'update', 'delete', 'manage'],
      auction: ['create', 'read', 'update', 'delete', 'manage'],
      user: ['create', 'read', 'update', 'delete', 'manage'],
    },
    Tournament: {
      tournament: ['read', 'update', 'manage'],
      team: ['create', 'read', 'update', 'delete', 'manage'],
      player: ['create', 'read', 'update', 'delete', 'manage'],
      auction: ['read', 'update', 'manage'],
      masterPlayer: ['read'],
      masterTeam: ['read'],
      user: [],
    },
    MasterManager: {
      masterPlayer: ['create', 'read', 'update', 'delete', 'manage'],
      masterTeam: ['create', 'read', 'update', 'delete', 'manage'],
      tournament: ['read'],
      team: ['read'],
      player: ['read'],
      auction: ['read'],
      user: [],
    },
    Team: {
      tournament: ['read'],
      team: ['read'],
      player: ['read'],
      masterPlayer: ['read'],
      masterTeam: ['read'],
      auction: ['read'],
      user: [],
    },
    Player: {
      tournament: ['read'],
      player: ['read'],
      masterPlayer: ['read'],
      auction: ['read'],
      team: [],
      masterTeam: [],
      user: [],
    },
    Audience: {
      auction: ['read'],
      tournament: ['read'],
      player: ['read'],
      team: ['read'],
      masterPlayer: [],
      masterTeam: [],
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
  return ['Admin', 'Tournament', 'MasterManager'].includes(userRole);
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
