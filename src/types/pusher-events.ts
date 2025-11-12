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
  | 'auction:state-update';

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
  updatedTeam: Team;
  refundedAmount: number;
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
  | AuctionStateUpdateEvent;

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
