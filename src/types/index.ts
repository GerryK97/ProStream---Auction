export type BasePriceStrategy = 'tournament-level' | 'player-class-based';

export interface PlayerClassConfig {
  code: string;           // Short code (user-defined, e.g., "PT", "AR-A", "BATB")
  name: string;           // e.g., "Platinum", "Gold", "Silver", "Bronze"
  basePrice?: number;     // Optional class-specific base price
  color: string;          // Hex color for badge display (e.g., "#FFD700")
  icon?: string;          // Optional icon/emoji
  order: number;          // Display order (lower = higher tier)
}

export interface BidIncrementRange {
  upTo: number;        // Exclusive ceiling. e.g. 50000 means bids below 50,000.
  increment: number;   // Step size in this range, e.g. 5000.
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
  overlayTheme?: 'standard' | 'premium' | 'neon'; // Overlay theme for OBS browser source
  overlayPalette?: string; // e.g. 'default', 'ocean', 'crimson'
  biddingMode?: 'direct' | 'team'; // 'direct' = typed input (default), 'team' = per-team bid buttons
  bidIncrements?: BidIncrementRange[]; // Ordered list of price ranges and their increment steps
}

export interface Team {
  _id: string;
  tournamentId: string;
  createdBy?: string;
  name: string;
  shortCode: string;
  ownerName: string;
  logoURL?: string;
  initialBudget?: number;
  currentBalance?: number;
  playersPurchased?: string[];
}

export interface Player {
  _id: string;
  playerNo?: string;
  tournamentId: string;
  createdBy?: string;
  name: string;
  position?: string;
  currentClub?: string;
  photoURL?: string;
  secondaryImageURL?: string;
  playerClass?: string;
  age?: number;
  isSold?: boolean;
  isUnsold?: boolean;
  finalPrice?: number;
  winningTeamId?: string;
  isIconic?: boolean;
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
  teamId: string | null;
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
  | 'team-wise-summary'
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

// Overlay Library - Catalog of available overlay templates
export interface ParameterOption {
  type: 'select' | 'color' | 'toggle' | 'text' | 'number';
  label: string;
  options?: string[];
  description?: string;
  min?: number;
  max?: number;
  default?: any;
}

export interface OverlayLibraryItem {
  _id: string;
  name: string;
  description: string;
  route: string; // Route to the overlay page (e.g., '/overlays/player-card')
  tags: string[];
  category: string; // 'Player Display', 'Team Display', etc.
  defaultParams: Record<string, any>;
  parameterSchema: Record<string, ParameterOption>;
  imageURL?: string; // Preview image URL
  dimensions: {
    width: number;
    height: number;
  };
  isActive: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
