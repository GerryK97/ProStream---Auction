import { BidIncrementRange } from '@/types';

/**
 * Given the bid increment bracket config and the current bid amount,
 * returns the increment amount for the next bid step.
 *
 * Ranges are ordered ascending by `upTo`. The first matching bracket wins.
 * If the current bid exceeds all brackets, the last bracket's increment is used.
 *
 * Example brackets:
 *   [{ upTo: 50000, increment: 5000 }, { upTo: 100000, increment: 10000 }, { upTo: Infinity, increment: 25000 }]
 *
 * currentBid=0      → 5000
 * currentBid=49000  → 5000
 * currentBid=50000  → 10000
 * currentBid=100000 → 25000
 */
export function getBidIncrement(
  bidIncrements: BidIncrementRange[],
  currentBid: number
): number {
  if (!bidIncrements || bidIncrements.length === 0) {
    // Sensible fallback when no brackets are configured
    return 1000;
  }

  const sorted = [...bidIncrements].sort((a, b) => a.upTo - b.upTo);

  for (const range of sorted) {
    if (currentBid < range.upTo) {
      return range.increment;
    }
  }

  // Current bid exceeds all configured brackets → use the last bracket
  return sorted[sorted.length - 1].increment;
}

/**
 * Compute the next bid amount for team bidding mode.
 */
export function getNextTeamBid(
  bidIncrements: BidIncrementRange[],
  currentBid: number,
  basePrice: number
): number {
  // If no bids yet, first bid must be at least the base price
  if (currentBid === 0) {
    return basePrice;
  }
  return currentBid + getBidIncrement(bidIncrements, currentBid);
}
