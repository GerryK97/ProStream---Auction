import { PlayerModel } from '@/models/Player';
import type { TournamentPackageEntitlement } from '@/types';
import {
  PACKAGE_PLAYER_BLOCK_SIZE,
  calculateLimitIncreasePrice,
  type PackagePrices,
} from '@/lib/overlays/auctionPackagePricing';

export interface PlayerCapacity {
  /** Null when the package has not been purchased yet, meaning no cap applies. */
  playerLimit: number | null;
  currentPlayers: number;
  remaining: number | null;
}

export interface PlayerCapacityDenial {
  error: 'player_limit_exceeded';
  message: string;
  playerLimit: number;
  currentPlayers: number;
  requestedToAdd: number;
  remaining: number;
  /** Cost to unlock enough blocks for the attempted total. */
  upgradePrice: number;
  upgradeToLimit: number;
}

export async function countTournamentPlayers(tournamentId: string): Promise<number> {
  return PlayerModel.countDocuments({ tournamentId });
}

export function getEntitlement(tournament: unknown): TournamentPackageEntitlement | null {
  const entitlement = (tournament as { packageEntitlement?: TournamentPackageEntitlement } | null)?.packageEntitlement;
  return entitlement && Number.isFinite(entitlement.playerLimit) ? entitlement : null;
}

export async function getPlayerCapacity(tournamentId: string, tournament: unknown): Promise<PlayerCapacity> {
  const entitlement = getEntitlement(tournament);
  const currentPlayers = await countTournamentPlayers(tournamentId);

  if (!entitlement) {
    return { playerLimit: null, currentPlayers, remaining: null };
  }

  return {
    playerLimit: entitlement.playerLimit,
    currentPlayers,
    remaining: Math.max(0, entitlement.playerLimit - currentPlayers),
  };
}

/**
 * Returns a denial payload when adding `countToAdd` players would exceed the
 * purchased allowance, or null when the add is allowed.
 *
 * Before the package is purchased there is no cap, so this always allows.
 * The whole batch is checked at once so a bulk import never partially applies
 * and leaves the tournament wedged against its own limit.
 */
export async function checkPlayerCapacity({
  tournamentId,
  tournament,
  countToAdd,
  prices,
}: {
  tournamentId: string;
  tournament: unknown;
  countToAdd: number;
  prices?: PackagePrices;
}): Promise<PlayerCapacityDenial | null> {
  const entitlement = getEntitlement(tournament);
  if (!entitlement) return null;
  if (countToAdd <= 0) return null;

  const currentPlayers = await countTournamentPlayers(tournamentId);
  const attemptedTotal = currentPlayers + countToAdd;
  if (attemptedTotal <= entitlement.playerLimit) return null;

  const remaining = Math.max(0, entitlement.playerLimit - currentPlayers);
  const upgradePrice = calculateLimitIncreasePrice(entitlement.playerLimit, attemptedTotal, prices);
  const upgradeToLimit = entitlement.playerLimit
    + Math.ceil((attemptedTotal - entitlement.playerLimit) / PACKAGE_PLAYER_BLOCK_SIZE) * PACKAGE_PLAYER_BLOCK_SIZE;

  return {
    error: 'player_limit_exceeded',
    message:
      `This tournament's package covers ${entitlement.playerLimit} players and currently has ${currentPlayers}. ` +
      `Adding ${countToAdd} would exceed it by ${attemptedTotal - entitlement.playerLimit}. ` +
      `Increase the player limit to ${upgradeToLimit} for ${upgradePrice} credits to continue.`,
    playerLimit: entitlement.playerLimit,
    currentPlayers,
    requestedToAdd: countToAdd,
    remaining,
    upgradePrice,
    upgradeToLimit,
  };
}
