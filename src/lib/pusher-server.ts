/**
 * Pusher Server Utility
 *
 * Server-side Pusher instance for triggering real-time events from API routes.
 * This file provides a singleton Pusher instance and helper functions for
 * triggering events with type safety.
 */

import Pusher from 'pusher';
import type {
  PusherEventName,
  PusherEventPayload,
  AuctionStartedEvent,
  AuctionStoppedEvent,
  AuctionRestartedEvent,
  PlayerSelectedEvent,
  BidPlacedEvent,
  PlayerSoldEvent,
  AuctionResetEvent,
  AuctionUndoEvent,
  PlayerMarkedUnsoldEvent,
  AuctionStateUpdateEvent,
  ClassSelectedEvent,
  ClassCompletedEvent,
  OverlaySettingsEvent,
  WheelSpinEvent,
} from '@/types/pusher-events';

// Validate environment variables
const requiredEnvVars = {
  PUSHER_APP_ID: process.env.PUSHER_APP_ID,
  PUSHER_KEY: process.env.PUSHER_KEY,
  PUSHER_SECRET: process.env.PUSHER_SECRET,
  PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
};

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required Pusher environment variables: ${missingEnvVars.join(', ')}`
  );
}

// Singleton Pusher instance
let pusherInstance: Pusher | null = null;

/**
 * Get or create the Pusher server instance
 */
export function getPusherInstance(): Pusher {
  if (!pusherInstance) {
    if (missingEnvVars.length > 0) {
      throw new Error(
        `Cannot initialize Pusher: Missing environment variables: ${missingEnvVars.join(', ')}`
      );
    }

    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });

    console.log('[Pusher Server] Initialized successfully');
  }

  return pusherInstance;
}

/**
 * Get the channel name for a tournament
 */
export function getTournamentChannel(tournamentId: string): string {
  return `tournament-${tournamentId}`;
}

/**
 * Keep Pusher AuctionState payload small while preserving the data overlays need.
 *
 * Full history[] can grow large during competitive bidding and approach Pusher's
 * per-message limit. However, the leading-bid overlay needs the latest and
 * previous bid to show the current leader and prior leader. Keep only the last
 * two entries instead of removing history completely.
 */
function slimState(state: any): any {
  if (!state) return state;
  const history = Array.isArray(state.history) ? state.history.slice(-2) : [];
  return { ...state, history };
}

function pickDefined<T extends Record<string, any>>(source: T, keys: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const key of keys) {
    if (source?.[key] !== undefined) out[key] = source[key];
  }
  return out;
}

function slimPlayer(player: any): any {
  if (!player) return player;
  return pickDefined(player, [
    '_id', 'tournamentId', 'name', 'displayName', 'playerNo', 'position',
    'playerClass', 'basePrice', 'photoURL', 'secondaryImageURL',
    'isSold', 'isUnsold', 'finalPrice', 'winningTeamId',
  ]);
}

function slimTeam(team: any): any {
  if (!team) return team;
  return pickDefined(team, [
    '_id', 'tournamentId', 'name', 'shortCode', 'ownerName', 'logoURL',
    'initialBudget', 'currentBalance', 'playersPurchased',
  ]);
}

function slimEventData(data: any): any {
  const next = { ...data };
  if (Array.isArray(next.players)) next.players = next.players.map(slimPlayer);
  if (Array.isArray(next.teams)) next.teams = next.teams.map(slimTeam);
  if (next.currentPlayer) next.currentPlayer = slimPlayer(next.currentPlayer);
  if (next.soldPlayer) next.soldPlayer = slimPlayer(next.soldPlayer);
  if (next.unsoldPlayer) next.unsoldPlayer = slimPlayer(next.unsoldPlayer);
  if (next.restoredPlayer) next.restoredPlayer = slimPlayer(next.restoredPlayer);
  if (next.winningTeam) next.winningTeam = slimTeam(next.winningTeam);
  if (next.updatedTeam) next.updatedTeam = slimTeam(next.updatedTeam);
  return next;
}

/**
 * Trigger a Pusher event on a tournament channel
 * @param tournamentId - The tournament ID
 * @param eventName - The event name
 * @param data - The event payload
 */
export async function triggerAuctionEvent(
  tournamentId: string,
  eventName: PusherEventName,
  data: Omit<PusherEventPayload, 'tournamentId' | 'timestamp'>
): Promise<void> {
  try {
    const pusher = getPusherInstance();
    const channel = getTournamentChannel(tournamentId);

    // Add metadata to the event.
    // Slim any nested auctionState to strip history[] and keep payload small.
    const eventData = slimEventData(data as any);
    const payload = {
      ...eventData,
      ...(('auctionState' in eventData) ? { auctionState: slimState(eventData.auctionState) } : {}),
      tournamentId,
      timestamp: Date.now(),
    };

    // Trigger the event
    await pusher.trigger(channel, eventName, payload);

    console.log(`[Pusher] Triggered ${eventName} on ${channel}`);
  } catch (error) {
    console.error(`[Pusher] Error triggering ${eventName}:`, error);
    throw error;
  }
}

/**
 * Helper: Trigger auction:started event
 */
export async function triggerAuctionStarted(
  data: Omit<AuctionStartedEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  const tournamentId = data.tournament._id?.toString() || '';
  return triggerAuctionEvent(tournamentId, 'auction:started', data);
}

/**
 * Helper: Trigger auction:stopped event
 */
export async function triggerAuctionStopped(
  data: Omit<AuctionStoppedEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  const tournamentId = data.tournament._id?.toString() || '';
  return triggerAuctionEvent(tournamentId, 'auction:stopped', data);
}

/**
 * Helper: Trigger auction:restarted event
 */
export async function triggerAuctionRestarted(
  data: Omit<AuctionRestartedEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  const tournamentId = data.tournament._id?.toString() || '';
  return triggerAuctionEvent(tournamentId, 'auction:restarted', data);
}

/**
 * Helper: Trigger auction:player-selected event
 */
export async function triggerPlayerSelected(
  tournamentId: string,
  data: Omit<PlayerSelectedEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  return triggerAuctionEvent(tournamentId, 'auction:player-selected', data);
}

/**
 * Helper: Trigger auction:bid-placed event
 */
export async function triggerBidPlaced(
  tournamentId: string,
  data: Omit<BidPlacedEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  return triggerAuctionEvent(tournamentId, 'auction:bid-placed', data);
}

/**
 * Helper: Trigger auction:player-sold event
 */
export async function triggerPlayerSold(
  tournamentId: string,
  data: Omit<PlayerSoldEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  return triggerAuctionEvent(tournamentId, 'auction:player-sold', data);
}

/**
 * Helper: Trigger auction:reset event
 */
export async function triggerAuctionReset(
  tournamentId: string,
  data: Omit<AuctionResetEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  return triggerAuctionEvent(tournamentId, 'auction:reset', data);
}

/**
 * Helper: Trigger auction:undo event
 */
export async function triggerAuctionUndo(
  tournamentId: string,
  data: Omit<AuctionUndoEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  return triggerAuctionEvent(tournamentId, 'auction:undo', data);
}

/**
 * Helper: Trigger auction:player-unsold event
 */
export async function triggerPlayerMarkedUnsold(
  tournamentId: string,
  data: Omit<PlayerMarkedUnsoldEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  return triggerAuctionEvent(tournamentId, 'auction:player-unsold', data);
}

/**
 * Helper: Trigger auction:state-update event
 */
export async function triggerStateUpdate(
  data: Omit<AuctionStateUpdateEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  const tournamentId = data.tournament._id?.toString() || '';
  return triggerAuctionEvent(tournamentId, 'auction:state-update', data);
}

/**
 * Helper: Trigger overlay:settings event
 */
export async function triggerOverlaySettings(
  tournamentId: string,
  data: Omit<OverlaySettingsEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  return triggerAuctionEvent(tournamentId, 'overlay:settings', data);
}

/**
 * Helper: Trigger overlay:wheel-spin event
 */
export async function triggerWheelSpin(
  tournamentId: string,
  data: Omit<WheelSpinEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  return triggerAuctionEvent(tournamentId, 'overlay:wheel-spin', data);
}

/**
 * Helper: Trigger auction:class-selected event
 */
export async function triggerClassSelected(
  tournamentId: string,
  data: Omit<ClassSelectedEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  return triggerAuctionEvent(tournamentId, 'auction:class-selected', data);
}

/**
 * Helper: Trigger auction:class-completed event
 */
export async function triggerClassCompleted(
  tournamentId: string,
  data: Omit<ClassCompletedEvent, 'tournamentId' | 'timestamp'>
): Promise<void> {
  return triggerAuctionEvent(tournamentId, 'auction:class-completed', data);
}

/**
 * Global wake/sleep channel — overlays always subscribe here.
 * Sending 'auction:wake' activates the full tournament channel subscription.
 * Sending 'auction:sleep' deactivates it (manual override).
 */
export const WAKE_CHANNEL = 'prostream-control';

export async function triggerWake(tournamentId: string): Promise<void> {
  try {
    const pusher = getPusherInstance();
    await pusher.trigger(WAKE_CHANNEL, 'auction:wake', { tournamentId, timestamp: Date.now() });
    console.log(`[Pusher] Wake signal sent for tournament ${tournamentId}`);
  } catch (error) {
    console.error('[Pusher] Error sending wake signal:', error);
  }
}

export async function triggerSleep(tournamentId: string): Promise<void> {
  try {
    const pusher = getPusherInstance();
    await pusher.trigger(WAKE_CHANNEL, 'auction:sleep', { tournamentId, timestamp: Date.now() });
    console.log(`[Pusher] Sleep signal sent for tournament ${tournamentId}`);
  } catch (error) {
    console.error('[Pusher] Error sending sleep signal:', error);
  }
}

/**
 * Revoke an overlay session — fires overlay:revoke on both channels so the
 * active OBS browser source disconnects immediately.
 */
export async function triggerOverlayRevoke(tournamentId: string, token: string): Promise<void> {
  try {
    const pusher = getPusherInstance();
    const payload = { token, timestamp: Date.now() };
    await Promise.all([
      pusher.trigger(`tournament-${tournamentId}`, 'overlay:revoke', payload),
      pusher.trigger(WAKE_CHANNEL, 'overlay:revoke', payload),
    ]);
    console.log(`[Pusher] overlay:revoke sent for session ${token.slice(0, 8)}…`);
  } catch (error) {
    console.error('[Pusher] Error sending overlay:revoke:', error);
  }
}

/**
 * Test Pusher connection
 */
export async function testPusherConnection(): Promise<boolean> {
  try {
    const pusher = getPusherInstance();
    // Trigger a test event to verify connection
    await pusher.trigger('test-channel', 'test-event', { test: true });
    console.log('[Pusher] Connection test successful');
    return true;
  } catch (error) {
    console.error('[Pusher] Connection test failed:', error);
    return false;
  }
}

export default getPusherInstance;
