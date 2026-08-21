/**
 * Team officials helpers — shared between team APIs and overlays.
 *
 * Officials (Owner / Manager / Captain) are the source of truth, but legacy
 * teams only have `ownerName`. These helpers bridge the two so overlays and
 * queries work with zero data migration.
 */

import {
  DEFAULT_TEAM_OFFICIALS_CONFIG,
  TEAM_OFFICIAL_ROLES,
  type Team,
  type TeamOfficial,
  type TeamOfficialRole,
  type TeamOfficialsConfig,
  type Tournament,
} from '@/types';

export function isTeamOfficialRole(value: unknown): value is TeamOfficialRole {
  return typeof value === 'string' && (TEAM_OFFICIAL_ROLES as string[]).includes(value);
}

/** Resolve a tournament's officials config, falling back to the Owner-only default. */
export function resolveTeamOfficialsConfig(
  tournament: Pick<Tournament, 'teamOfficialsConfig'> | null | undefined,
): TeamOfficialsConfig {
  const cfg = tournament?.teamOfficialsConfig;
  const enabledRoles = Array.isArray(cfg?.enabledRoles)
    ? cfg!.enabledRoles.filter(isTeamOfficialRole)
    : [];
  const requiredRoles = Array.isArray(cfg?.requiredRoles)
    ? cfg!.requiredRoles.filter(isTeamOfficialRole)
    : [];
  if (enabledRoles.length === 0) {
    return { ...DEFAULT_TEAM_OFFICIALS_CONFIG };
  }
  // required must be a subset of enabled
  return {
    enabledRoles,
    requiredRoles: requiredRoles.filter((r) => enabledRoles.includes(r)),
  };
}

/**
 * Get a team's officials, preserving canonical role order (Owner, Manager, Captain).
 * Falls back to a synthesized Owner from `ownerName` when a team has no officials
 * array (legacy data).
 */
export function getTeamOfficials(
  team: Pick<Team, 'officials' | 'ownerName'> | null | undefined,
): TeamOfficial[] {
  if (!team) return [];
  const raw = Array.isArray(team.officials) ? team.officials : [];
  const cleaned = raw
    .filter((o): o is TeamOfficial => !!o && isTeamOfficialRole(o.role) && typeof o.name === 'string' && o.name.trim() !== '')
    .map((o) => ({ role: o.role, name: o.name.trim(), photoURL: o.photoURL?.trim() || undefined }));

  if (cleaned.length > 0) {
    return sortByRole(cleaned);
  }
  // Legacy fallback: synthesize an Owner from ownerName
  if (team.ownerName && team.ownerName.trim() !== '') {
    return [{ role: 'Owner', name: team.ownerName.trim() }];
  }
  return [];
}

/**
 * Officials to actually display: only those whose role is enabled for the
 * tournament, in canonical order.
 */
export function getEnabledTeamOfficials(
  team: Pick<Team, 'officials' | 'ownerName'> | null | undefined,
  tournament: Pick<Tournament, 'teamOfficialsConfig'> | null | undefined,
): TeamOfficial[] {
  const { enabledRoles } = resolveTeamOfficialsConfig(tournament);
  return getTeamOfficials(team).filter((o) => enabledRoles.includes(o.role));
}

/** Find a single official by role (post-fallback). */
export function getOfficialByRole(
  team: Pick<Team, 'officials' | 'ownerName'> | null | undefined,
  role: TeamOfficialRole,
): TeamOfficial | undefined {
  return getTeamOfficials(team).find((o) => o.role === role);
}

/** Derive `ownerName` for back-compat from an officials array. */
export function deriveOwnerName(officials: TeamOfficial[] | undefined | null): string {
  const list = Array.isArray(officials) ? officials : [];
  const owner = list.find((o) => o.role === 'Owner' && o.name?.trim());
  if (owner) return owner.name.trim();
  const first = list.find((o) => o.name?.trim());
  return first ? first.name.trim() : '';
}

function sortByRole(officials: TeamOfficial[]): TeamOfficial[] {
  const order = new Map(TEAM_OFFICIAL_ROLES.map((r, i) => [r, i] as const));
  return [...officials].sort((a, b) => (order.get(a.role) ?? 99) - (order.get(b.role) ?? 99));
}

/**
 * Normalize a submitted teamOfficialsConfig for storage. Owner is always
 * enabled and required (protects legacy behavior + guarantees a display name).
 * Required roles are constrained to the enabled set.
 */
export function normalizeTeamOfficialsConfig(input: unknown): TeamOfficialsConfig {
  const raw = input as Partial<TeamOfficialsConfig> | undefined;
  const enabled = new Set<TeamOfficialRole>(['Owner']);
  const required = new Set<TeamOfficialRole>(['Owner']);

  if (Array.isArray(raw?.enabledRoles)) {
    for (const r of raw!.enabledRoles) if (isTeamOfficialRole(r)) enabled.add(r);
  }
  if (Array.isArray(raw?.requiredRoles)) {
    for (const r of raw!.requiredRoles) if (isTeamOfficialRole(r) && enabled.has(r)) required.add(r);
  }

  const enabledRoles = TEAM_OFFICIAL_ROLES.filter((r) => enabled.has(r));
  const requiredRoles = TEAM_OFFICIAL_ROLES.filter((r) => required.has(r));
  return { enabledRoles, requiredRoles };
}

/**
 * Validate + normalize submitted officials against a tournament config.
 * Returns cleaned officials (enabled-only, trimmed) or an error message.
 */
export function validateAndNormalizeOfficials(
  submitted: unknown,
  config: TeamOfficialsConfig,
  legacyOwnerName?: string,
): { officials: TeamOfficial[] } | { error: string } {
  const list = Array.isArray(submitted) ? submitted : [];

  const seen = new Set<TeamOfficialRole>();
  const cleaned: TeamOfficial[] = [];

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: unknown }).role;
    const name = (item as { name?: unknown }).name;
    const photoURL = (item as { photoURL?: unknown }).photoURL;
    if (!isTeamOfficialRole(role)) continue;
    if (!config.enabledRoles.includes(role)) {
      return { error: `Official role "${String(role)}" is not enabled for this tournament.` };
    }
    if (seen.has(role)) {
      return { error: `Duplicate official role "${role}". Only one per role is allowed.` };
    }
    seen.add(role);
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (trimmedName === '') continue; // skip empty; requiredness checked below
    cleaned.push({
      role,
      name: trimmedName,
      photoURL: typeof photoURL === 'string' && photoURL.trim() !== '' ? photoURL.trim() : undefined,
    });
  }

  // Legacy: if Owner is enabled/required but only ownerName was sent, adopt it.
  if (!cleaned.some((o) => o.role === 'Owner') && config.enabledRoles.includes('Owner') && legacyOwnerName?.trim()) {
    cleaned.push({ role: 'Owner', name: legacyOwnerName.trim() });
  }

  // Required-role enforcement
  for (const role of config.requiredRoles) {
    if (!cleaned.some((o) => o.role === role)) {
      return { error: `${role} is required for teams in this tournament.` };
    }
  }

  return { officials: sortByRole(cleaned) };
}
