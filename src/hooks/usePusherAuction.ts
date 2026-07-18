/**
 * Custom hook to manage Pusher real-time connection for auction updates.
 *
 * Uses a two-tier channel strategy to minimise Pusher connection load:
 *
 *  1. Wake channel ("prostream-control") — always subscribed while the overlay
 *     is open. Receives 'auction:wake' / 'auction:sleep' control signals.
 *     Zero messages during idle periods.
 *
 *  2. Tournament channel ("tournament-{id}") — only subscribed when the
 *     auction is active (Live / Paused / Stopped). Automatically connects on
 *     wake signal and disconnects when tournament status goes inactive.
 */

import { useEffect, useRef, useState, useCallback, useReducer } from 'react';
import type { Channel } from 'pusher-js';
import { getPusherClient } from '@/lib/pusher-client';
import { getAuthHeaders } from '@/lib/api-client';
import type { Player, Team, Tournament, AuctionState } from '@/types';
import type {
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
} from '@/types/pusher-events';

/** Channel that overlays always subscribe to for wake/sleep signals */
const WAKE_CHANNEL = 'prostream-control';

/** Lifecycle/diagnostic log — silenced in production builds. */
const dlog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args);
};

/** Tournament-channel subscriptions are only active in these states */
const ACTIVE_STATUSES = ['Live', 'Paused', 'Stopped'] as const;

function isActiveStatus(status: string | undefined): boolean {
  return ACTIVE_STATUSES.includes(status as any);
}

export interface OptimisticSellSnapshot {
  auctionState: AuctionState;
  player: Player | null;
  team: Team | null;
}

export type PlayerCardSizeHint = {
  size: 'large' | 'small';
  rev?: number;
  playerId: string;
};

interface UsePusherAuctionReturn {
  tournament: Tournament | null;
  auctionState: AuctionState;
  players: Player[];
  teams: Team[];
  /** Card size requested with the latest player-selected event (same render as the new player). */
  playerCardSizeHint: PlayerCardSizeHint | null;
  isConnected: boolean;
  isRevoked: boolean;
  lastEvent: string | null;
  error: string | null;
  setPlayerUnsold: (playerId: string) => void;
  setPlayerAvailable: (playerId: string) => void;
  updatePlayerAndTeams: (player: Player, teams: Team[]) => void;
  /** Apply a selected player immediately while the Pusher echo reaches other clients. */
  applyPlayerSelected: (data: PlayerSelectedEvent) => void;
  /** Optimistically select a player and return the previous state for rollback. */
  optimisticPlayerSelection: (playerId: string) => AuctionState;
  /** Apply a reset (player removed from board) immediately. */
  applyAuctionReset: (auctionState: AuctionState) => void;
  /** Apply a class-cleared or class-selected event immediately. */
  applyClassCleared: (data: ClassSelectedEvent) => void;
  /** Apply a full state-update (reset-all) immediately. */
  applyStateUpdate: (data: AuctionStateUpdateEvent) => void;
  /** Optimistically apply a bid (caller is responsible for restoring on failure). */
  optimisticBid: (amount: number) => void;
  /** Restore auctionState (used to revert an optimistic bid on failure). */
  restoreAuctionState: (snapshot: AuctionState) => void;
  /** Optimistically apply a sell. Returns a snapshot the caller can pass to restoreSell on failure. */
  optimisticSell: (args: { teamId: string; playerId: string; bid: number }) => OptimisticSellSnapshot;
  /** Restore the state captured before optimisticSell. */
  restoreSell: (snapshot: OptimisticSellSnapshot) => void;
  /** Force a fresh server fetch of tournament/state/players/teams. */
  refreshData: () => Promise<void>;
}

interface AuctionStateType {
  tournament: Tournament | null;
  auctionState: AuctionState;
  players: Player[];
  teams: Team[];
  playerCardSizeHint: PlayerCardSizeHint | null;
  error: string | null;
}

