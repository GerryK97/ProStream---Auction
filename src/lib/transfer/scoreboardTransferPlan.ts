/**
 * scoreboardTransferPlan.ts
 *
 * Builds the complete plan for transferring a finished Auction into the
 * Scoreboard. Pure and I/O-free: callers pass already-loaded Mongo documents,
 * so the same code produces the read-only preview and drives the transactional
 * write. That guarantees the operator confirms exactly what gets inserted.
 *
 * Scope (agreed with the product owner):
 *   - fresh Scoreboard tournament every time
 *   - sold players only; unsold are dropped
 *   - no player_directory linking (ad-hoc players)
 *   - no team officials
 *   - cricket only
 */

import type { Player, Team, Tournament } from '@/types';
import {
  deriveDisplayName,
  deriveShortCode,
  mapBattingStyle,
  mapBowlingStyle,
  mapPlayerRole,
  normalizeImageRef,
  type ScoreboardBattingStyle,
  type ScoreboardBowlingStyle,
  type ScoreboardPlayerRole,
} from './scoreboardMapping';

/** A value that had to be approximated, surfaced to the operator before writing. */
export interface TransferWarning {
  scope: 'team' | 'player' | 'tournament';
  /** Auction entity name, for a human-readable preview row. */
  subject: string;
  field: string;
  note: string;
}

/** A player excluded from the transfer, with the reason. */
export interface SkippedPlayer {
  playerId: string;
  name: string;
  reason: string;
}

export interface PlannedPlayer {
  auctionPlayerId: string;
  name: string;
  displayName: string;
  role: ScoreboardPlayerRole;
  position: string | null;
  battingStyle: ScoreboardBattingStyle;
  bowlingStyle: ScoreboardBowlingStyle | null;
  headshotCloudinaryId: string | null;
}

export interface PlannedTeam {
  auctionTeamId: string;
  name: string;
  shortCode: string;
  logoCloudinaryId: string | null;
  players: PlannedPlayer[];
}

export interface PlannedTournament {
  name: string;
  shortName: string;
  logoCloudinaryId: string | null;
  /** "Basic tournament" defaults agreed for the first release. */
  format: 'T20';
  cricketMode: 'professional';
  ballType: 'tennis';
  discipline: 'soft';
  statsMode: 'basic';
  totalOvers: 20;
  status: 'upcoming';
}

export interface TransferPlan {
  tournament: PlannedTournament;
  teams: PlannedTeam[];
  warnings: TransferWarning[];
  skippedPlayers: SkippedPlayer[];
  totals: {
    teams: number;
    players: number;
    skipped: number;
    warnings: number;
  };
}

/** Blocking problems. A plan with any of these must not be written. */
export interface TransferBlocker {
  code:
    | 'NOT_CRICKET'
    | 'NO_TEAMS'
    | 'NO_SOLD_PLAYERS'
    | 'TEAM_WITHOUT_PLAYERS';
  message: string;
}

export interface PlanResult {
  plan: TransferPlan;
  blockers: TransferBlocker[];
}

/** Scoreboard `tournaments.short_name` is varchar(20). */
function deriveTournamentShortName(name: string): string {
  const cleaned = name.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= 20) return cleaned || 'Tournament';

  // Prefer initials of significant words, e.g.
  // "Talawakelle Premier League 2026" -> "TPL 2026".
  const words = cleaned.split(' ');
  const yearMatch = cleaned.match(/\b(19|20)\d{2}\b/);
  const initials = words
    .filter(w => !/^(19|20)\d{2}$/.test(w) && w.length > 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  const candidate = yearMatch ? `${initials} ${yearMatch[0]}` : initials;
  return (candidate.trim() || cleaned).slice(0, 20);
}

/**
 * Build the transfer plan.
 *
 * @param tournament Auction tournament (Mongo doc)
 * @param teams      Auction teams for that tournament
 * @param players    All Auction players for that tournament (sold and unsold)
 */
