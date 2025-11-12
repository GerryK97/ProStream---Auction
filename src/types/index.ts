
export interface Tournament {
  _id: string;
  name: string;
  year: number;
  budgetPerTeam: number;
  squadSize: number;
  basePricePerPlayer: number;
  logoURL?: string;
  status: 'Draft' | 'Completed' | 'Setup' | 'Pending' | 'Live' | 'Paused' | 'Stopped' | 'Archived';
}

// Master Team (Global Registry - never changes across tournaments)
export interface MasterTeam {
  _id: string;
  name: string;
  shortCode: string;
  ownerName: string;
  logoURL?: string;
}

// Master Player (Global Registry - never changes across tournaments)
export interface MasterPlayer {
  _id: string;
  name: string;
  position: string;        // e.g., "Batsman", "Bowler", "All-rounder", "Wicket-keeper"
  currentClub: string;     // e.g., "Mumbai Indians"
  photoURL?: string;
  careerStats?: PlayerStats; // Career-wide stats
}

export interface PlayerStats {
  matchesPlayed: number;
  totalScore: number;
  totalWickets: number;
}

// Tournament Team (Tournament-specific instance - READ ONLY after creation)
export interface Team {
  _id: string;
  masterTeamId?: string;    // Reference to MasterTeam (optional for backward compatibility)
  tournamentId?: string | null;
  // Copied from master (read-only - edit master to update)
  name: string;
  shortCode: string;
  ownerName: string;
  logoURL?: string;
  // Tournament-specific data
  initialBudget?: number;
  currentBalance?: number;
  playersPurchased?: string[]; // Array of Player IDs
}

// Tournament Player (Tournament-specific instance - READ ONLY after creation)
export interface Player {
  _id: string;
  masterPlayerId?: string;  // Reference to MasterPlayer (optional for backward compatibility)
  tournamentId?: string | null;
  // Copied from master (read-only - edit master to update)
  name: string;
  position?: string;
  currentClub?: string;
  photoURL?: string;        // Player photo (same field name as MasterPlayer)
  // Tournament-specific data
  stats: PlayerStats;       // Tournament stats (separate from career)
  isSold?: boolean;
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
