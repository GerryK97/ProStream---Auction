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
  imageURL?: string;
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

// Overlay Management System Types
export type OverlayCategory =
  | 'player-info'
  | 'team-info'
  | 'auction-status'
  | 'tickers'
  | 'led-displays'
  | 'banners'
  | 'other';

export type OverlayType =
  | 'player-card'
  | 'premium-player-card'
  | 'teams'
  | 'ticker'
  | 'premium-ticker'
  | 'current-bid'
  | 'status'
  | 'leaderboard'
  | 'sale-banner'
  | 'sold-summary'
  | 'auction-overview'
  | 'player-highlight-led';

export type AnimationType = 'none' | 'fade' | 'slide' | 'zoom' | 'bounce';
export type AnimationDirection = 'up' | 'down' | 'left' | 'right';

export interface OverlayAnimation {
  entry: {
    type: AnimationType;
    direction?: AnimationDirection;
    duration: number; // milliseconds
  };
  exit: {
    type: AnimationType;
    direction?: AnimationDirection;
    duration: number;
  };
  loop?: boolean;
  loopDuration?: number;
}

export interface OverlayPosition {
  x: number; // pixels or percentage
  y: number;
  unit: 'px' | '%';
}

export interface OverlaySize {
  width: number;
  height: number;
  unit: 'px' | '%';
  aspectRatioLocked: boolean;
  preset?: '1080p' | '720p' | '4K' | 'custom';
}

export interface DisplayRule {
  _id: string;
  name: string;
  type: 'auction-state' | 'time-based' | 'event-based';
  condition: string; // JSON string of condition logic
  action: 'show' | 'hide';
  enabled: boolean;
}

export interface OverlayScene {
  _id: string;
  name: string;
  description: string;
  overlayIds: string[]; // Array of OverlayConfig IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface OverlayConfig {
  _id: string;
  name: string;
  description: string;
  overlayType: OverlayType;
  category: OverlayCategory;
  imageURL?: string; // Preview image
  isActive: boolean;
  isTemplate: boolean; // Whether this is a reusable template

  // Layout
  position: OverlayPosition;
  size: OverlaySize;
  zIndex: number;
  opacity: number; // 0-100

  // Customization
  parameters: Record<string, any>; // Dynamic parameters based on overlay type
  animations?: OverlayAnimation;
  displayRules?: DisplayRule[];

  // Association
  tournamentId?: string | null; // null for global templates
  sceneIds?: string[]; // Scenes this overlay belongs to

  // Metadata
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  version: number; // For version control
  parentConfigId?: string; // If cloned from another config

  // Usage tracking
  viewCount?: number;
  lastUsedAt?: Date;

  // Access control
  isLocked: boolean; // Prevent editing during live events
  allowedRoles?: string[]; // Roles that can edit this overlay
}

export interface OverlayTemplate {
  _id: string;
  name: string;
  description: string;
  overlayType: OverlayType;
  category: OverlayCategory;
  imageURL?: string;
  parameters: Record<string, any>;
  animations?: OverlayAnimation;
  isPublic: boolean; // Available to all users
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount?: number;
}

export interface OverlayHistory {
  _id: string;
  overlayConfigId: string;
  version: number;
  changes: Record<string, any>; // What was changed
  changedBy: string; // User ID
  changedAt: Date;
  comment?: string;
}

// Analytics
export interface OverlayAnalytics {
  overlayConfigId: string;
  displayCount: number;
  totalDisplayDuration: number; // milliseconds
  averageDisplayDuration: number;
  lastDisplayedAt: Date;
  errorCount: number;
  loadTime: number; // milliseconds
}