type AuctionAction =
  | { type: 'SET_INITIAL_DATA'; data: { tournament: Tournament | null; auctionState: AuctionState; players: Player[]; teams: Team[] } }
  | { type: 'AUCTION_STARTED'; data: AuctionStartedEvent }
  | { type: 'AUCTION_STOPPED'; data: AuctionStoppedEvent }
  | { type: 'AUCTION_RESTARTED'; data: AuctionRestartedEvent }
  | { type: 'PLAYER_SELECTED'; data: PlayerSelectedEvent }
  | { type: 'BID_PLACED'; data: BidPlacedEvent }
  | { type: 'PLAYER_SOLD'; data: PlayerSoldEvent }
  | { type: 'AUCTION_RESET'; data: AuctionResetEvent }
  | { type: 'AUCTION_UNDO'; data: AuctionUndoEvent }
  | { type: 'PLAYER_MARKED_UNSOLD'; data: PlayerMarkedUnsoldEvent }
  | { type: 'STATE_UPDATE'; data: AuctionStateUpdateEvent }
  | { type: 'CLASS_SELECTED'; data: ClassSelectedEvent }
  | { type: 'CLASS_COMPLETED'; data: ClassCompletedEvent }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_PLAYER_UNSOLD'; playerId: string }
  | { type: 'SET_PLAYER_AVAILABLE'; playerId: string }
  | { type: 'UPDATE_PLAYER_AND_TEAMS'; player: Player; teams: Team[] }
  | { type: 'OPTIMISTIC_PLAYER_SELECTION'; playerId: string }
  | { type: 'OPTIMISTIC_BID'; amount: number }
  | { type: 'OPTIMISTIC_SELL'; teamId: string; playerId: string; bid: number }
  | { type: 'RESTORE_AUCTION_STATE'; auctionState: AuctionState }
  | { type: 'RESTORE_SELL'; auctionState: AuctionState; player: Player | null; team: Team | null };
import { EMPTY_AUCTION_STATE } from '@/lib/auctionDefaults';

