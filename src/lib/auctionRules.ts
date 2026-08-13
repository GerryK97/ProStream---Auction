import type { Team, Tournament } from '@/types';
import { getMinClassBasePrice } from '@/lib/playerClassUtils';

export type TeamAuctionCapacity = {
  remainingSlots: number;
  maxBid: number;
  isSquadFull: boolean;
};

/**
 * Calculate the largest bid a team can make while preserving enough budget to
 * fill every remaining squad slot at the cheapest applicable base price.
 */
export function getTeamAuctionCapacity(
  team: Pick<Team, 'currentBalance' | 'playersPurchased'>,
  tournament: Pick<
    Tournament,
    'squadSize' | 'basePricePerPlayer' | 'basePriceStrategy' | 'usePlayerClasses' | 'playerClasses'
  >,
  purchasedCount = team.playersPurchased?.length ?? 0,
): TeamAuctionCapacity {
  const remainingSlots = Math.max(0, tournament.squadSize - purchasedCount);
  const balance = Math.max(0, team.currentBalance ?? 0);

  if (remainingSlots === 0) {
    return { remainingSlots, maxBid: 0, isSquadFull: true };
  }

  const reserveBasePrice = getMinClassBasePrice(tournament as Tournament);
  const maxBid = remainingSlots === 1
    ? balance
    : Math.max(0, balance - (remainingSlots - 1) * reserveBasePrice);

  return { remainingSlots, maxBid, isSquadFull: false };
}
