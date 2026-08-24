import { JWTPayload } from './auth';

export type UserRole = 'Admin' | 'Operator' | 'Scorer' | 'Player' | 'Audience';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
}

const ALL_ROLES: UserRole[] = ['Admin', 'Operator', 'Scorer', 'Player', 'Audience'];

// JWTs minted before the schema migration may still carry `Tournament` until
// they expire. Treat that legacy claim as Operator at authorization boundaries.
function normalizeRole(role: UserRole | string): UserRole | string {
  return role === 'Tournament' ? 'Operator' : role;
}

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
  { path: '/auction', allowedRoles: ['Admin', 'Operator'] },
  { path: '/auction/setup', allowedRoles: ['Admin', 'Operator'] },

  // Management routes
  { path: '/manage', allowedRoles: ['Admin', 'Operator'] },
  { path: '/manage/tournaments', allowedRoles: ['Admin', 'Operator'] },
  { path: '/manage/teams', allowedRoles: ['Admin', 'Operator'] },
  { path: '/manage/players', allowedRoles: ['Admin', 'Operator'] },

  // Overlay redirect page - kept so /overlays still works for bookmarks
  { path: '/overlays', allowedRoles: ['Admin'] },

  // Output page - theme selection and overlay link generation for accessible tournaments
  { path: '/output', allowedRoles: ALL_ROLES },

  // User management (Admin only)
  { path: '/users', allowedRoles: ['Admin'] },

  // Overlay session manager
  { path: '/manage/overlays/sessions', allowedRoles: ['Admin'] },
  { path: '/manage/overlay-prices', allowedRoles: ['Admin'] },

  // InvoiceIt routes
  { path: '/invoiceit', allowedRoles: ['Admin', 'Operator'] },
  { path: '/invoiceit/', allowedRoles: ['Admin', 'Operator'] },

  // API routes for InvoiceIt (allow through to be handled by route handlers)
  { path: '/api/invoices/', allowedRoles: ['Admin', 'Operator'] },
  { path: '/api/quotations/', allowedRoles: ['Admin', 'Operator'] },
  { path: '/api/customers/', allowedRoles: ['Admin', 'Operator'] },
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

  return permission.allowedRoles.includes(normalizeRole(userRole) as UserRole);
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
    Operator: {
      tournament: ['create', 'read', 'update'],
      team: ['create', 'read', 'update', 'delete', 'manage'],
      player: ['create', 'read', 'update', 'delete', 'manage'],
      auction: ['read', 'update', 'manage'],
      overlayConfig: ['create', 'read', 'update', 'delete'],
      invoice: ['create', 'read', 'update', 'delete'],
      user: [],
    },
    Scorer: {
      tournament: ['read'],
      player: ['read'],
      auction: ['read'],
      overlayConfig: ['read'],
      team: ['read'],
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

  const userPermissions = permissions[normalizeRole(userRole)] || {};
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
  return ['Admin', 'Operator'].includes(normalizeRole(userRole));
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
  if (userRole === 'Operator') {
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
  tournament: { _id: string | { toString(): string }; createdBy?: string },
  assignedTournaments: string[] = []
): boolean {
  if (userRole === 'Admin') return true;
  const tournamentId = tournament._id.toString();
  if (tournament.createdBy === userId) return true;
  return assignedTournaments.includes(tournamentId);
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