const auctionReducer = (state: AuctionStateType, action: AuctionAction): AuctionStateType => {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
      return {
        ...state,
        tournament: action.data.tournament,
        auctionState: action.data.auctionState,
        players: action.data.players,
        teams: action.data.teams,
        error: null,
      };

    case 'AUCTION_STARTED':
      return {
        ...state,
        tournament: action.data.tournament,
        auctionState: action.data.auctionState || EMPTY_AUCTION_STATE,
        teams: action.data.teams,
        players: action.data.players,
        error: null,
      };

    case 'AUCTION_STOPPED':
      return {
        ...state,
        tournament: action.data.tournament,
        auctionState: action.data.auctionState || state.auctionState,
        error: null,
      };

    case 'AUCTION_RESTARTED':
      return {
        ...state,
        tournament: action.data.tournament,
        auctionState: action.data.auctionState || state.auctionState,
        error: null,
      };

    case 'PLAYER_SELECTED': {
      const nextPlayerId = action.data.auctionState?.currentPlayerId
        ?? action.data.currentPlayer?._id
        ?? null;
      const hint: PlayerCardSizeHint | null =
        (action.data.overlaySize === 'large' || action.data.overlaySize === 'small') && nextPlayerId
          ? {
              size: action.data.overlaySize,
              rev: action.data.sizeRev,
              playerId: nextPlayerId,
            }
          : state.playerCardSizeHint;

      // Merge the selected player into the roster so overlays never resolve
      // currentPlayerId to a missing/stale row (empty fullscreen card flash).
      let nextPlayers = state.players;
      const selected = action.data.currentPlayer;
      if (selected?._id) {
        const idx = state.players.findIndex(p => p._id === selected._id);
        nextPlayers = idx >= 0
          ? state.players.map((p, i) => (i === idx ? { ...p, ...selected } : p))
          : [...state.players, selected];
      }

      return {
        ...state,
        auctionState: action.data.auctionState,
        players: nextPlayers,
        playerCardSizeHint: hint,
        error: null,
      };
    }

    case 'OPTIMISTIC_PLAYER_SELECTION':
      return {
        ...state,
        auctionState: {
          ...state.auctionState,
          currentPlayerId: action.playerId,
          currentBid: 0,
          winningTeamId: null,
          currentAuctionStatus: 'Pending',
          history: [],
        },
        error: null,
      };

    case 'BID_PLACED': {
      // Only rebuild teams[] if a winningTeam is supplied AND it actually
      // exists in our list. Re-using the same reference when nothing
      // structurally changed lets memoised consumers (TeamRow, SoldPlayerRow)
      // skip reconciliation on every bid.
      // Merge (not replace) so that a partial incomingTeam never strips
      // currentBalance / playersPurchased from the local state.
      let updatedTeams = state.teams;
      const incomingTeam = action.data.winningTeam;
      if (incomingTeam && state.teams.some((t) => t._id === incomingTeam._id)) {
        updatedTeams = state.teams.map((team) =>
          team._id === incomingTeam._id ? { ...team, ...incomingTeam } : team
        );
      }

      return {
        ...state,
        auctionState: action.data.auctionState,
        teams: updatedTeams,
        error: null,
      };
    }

    case 'PLAYER_SOLD': {
      const updatedPlayers = state.players.map((player) =>
        player._id === action.data.soldPlayer._id ? action.data.soldPlayer : player
      );

      const updatedTeams = state.teams.map((team) =>
        team._id === action.data.winningTeam._id ? action.data.winningTeam : team
      );

      return {
        ...state,
        players: updatedPlayers,
        teams: updatedTeams,
        auctionState: action.data.auctionState || EMPTY_AUCTION_STATE,
        error: null,
      };
    }

    case 'AUCTION_RESET':
      return {
        ...state,
        auctionState: action.data.auctionState || EMPTY_AUCTION_STATE,
        error: null,
      };

    case 'AUCTION_UNDO': {
      const updatedPlayers = state.players.map((player) =>
        player._id === action.data.restoredPlayer._id ? action.data.restoredPlayer : player
      );

      let updatedTeams = state.teams;
      if (action.data.updatedTeam) {
        const serverTeam = action.data.updatedTeam;
        const restoredId = action.data.restoredPlayer._id;
        updatedTeams = state.teams.map((team) => {
          if (team._id !== serverTeam._id) return team;
          // Use server's team data but guarantee the restored player is removed from
          // playersPurchased. Safety net: if $pull silently failed and the server's
          // updatedTeam still contains the player, the client state shows the correct count.
          const playersPurchased = (serverTeam.playersPurchased ?? []).filter(
            (id: string) => id !== restoredId
          );
          return { ...serverTeam, playersPurchased };
        });
      }

      return {
        ...state,
        players: updatedPlayers,
        teams: updatedTeams,
        auctionState: action.data.auctionState || EMPTY_AUCTION_STATE,
        error: null,
      };
    }

    case 'PLAYER_MARKED_UNSOLD': {
      const updatedPlayers = state.players.map((player) =>
        player._id === action.data.unsoldPlayer._id ? action.data.unsoldPlayer : player
      );
      return {
        ...state,
        players: updatedPlayers,
        auctionState: action.data.auctionState || EMPTY_AUCTION_STATE,
        error: null,
      };
    }

    case 'STATE_UPDATE':
      return {
        ...state,
        tournament: action.data.tournament,
        auctionState: action.data.auctionState || state.auctionState,
        players: action.data.players,
        teams: action.data.teams,
        error: null,
      };

    case 'CLASS_SELECTED':
      return {
        ...state,
        auctionState: action.data.auctionState,
        error: null,
      };

    case 'CLASS_COMPLETED':
      return {
        ...state,
        auctionState: action.data.auctionState,
        error: null,
      };

    case 'SET_PLAYER_UNSOLD':
      return {
        ...state,
        players: state.players.map((p) =>
          p._id === action.playerId ? { ...p, isUnsold: true, isSold: false } : p
        ),
        error: null,
      };

    case 'SET_PLAYER_AVAILABLE':
      return {
        ...state,
        players: state.players.map((p) =>
          p._id === action.playerId ? { ...p, isUnsold: false, isSold: false } : p
        ),
        error: null,
      };

    case 'UPDATE_PLAYER_AND_TEAMS':
      return {
        ...state,
        players: state.players.map((p) => p._id === action.player._id ? action.player : p),
        teams: action.teams,
        error: null,
      };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'OPTIMISTIC_BID': {
      // Apply the new bid immediately so the UI updates before the server
      // round-trip completes. The eventual auction:bid-placed Pusher event
      // (BID_PLACED) will replace this with the authoritative value.
      return {
        ...state,
        auctionState: {
          ...state.auctionState,
          currentBid: action.amount,
          currentAuctionStatus: 'Bidding',
        },
        error: null,
      };
    }

    case 'OPTIMISTIC_SELL': {
      // Mark the current player sold, deduct from team balance, and flip the
      // auction status. Reverted by RESTORE_SELL if the request fails; replaced
      // by the authoritative PLAYER_SOLD event on success.
      const updatedPlayers = state.players.map((p) =>
        p._id === action.playerId
          ? { ...p, isSold: true, finalPrice: action.bid, winningTeamId: action.teamId }
          : p
      );
      const updatedTeams = state.teams.map((t) =>
        t._id === action.teamId
          ? {
              ...t,
              currentBalance: Math.max(0, (t.currentBalance ?? 0) - action.bid),
              playersPurchased: [...(t.playersPurchased ?? []), action.playerId],
            }
          : t
      );
      return {
        ...state,
        players: updatedPlayers,
        teams: updatedTeams,
        auctionState: {
          ...state.auctionState,
          currentAuctionStatus: 'Sold',
        },
        error: null,
      };
    }

    case 'RESTORE_AUCTION_STATE':
      return { ...state, auctionState: action.auctionState };

    case 'RESTORE_SELL': {
      const players = action.player
        ? state.players.map((p) => (p._id === action.player!._id ? action.player! : p))
        : state.players;
      const teams = action.team
        ? state.teams.map((t) => (t._id === action.team!._id ? action.team! : t))
        : state.teams;
      return {
        ...state,
        players,
        teams,
        auctionState: action.auctionState,
      };
    }

    default:
      return state;
  }
};

