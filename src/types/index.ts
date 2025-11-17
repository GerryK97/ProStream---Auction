export type BasePriceStrategy = 'tournament-level' | 'player-class-based';

export interface PlayerClassConfig {
  code: string;           // Short code (user-defined, e.g., "PT", "AR-A", "BATB")
  name: string;           // e.g., "Platinum", "Gold", "Silver", "Bronze"
  basePrice?: number;     // Optional class-specific base price
  color: string;          // Hex color for badge display (e.g., "#FFD700")
  icon?: string;          // Optional icon/emoji
  order: number;          // Display order (lower = higher tier)
}

export interface Tournament {
  _id: string;
  name: string;
  year: number;
  budgetPerTeam: number;
  squadSize: number;
  basePricePerPlayer: number;
  logoURL?: string;
  createdBy?: string;                   // User ID who created the tournament
  status: 'Draft' | 'Completed' | 'Setup' | 'Pending' | 'Live' | 'Paused' | 'Stopped' | 'Archived';
  usePlayerClasses?: boolean;           // Toggle to enable/disable player classes
  playerClasses?: PlayerClassConfig[];  // Custom player classes for this tournament
  basePriceStrategy?: BasePriceStrategy; // Strategy for determining base prices (default: 'tournament-level')
}

// Master Team (Global Registry - never changes across tournaments)
export interface MasterTeam {
  _id: string;
  name: string;
  shortCode: string;
  ownerName: string;
  logoURL?: string;
  createdBy?: string; // User ID who created the master team
}

// Master Player (Global Registry - never changes across tournaments)
export interface MasterPlayer {
  _id: string;
  name: string;
  position: string;        // e.g., "Batsman", "Bowler", "All-rounder", "Wicket-keeper"
  currentClub: string;     // e.g., "Mumbai Indians"
  photoURL?: string;
  careerStats?: PlayerStats; // Career-wide stats
  suggestedClass?: string; // Suggested player class (used as default when adding to tournament)
  createdBy?: string;      // User ID who created the master player
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
  createdBy?: string;       // User ID who created the team
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
  _id: string;                  // Globally unique timestamp-based ID (e.g., "p1736723456789abc")
  playerNo?: string;            // Sequential number within tournament (e.g., "001", "002", "003")
  masterPlayerId?: string;      // Reference to MasterPlayer (optional for backward compatibility)
  tournamentId?: string | null;
  createdBy?: string;           // User ID who created the player
  // Copied from master (read-only - edit master to update)
  name: string;
  position?: string;
  currentClub?: string;
  photoURL?: string;            // Player photo (same field name as MasterPlayer)
  // Tournament-specific data
  stats: PlayerStats;           // Tournament stats (separate from career)
  playerClass?: string;         // Player class for this tournament (e.g., "Platinum", "Gold")
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

// Premium Player Card Customization Settings
export interface PremiumPlayerCardVisibility {
  showPlayerImage: boolean;
  showBackgroundText: boolean;
  showJerseyNumber: boolean;
  showDecorativeBadges: boolean;
  showPlayerName: boolean;
  showRoleLabel: boolean;
  showStatsSection: boolean;
  showMatches: boolean;
  showScore: boolean;
  showWickets: boolean;
}

export interface PremiumPlayerCardColors {
  gradientStart: string;
  gradientEnd: string;
  cardBackground: string;
  playerNameColor: string;
  statValueColor: string;
  statLabelColor: string;
  jerseyBadgeGradientStart: string;
  jerseyBadgeGradientEnd: string;
  decorativeBadgeColor: string;
  watermarkColor: string;
}

export interface PremiumPlayerCardLayout {
  cardSize: 'small' | 'medium' | 'large';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  opacity: number;
}

export interface PremiumPlayerCardContent {
  roleLabel: string;
  backgroundTextLine1: string;  // Custom text for watermark line 1
  backgroundTextLine2: string;  // Custom text for watermark line 2
  usePlayerNameAsWatermark: boolean;  // Use player name or custom text
}