export function buildTransferPlan(
  tournament: Tournament,
  teams: Team[],
  players: Player[],
): PlanResult {
  const warnings: TransferWarning[] = [];
  const skippedPlayers: SkippedPlayer[] = [];
  const blockers: TransferBlocker[] = [];

  // ── Cricket only ────────────────────────────────────────────────────────────
  const sport = (tournament.sport ?? 'cricket').toLowerCase();
  if (sport !== 'cricket') {
    blockers.push({
      code: 'NOT_CRICKET',
      message: `The Scoreboard transfer currently supports cricket only. This tournament's sport is "${tournament.sport}".`,
    });
  }

  // ── Sold players, grouped by team ───────────────────────────────────────────
  const soldByTeam = new Map<string, Player[]>();
  for (const player of players) {
    if (!player.isSold) {
      // Unsold and still-available players are dropped by design.
      skippedPlayers.push({
        playerId: player._id,
        name: player.name,
        reason: player.isUnsold ? 'Unsold in the auction' : 'Never sold (still available)',
      });
      continue;
    }
    if (!player.winningTeamId) {
      skippedPlayers.push({
        playerId: player._id,
        name: player.name,
        reason: 'Marked sold but has no winning team',
      });
      continue;
    }
    if (!player.name?.trim()) {
      skippedPlayers.push({
        playerId: player._id,
        name: '(unnamed)',
        reason: 'Player has no name; the Scoreboard requires one',
      });
      continue;
    }

    const bucket = soldByTeam.get(player.winningTeamId);
    if (bucket) bucket.push(player);
    else soldByTeam.set(player.winningTeamId, [player]);
  }

  // ── Teams ───────────────────────────────────────────────────────────────────
  const takenShortCodes = new Set<string>();
  const plannedTeams: PlannedTeam[] = [];

  // Stable ordering keeps short-code collision resolution deterministic.
  const orderedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  for (const team of orderedTeams) {
    const squad = soldByTeam.get(team._id) ?? [];

    const code = deriveShortCode(team.shortCode, team.name, takenShortCodes);
    if (!code.exact && code.note) {
      warnings.push({ scope: 'team', subject: team.name, field: 'Short code', note: code.note });
    }

    const plannedPlayers: PlannedPlayer[] = squad.map(player => {
      const role = mapPlayerRole(player.position);
      const batting = mapBattingStyle(player.battingStyle);
      const bowling = mapBowlingStyle(player.bowlingStyle);

      if (!role.exact && role.note) {
        warnings.push({ scope: 'player', subject: player.name, field: 'Role', note: role.note });
      }
      if (!batting.exact && batting.note) {
        warnings.push({ scope: 'player', subject: player.name, field: 'Batting style', note: batting.note });
      }
      if (!bowling.exact && bowling.note) {
        warnings.push({ scope: 'player', subject: player.name, field: 'Bowling style', note: bowling.note });
      }

      return {
        auctionPlayerId: player._id,
        name: player.name.trim(),
        displayName: deriveDisplayName(player.name),
        role: role.value,
        position: player.position?.trim() || null,
        battingStyle: batting.value,
        bowlingStyle: bowling.value,
        headshotCloudinaryId: normalizeImageRef(player.photoURL ?? player.secondaryImageURL),
      };
    });

    plannedTeams.push({
      auctionTeamId: team._id,
      name: team.name.trim(),
      shortCode: code.value,
      logoCloudinaryId: normalizeImageRef(team.logoURL),
      players: plannedPlayers,
    });
  }

  // ── Blocking validation ─────────────────────────────────────────────────────
  if (plannedTeams.length === 0) {
    blockers.push({ code: 'NO_TEAMS', message: 'This auction has no teams to transfer.' });
  }

  const totalPlayers = plannedTeams.reduce((sum, t) => sum + t.players.length, 0);
  if (totalPlayers === 0) {
    blockers.push({
      code: 'NO_SOLD_PLAYERS',
      message: 'No players were sold in this auction, so there are no squads to build.',
    });
  }

  // An empty team is legal in the Scoreboard but almost always a mistake here,
  // so surface it as a warning rather than silently creating an empty squad.
  for (const team of plannedTeams) {
    if (team.players.length === 0) {
      warnings.push({
        scope: 'team',
        subject: team.name,
        field: 'Squad',
        note: 'No players were sold to this team; it will be created with an empty squad.',
      });
    }
  }

  const plan: TransferPlan = {
    tournament: {
      name: tournament.name.trim(),
      shortName: deriveTournamentShortName(tournament.name),
      logoCloudinaryId: normalizeImageRef(tournament.logoURL),
      format: 'T20',
      cricketMode: 'professional',
      ballType: 'tennis',
      discipline: 'soft',
      statsMode: 'basic',
      totalOvers: 20,
      status: 'upcoming',
    },
    teams: plannedTeams,
    warnings,
    skippedPlayers,
    totals: {
      teams: plannedTeams.length,
      players: totalPlayers,
      skipped: skippedPlayers.length,
      warnings: warnings.length,
    },
  };

  return { plan, blockers };
}
