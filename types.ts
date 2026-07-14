
export interface Tournament {
  _id: string;
  name: string;
  year: number;
  company?: string;
  budgetPerTeam: number;
  squadSize: number;
  basePricePerPlayer: number;
  logoURL?: string;
  sport?: string; // e.g. 'cricket' | 'football' | 'basketball' etc.
  status: 'Draft' | 'Completed' | 'Setup' | 'Pending' | 'Live' | 'Paused';
  playerCardTemplates?: Array<{ id: string; name: string; pngUrl: string; layoutId?: string }>;
}

export interface Team {
  _id: string;
  tournamentId: string;
  name: string;
  shortCode: string;
  ownerName: string;
  initialBudget: number;
  currentBalance: number;
  playersPurchased: string[]; // Array of Player IDs
  logoURL: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface PlayerStats {
  matchesPlayed: number;
  totalScore: number;
  totalWickets: number;
}

export interface Player {
  _id:string;
  tournamentId: string;
  playerNo?: string;
  name: string;
  stats: PlayerStats;
  imageURL: string;
  isSold: boolean;
  finalPrice?: number;
  winningTeamId?: string;
}

export interface AuctionState {
  tournamentId: string;
  currentPlayerId: string | null;
  currentBid: number;
  winningTeamId: string | null;
  currentAuctionStatus: 'Pending' | 'Bidding' | 'Sold';
  history: Bid[];
}

export interface Bid {
  teamId: string;
  amount: number;
  timestamp: number;
}

export interface OverlayStyles {
  playerCard: {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    statLabelColor: string;
  };
  teamCard: {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    balanceColor: string;
  };
  bidInfo: {
    textColor: string;
    bidAmountColor: string;
  };
  fontFamily: string;
}

export interface OverlayTemplate {
  _id: string;
  name: string;
  description: string;
  imageURL: string;
  tags: string[];
  isPremium: boolean;
  styles: OverlayStyles;
}

export interface OverlayInstance {
  _id: string;
  name: string;
  templateName: string;
  status: 'Active';
  url: string;
}