export function usePusherAuction(
  tournamentId: string | null,
  initialData?: {
    tournament?: Tournament | null;
    auctionState?: AuctionState;
    players?: Player[];
    teams?: Team[];
  },
  overlayToken?: string,
  overlayType?: string,
): UsePusherAuctionReturn {
  // Overlay mode = OBS browser source with a token in the URL.
  // In overlay mode we use the wake channel strategy (lazy connect).
  // Without a token (control panel, auction page, legacy public overlays),
  // connect immediately.
  const isOverlayMode = !!overlayToken;

  const [isConnected, setIsConnected] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  // In non-overlay mode start as true so Effect 4 fires immediately on mount.
  const [connectTournamentChannel, setConnectTournamentChannel] = useState(!isOverlayMode);

  const [state, dispatch] = useReducer(auctionReducer, {
    tournament: initialData?.tournament || null,
    auctionState: initialData?.auctionState || EMPTY_AUCTION_STATE,
    players: initialData?.players || [],
    teams: initialData?.teams || [],
    playerCardSizeHint: null,
    error: null,
  });

  const channelRef = useRef<Channel | null>(null);
  const pusherRef = useRef<ReturnType<typeof getPusherClient> | null>(null);
  const bootstrapInFlightRef = useRef<Promise<void> | null>(null);
  const lastBootstrapRef = useRef<{ key: string; at: number } | null>(null);

  // Build auth headers helper (handles overlay token fallback for OBS)
  const buildHeaders = useCallback(() => {
    const headers = getAuthHeaders();
    const needsToken = !headers['Authorization'] && overlayToken;
    const typeParam = needsToken && overlayType ? `&overlayType=${encodeURIComponent(overlayType)}` : '';
    const tkQ = needsToken ? `?token=${encodeURIComponent(overlayToken!)}${typeParam}` : '';
    const tk  = needsToken ? `&token=${encodeURIComponent(overlayToken!)}${typeParam}` : '';
    return { headers, tkQ, tk };
  }, [overlayToken, overlayType]);

  // Fetch full auction data via the bootstrap endpoint (single HTTP + Neon PG round-trip).
  // Dedupe because overlay startup can request sync from mount, token hydration, and
  // Pusher connection recovery within the same few milliseconds.
  const runBootstrapFetch = useCallback(async (source: string, force = false) => {
    if (!tournamentId) return;

    const { headers, tk } = buildHeaders();
    const url = `/api/auction/bootstrap?tournamentId=${tournamentId}${tk}`;
    const now = Date.now();
    const last = lastBootstrapRef.current;

    if (!force && bootstrapInFlightRef.current) {
      dlog(`[usePusherAuction] Bootstrap deduped (${source}) — awaiting in-flight request`);
      return bootstrapInFlightRef.current;
    }
    if (!force && last?.key === url && now - last.at < 1_000) {
      dlog(`[usePusherAuction] Bootstrap skipped (${source}) — fetched ${now - last.at}ms ago`);
      return;
    }

    const task = (async () => {
      try {
        dlog(`[usePusherAuction] Bootstrap fetch (${source}) for tournament: ${tournamentId}`);
        const startTime = Date.now();
        const res = await fetch(url, { headers });
        const data = res.ok ? await res.json() : null;

        lastBootstrapRef.current = { key: url, at: Date.now() };
        dlog(`[usePusherAuction] Bootstrap fetch completed in ${Date.now() - startTime}ms (${source})`);

        dispatch({
          type: 'SET_INITIAL_DATA',
          data: {
            tournament: data?.tournament || null,
            auctionState: data?.auctionState || EMPTY_AUCTION_STATE,
            players: data?.players || [],
            teams: data?.teams || [],
          },
        });
      } finally {
        bootstrapInFlightRef.current = null;
      }
    })();

    bootstrapInFlightRef.current = task;
    return task;
  }, [tournamentId, buildHeaders]);

  const fetchInitialData = useCallback(async () => {
    if (!tournamentId) return;
    // Use server-bootstrapped data only when it matches the currently requested tournament.
    if (initialData?.tournament?._id === tournamentId) return;
    try {
      await runBootstrapFetch('initial');
    } catch (err) {
      console.error('[usePusherAuction] Error fetching data:', err);
      dispatch({ type: 'SET_ERROR', error: 'Failed to load tournament data. Please try again.' });
    }
  }, [tournamentId, initialData?.tournament?._id, runBootstrapFetch]);

  const refreshData = useCallback(async () => {
    try {
      await runBootstrapFetch('refresh', true);
    } catch (err) {
      console.error('[usePusherAuction] Error refreshing data:', err);
      dispatch({ type: 'SET_ERROR', error: 'Failed to refresh tournament data. Please try again.' });
    }
  }, [runBootstrapFetch]);

  // ─── Effect 1: Overlay startup connect ──────────────────────────────────────
  // Avoid a status-check waterfall. Bootstrap returns the full tournament state;
  // Pusher events will disconnect the tournament channel if the auction becomes inactive.
  useEffect(() => {
    if (!isOverlayMode || !tournamentId) return;
    dlog('[usePusherAuction] Overlay mode — connecting tournament channel immediately');
    setConnectTournamentChannel(true);
  }, [tournamentId, isOverlayMode]);

  // ─── Effect 2: Wake channel subscription (overlay mode only) ────────────────
  // Always on while overlay is open. Receives wake/sleep signals from the
  // control panel. Near-zero Pusher messages between auction sessions.
  useEffect(() => {
    if (!isOverlayMode || !tournamentId) return;

    const pusher = getPusherClient();
    const wakeChannel = pusher.subscribe(WAKE_CHANNEL);

    wakeChannel.bind('auction:wake', (data: { tournamentId: string }) => {
      if (data.tournamentId === tournamentId) {
        dlog('[usePusherAuction] Wake signal received — connecting tournament channel');
        setConnectTournamentChannel(true);
      }
    });

    wakeChannel.bind('auction:sleep', (data: { tournamentId: string }) => {
      if (data.tournamentId === tournamentId) {
        dlog('[usePusherAuction] Sleep signal received — disconnecting tournament channel');
        setConnectTournamentChannel(false);
      }
    });

    wakeChannel.bind('overlay:revoke', (data: { token: string }) => {
      if (overlayToken && data.token === overlayToken) {
        dlog('[usePusherAuction] Overlay session revoked via wake channel');
        setIsRevoked(true);
        pusher.disconnect();
      }
    });

    return () => {
      wakeChannel.unbind('auction:wake');
      wakeChannel.unbind('auction:sleep');
      wakeChannel.unbind('overlay:revoke');
      pusher.unsubscribe(WAKE_CHANNEL);
    };
  }, [tournamentId, isOverlayMode, overlayToken]);

  // ─── Effect 3: Auto-disconnect when status goes inactive (overlay mode only) ─
  // Watches tournament.status updates that arrive through Pusher events.
  // When an event carries a non-active status, disconnect the tournament channel.
  useEffect(() => {
    if (!isOverlayMode || !state.tournament) return;
    if (!isActiveStatus(state.tournament.status)) {
      dlog(`[usePusherAuction] Tournament status "${state.tournament.status}" is inactive — disconnecting`);
      setConnectTournamentChannel(false);
    }
  }, [state.tournament?.status, isOverlayMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Effect 4: Tournament channel subscription ────────────────────────────────
  // Only active when connectTournamentChannel is true.
  // Fetches full data and binds all auction event handlers.
  useEffect(() => {
    if (!tournamentId || !connectTournamentChannel) {
      setIsConnected(false);
      return;
    }

    // Fetch full data now that the tournament is active
    fetchInitialData();

    try {
      const pusher = getPusherClient();
      pusherRef.current = pusher;

      const channelName = `tournament-${tournamentId}`;
      const channel = pusher.subscribe(channelName);
      channelRef.current = channel;

      dlog(`[Pusher] Subscribing to channel: ${channelName}`);

      channel.bind('pusher:subscription_succeeded', () => {
        dlog(`[Pusher] Subscribed to ${channelName}`);
        setIsConnected(true);
      });

      channel.bind('pusher:subscription_error', (status: any) => {
        console.error(`[Pusher] Subscription error:`, status);
        setIsConnected(false);
      });

      channel.bind('auction:started', (data: AuctionStartedEvent) => {
        dispatch({ type: 'AUCTION_STARTED', data });
      });

      channel.bind('auction:stopped', (data: AuctionStoppedEvent) => {
        dispatch({ type: 'AUCTION_STOPPED', data });
      });

      channel.bind('auction:restarted', (data: AuctionRestartedEvent) => {
        dispatch({ type: 'AUCTION_RESTARTED', data });
      });

      channel.bind('auction:player-selected', (data: PlayerSelectedEvent) => {
        setLastEvent(`auction:player-selected ${new Date().toLocaleTimeString()}`);
        dispatch({ type: 'PLAYER_SELECTED', data });
      });

      channel.bind('auction:bid-placed', (data: BidPlacedEvent) => {
        setLastEvent(`auction:bid-placed bid=${data.currentBid} ${new Date().toLocaleTimeString()}`);
        dispatch({ type: 'BID_PLACED', data });
      });

      channel.bind('auction:player-sold', (data: PlayerSoldEvent) => {
        setLastEvent(`auction:player-sold ${new Date().toLocaleTimeString()}`);
        dispatch({ type: 'PLAYER_SOLD', data });
      });

      channel.bind('auction:reset', (data: AuctionResetEvent) => {
        dispatch({ type: 'AUCTION_RESET', data });
      });

      channel.bind('auction:undo', (data: AuctionUndoEvent) => {
        dispatch({ type: 'AUCTION_UNDO', data });
      });

      channel.bind('auction:player-unsold', (data: PlayerMarkedUnsoldEvent) => {
        dispatch({ type: 'PLAYER_MARKED_UNSOLD', data });
      });

      channel.bind('auction:state-update', (data: AuctionStateUpdateEvent) => {
        dispatch({ type: 'STATE_UPDATE', data });
      });

      channel.bind('auction:class-selected', (data: ClassSelectedEvent) => {
        dispatch({ type: 'CLASS_SELECTED', data });
      });

      channel.bind('auction:class-completed', (data: ClassCompletedEvent) => {
        dispatch({ type: 'CLASS_COMPLETED', data });
      });

      channel.bind('overlay:revoke', (data: { token: string }) => {
        if (overlayToken && data.token === overlayToken) {
          dlog('[usePusherAuction] Overlay session revoked via tournament channel');
          setIsRevoked(true);
          pusher.disconnect();
        }
      });

      const handleConnectionStateChange = (states: { current: string; previous: string }) => {
        setIsConnected(states.current === 'connected');
        if (states.current === 'connected' || states.current === 'unavailable' || states.current === 'failed') {
          dispatch({ type: 'CLEAR_ERROR' });
        }
        // When the connection recovers from a disconnect, re-fetch full auction
        // state to catch any events that were missed while the WS was down.
        // This is the primary fix for "overlay shows stale data after reconnect"
        // and "hard refresh needed to see latest state".
        if (
          states.current === 'connected' &&
          (states.previous === 'unavailable' || states.previous === 'failed' || states.previous === 'disconnected')
        ) {
          dlog('[usePusherAuction] WS recovered — re-fetching auction data to sync missed events');
          refreshData().catch(() => {});
        }
      };

      pusher.connection.bind('state_change', handleConnectionStateChange);

      return () => {
        dlog(`[Pusher] Unsubscribing from ${channelName}`);
        if (channelRef.current) {
          // Explicitly unbind only the events bound in this effect.
          // Do NOT use unbind_all() — it would also remove overlay:settings
          // bindings set up externally by OverlayWrapper.
          channelRef.current.unbind('pusher:subscription_succeeded');
          channelRef.current.unbind('pusher:subscription_error');
          channelRef.current.unbind('auction:started');
          channelRef.current.unbind('auction:stopped');
          channelRef.current.unbind('auction:restarted');
          channelRef.current.unbind('auction:player-selected');
          channelRef.current.unbind('auction:bid-placed');
          channelRef.current.unbind('auction:player-sold');
          channelRef.current.unbind('auction:reset');
          channelRef.current.unbind('auction:undo');
          channelRef.current.unbind('auction:player-unsold');
          channelRef.current.unbind('auction:state-update');
          channelRef.current.unbind('auction:class-selected');
          channelRef.current.unbind('auction:class-completed');
          channelRef.current.unbind('overlay:revoke');
          pusher.unsubscribe(channelName);
          channelRef.current = null;
        }
        pusher.connection.unbind('state_change', handleConnectionStateChange);
        setIsConnected(false);
      };
    } catch (err) {
      console.error('[Pusher] Error setting up connection:', err);
      setIsConnected(false);
    }
  }, [tournamentId, connectTournamentChannel, refreshData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Effect 5: Re-fetch when overlay token hydrates (mobile SSR delay) ───────
  // On mobile, useSearchParams may return null for the token on the first render.
  // When the token becomes available after hydration, re-fetch so teams/players
  // are loaded with proper authentication.
  useEffect(() => {
    if (!overlayToken || !tournamentId) return;
    fetchInitialData();
  }, [overlayToken, tournamentId, fetchInitialData]);

  // ─── Effect 6: Page visibility recovery ──────────────────────────────────────
  // When a browser tab is backgrounded, Chrome/Firefox throttle JS execution and
  // can delay WebSocket ping/pong responses enough to cause Pusher disconnects.
  // When the tab becomes visible again, reconnect Pusher if needed and re-fetch
  // the current auction state to catch any events missed while backgrounded.
  // Throttled to avoid flooding Neon PG on every tab-focus event — only re-fetches
  // if Pusher was disconnected OR state is >30 s stale.
  useEffect(() => {
    if (!tournamentId || !connectTournamentChannel) return;

    const lastRefreshRef = { current: Date.now() };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const pusherState = pusherRef.current?.connection.state;
        const wasDisconnected = pusherState !== 'connected';
        const stale = Date.now() - lastRefreshRef.current > 30_000;

        if (wasDisconnected || stale) {
          dlog('[usePusherAuction] Tab visible — re-syncing state (disconnected=' + wasDisconnected + ' stale=' + stale + ')');
          lastRefreshRef.current = Date.now();
          refreshData().catch(() => {});
        }
        if (wasDisconnected && pusherRef.current) {
          dlog('[usePusherAuction] Pusher disconnected — reconnecting');
          pusherRef.current.connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tournamentId, connectTournamentChannel, refreshData]);

  const setPlayerUnsold = useCallback((playerId: string) => {
    dispatch({ type: 'SET_PLAYER_UNSOLD', playerId });
  }, []);

  const setPlayerAvailable = useCallback((playerId: string) => {
    dispatch({ type: 'SET_PLAYER_AVAILABLE', playerId });
  }, []);

  const updatePlayerAndTeams = useCallback((player: Player, teams: Team[]) => {
    dispatch({ type: 'UPDATE_PLAYER_AND_TEAMS', player, teams });
  }, []);

  const applyPlayerSelected = useCallback((data: PlayerSelectedEvent) => {
    dispatch({ type: 'PLAYER_SELECTED', data });
  }, []);

  const applyAuctionReset = useCallback((auctionState: AuctionState) => {
    dispatch({
      type: 'AUCTION_RESET',
      data: { auctionState, message: '', tournamentId: '', timestamp: Date.now() },
    });
  }, []);

  const applyClassCleared = useCallback((data: ClassSelectedEvent) => {
    dispatch({ type: 'CLASS_SELECTED', data });
  }, []);

  const applyStateUpdate = useCallback((data: AuctionStateUpdateEvent) => {
    dispatch({ type: 'STATE_UPDATE', data });
  }, []);

  // Snapshot ref so optimistic helpers can capture the current state
  // synchronously without making the callbacks depend on it (which would
  // re-create them on every render).
  const stateRef = useRef(state);
  stateRef.current = state;

  const optimisticBid = useCallback((amount: number) => {
    dispatch({ type: 'OPTIMISTIC_BID', amount });
  }, []);

  const optimisticPlayerSelection = useCallback((playerId: string): AuctionState => {
    const snapshot = stateRef.current.auctionState;
    dispatch({ type: 'OPTIMISTIC_PLAYER_SELECTION', playerId });
    return snapshot;
  }, []);

  const restoreAuctionState = useCallback((snapshot: AuctionState) => {
    dispatch({ type: 'RESTORE_AUCTION_STATE', auctionState: snapshot });
  }, []);

  const optimisticSell = useCallback(
    (args: { teamId: string; playerId: string; bid: number }): OptimisticSellSnapshot => {
      const snap: OptimisticSellSnapshot = {
        auctionState: stateRef.current.auctionState,
        player: stateRef.current.players.find((p) => p._id === args.playerId) ?? null,
        team: stateRef.current.teams.find((t) => t._id === args.teamId) ?? null,
      };
      dispatch({ type: 'OPTIMISTIC_SELL', ...args });
      return snap;
    },
    []
  );

  const restoreSell = useCallback((snapshot: OptimisticSellSnapshot) => {
    dispatch({
      type: 'RESTORE_SELL',
      auctionState: snapshot.auctionState,
      player: snapshot.player,
      team: snapshot.team,
    });
  }, []);

  return {
    tournament: state.tournament,
    auctionState: state.auctionState,
    players: state.players,
    teams: state.teams,
    playerCardSizeHint: state.playerCardSizeHint,
    isConnected,
    isRevoked,
    lastEvent,
    error: state.error,
    setPlayerUnsold,
    setPlayerAvailable,
    updatePlayerAndTeams,
    applyPlayerSelected,
    optimisticPlayerSelection,
    applyAuctionReset,
    applyClassCleared,
    applyStateUpdate,
    optimisticBid,
    restoreAuctionState,
    optimisticSell,
    restoreSell,
    refreshData,
  };
}
