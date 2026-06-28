/**
 * Pusher Event Types for ProStream Auction
 *
 * This file defines all the event types and payloads used for real-time
 * communication between the Auction Control Panel and Overlays via Pusher.
 */

import type { Tournament, Player, Team, AuctionState } from './index';

/**
 * All possible event names that can be triggered on a tournament channel
 */
export type PusherEventName =
  | 'auction:started'
  | 'auction:stopped'
  | 'auction:restarted'
  | 'auction:player-selected'
  | 'auction:bid-placed'
  | 'auction:player-sold'
  | 'auction:reset'
  | 'auction:undo'
  | 'auction:player-unsold'
  | 'auction:state-update'
  | 'auction:class-selected'
  | 'auction:class-completed'
  | 'overlay:settings'
  | 'overlay:wheel-spin';

/**
 * Base interface for all Pusher events
 */
export interface BasePusherEvent {
  tournamentId: string;
  timestamp: number;
}

/**
 * Event: auction:started
 * Triggered when an auction is started
 */
export interface AuctionStartedEvent extends BasePusherEvent {
  tournament: Tournament;
  teams: Team[];
  players: Player[];
  auctionState: AuctionState;
  message: string;
}

/**
 * Event: auction:stopped
 * Triggered when an auction is paused/stopped
 */
export interface AuctionStoppedEvent extends BasePusherEvent {
  tournament: Tournament;
  auctionState: AuctionState | null;
  message: string;
}

/**
 * Event: auction:restarted
 * Triggered when a stopped auction is restarted
 */
export interface AuctionRestartedEvent extends BasePusherEvent {
  tournament: Tournament;
  auctionState: AuctionState | null;
  message: string;
}

/**
 * Event: auction:player-selected
 * Triggered when a new player is selected for auction
 */
export interface PlayerSelectedEvent extends BasePusherEvent {
  currentPlayer: Player;
  basePrice: number;
  auctionState: AuctionState;
  message: string;
}

/**
 * Event: auction:bid-placed
 * Triggered when a new bid is placed
 */
export interface BidPlacedEvent extends BasePusherEvent {
  auctionState: AuctionState;
  currentPlayer: Player;
  winningTeam: Team | null;
  currentBid: number;
  previousBid: number;
  message: string;
}

/**
 * Event: auction:player-sold
 * Triggered when a player is sold to a team
 */
export interface PlayerSoldEvent extends BasePusherEvent {
  soldPlayer: Player;
  winningTeam: Team;
  finalPrice: number;
  remainingPlayers: number;
  remainingBudget: number;
  auctionState: AuctionState | null;
  message: string;
}

/**
 * Event: auction:reset
 * Triggered when the current auction is reset
 */
export interface AuctionResetEvent extends BasePusherEvent {
  auctionState: AuctionState | null;
  message: string;
}

/**
 * Event: auction:undo
 * Triggered when the last sale is undone
 */
export interface AuctionUndoEvent extends BasePusherEvent {
  restoredPlayer: Player;
  updatedTeam: Team | null;
  refundedAmount: number;
  auctionState: AuctionState | null;
  message: string;
}

/**
 * Event: auction:player-unsold
 * Triggered when the host marks the current player as explicitly unsold
 */
export interface PlayerMarkedUnsoldEvent extends BasePusherEvent {
  unsoldPlayer: Player;
  auctionState: AuctionState | null;
  message: string;
}

/**
 * Event: auction:state-update
 * Generic event for any state changes not covered by specific events
 */
export interface AuctionStateUpdateEvent extends BasePusherEvent {
  tournament: Tournament;
  auctionState: AuctionState | null;
  players: Player[];
  teams: Team[];
  message: string;
}

/**
 * Event: auction:class-selected
 * Triggered when the auctioneer activates a player class for bidding
 */
export interface ClassSelectedEvent extends BasePusherEvent {
  classCode: string;
  className: string;
  playerCount: number;
  auctionState: AuctionState;
  message: string;
}

/**
 * Event: auction:class-completed
 * Triggered when all players in the active class are sold or unsold
 */
export interface ClassCompletedEvent extends BasePusherEvent {
  completedClassCode: string;
  completedClasses: string[];
  auctionState: AuctionState;
  message: string;
}

/**
 * Event: overlay:settings
 * Triggered when the host changes overlay display settings from the control panel
 */
export interface OverlaySettingsEvent extends BasePusherEvent {
  size: 'large' | 'small';
  tickerMode: 'all' | 'sold' | 'available';
  displayMode: 'standard' | 'sold-summary' | 'team-summary' | 'team-wise-summary' | 'team-wise-image' | 'resting' | 'top10-summary' | 'custom-ticker' | 'wheel-spin';
  hidePremiumCard?: boolean;
  customTickerLine1?: string;
  customTickerLine2?: string;
  soldMessagePosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  hideTickerCustom?: boolean;
  hideTickerFullscreen?: boolean;
  teamWiseTeamId?: string | null;
  bidCardTop?: number;
  bidCardLeft?: number;
  hideTeamCards?: boolean;
  teamCardSize?: 'small' | 'medium' | 'large';
  teamCardPosition?: 'top-right' | 'bottom-right';
  bidCardPosition?: 'top' | 'right' | 'left';
}

/**
 * Event: overlay:wheel-spin
 * Triggered when admin clicks "Spin Wheel" — carries a snapshot of available
 * players and the pre-determined winner index so overlays animate to the result.
 */
export interface WheelSpinEvent extends BasePusherEvent {
  // Stripped to minimum — only what the wheel segments need to render
  players: Array<{
    _id: string;
    playerNo?: string;
  }>;
  // Full details for the winner reveal card
  winner: {
    _id: string;
    name: string;
    playerNo?: string;
    position?: string;
    playerClass?: string;
  };
  winnerId: string;
  winnerIndex: number;
  spinDurationMs: number;
  centerImageURL?: string;
}

/**
 * Union type of all possible event payloads
 */
export type PusherEventPayload =
  | AuctionStartedEvent
  | AuctionStoppedEvent
  | AuctionRestartedEvent
  | PlayerSelectedEvent
  | BidPlacedEvent
  | PlayerSoldEvent
  | AuctionResetEvent
  | AuctionUndoEvent
  | PlayerMarkedUnsoldEvent
  | AuctionStateUpdateEvent
  | ClassSelectedEvent
  | ClassCompletedEvent
  | OverlaySettingsEvent
  | WheelSpinEvent;

/**
 * Helper function to get channel name for a tournament
 */
export function getTournamentChannel(tournamentId: string): string {
  return `tournament-${tournamentId}`;
}

/**
 * Event handler type for type-safe event listeners
 */
export type PusherEventHandler<T extends PusherEventPayload> = (data: T) => void;
