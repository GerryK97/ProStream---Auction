import { JWTPayload } from './auth';

export type UserRole = 'Admin' | 'Tournament' | 'Player' | 'Audience';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
}

const ALL_ROLES: UserRole[] = ['Admin', 'Tournament', 'Player', 'Audience'];

/**
 * Define which roles can access which routes
 */
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Public routes (no authentication required)
  { path: '/', allowedRoles: ALL_ROLES },
  { path: '/auth/login', allowedRoles: ALL_ROLES },
  { path: '/auth/signup', allowedRoles: ALL_ROLES },
  { path: '/contact', allowedRoles: ALL_ROLES },

  // Auction routes
  { path: '/auction', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/auction/setup', allowedRoles: ['Admin', 'Tournament'] },

  // Management routes
  { path: '/manage', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/manage/tournaments', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/manage/teams', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/manage/players', allowedRoles: ['Admin', 'Tournament'] },

  // Overlay redirect page - kept so /overlays still works for bookmarks
  { path: '/overlays', allowedRoles: ['Admin'] },

  // Output page - theme selection and overlay link generation
  { path: '/output', allowedRoles: ['Admin', 'Tournament'] },

  // User management (Admin only)
  { path: '/users', allowedRoles: ['Admin'] },

  // Overlay session manager
  { path: '/manage/overlays/sessions', allowedRoles: ['Admin'] },
  { path: '/manage/overlay-prices', allowedRoles: ['Admin'] },

  // InvoiceIt routes
  { path: '/invoiceit', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/invoiceit/', allowedRoles: ['Admin', 'Tournament'] },

  // API routes for InvoiceIt (allow through to be handled by route handlers)
  { path: '/api/invoices/', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/api/quotations/', allowedRoles: ['Admin', 'Tournament'] },
  { path: '/api/customers/', allowedRoles: ['Admin', 'Tournament'] },
  // All other /api/ routes (tournaments, teams, players, etc.)
  { path: '/api/', allowedRoles: ALL_ROLES },
];

/**
 * Check if a user has access to a specific route
 */
export function canAccessRoute(userRole: UserRole | string, path: string): boolean {
  const basePath = path.split('?')[0].replace(/\/$/, '') || '/';

  const permission = ROUTE_PERMISSIONS.find((perm) => {
    if (perm.path === basePath) return true;
    if (perm.path.length > 1 && perm.path.endsWith('/') && basePath.startsWith(perm.path)) return true;
    return false;
  });

  if (!permission) {
    return false;
  }

  return permission.allowedRoles.includes(userRole as UserRole);
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
      tournament: ['create', 'read', 'update'],
      team: ['create', 'read', 'update', 'delete', 'manage'],
      player: ['create', 'read', 'update', 'delete', 'manage'],
      auction: ['read', 'update', 'manage'],
      overlayConfig: ['create', 'read', 'update', 'delete'],
      invoice: ['create', 'read', 'update', 'delete'],
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
 * Check if user should be auto-approved on signup
 */
export function shouldAutoApproveRole(role: UserRole): boolean {
  return role !== 'Audience';
}

/**
 * Check if user can access a tournament
 */
export function canAccessTournament(
  userId: string,
  userRole: UserRole | string,
  tournament: { _id: string; createdBy?: string },
  assignedTournaments: string[] = []
): boolean {
  if (userRole === 'Admin') return true;
  return assignedTournaments.includes(tournament._id);
}

/**
 * Check if user can access a team
 */
export function canAccessTeam(
  userId: string,
  userRole: UserRole | string,
  team: { _id: string; tournamentId?: string; createdBy?: string },
  canAccessTournament: boolean
): boolean {
  if (userRole === 'Admin') return true;
  if (canAccessTournament) return true;
  if (team.createdBy === userId) return true;
  return false;
}

/**
 * Check if user can access a player
 */
export function canAccessPlayer(
  userId: string,
  userRole: UserRole | string,
  player: { _id: string; tournamentId?: string; createdBy?: string },
  canAccessTournament: boolean
): boolean {
  if (userRole === 'Admin') return true;
  if (canAccessTournament) return true;
  if (player.createdBy === userId) return true;
  return false;
}

/**
 * Check if user can modify (edit/delete) a resource
 */
export function canModifyResource(
  userId: string,
  userRole: UserRole | string,
  resource: { createdBy?: string }
): boolean {
  if (userRole === 'Admin') return true;
  if (resource.createdBy === userId) return true;
  return false;
}

/**
 * Check if user can transfer ownership
 */
export function canTransferOwnership(userRole: UserRole | string): boolean {
  return userRole === 'Admin';
}