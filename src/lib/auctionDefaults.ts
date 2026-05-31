import { AuctionState } from '@/types';

export const EMPTY_AUCTION_STATE: AuctionState = {
  tournamentId: '',
  currentPlayerId: null,
  currentBid: 0,
  winningTeamId: null,
  currentAuctionStatus: 'Pending',
  history: [],
  currentAuctionClass: null,
  completedClasses: [],
};

export const AUCTION_BOOTSTRAP_CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=5',
};
