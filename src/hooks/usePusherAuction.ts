/**
 * Custom hook to manage Pusher real-time connection for auction updates
 *
 * This hook replaces useAuctionSSE with Pusher-based real-time communication
 * for significantly reduced latency (~100ms vs 2-4 seconds).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Channel } from 'pusher-js';
import { getPusherClient, isPusherConnected } from '@/lib/pusher-client';
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
  AuctionStateUpdateEvent,
} from '@/types/pusher-events';

interface UsePusherAuctionReturn {
  tournament: Tournament | null;
  auctionState: AuctionState;
  players: Player[];
  teams: Team[];
  isConnected: boolean;
  error: string | null;
}

const defaultAuctionState: AuctionState = {
  tournamentId: '',
  currentPlayerId: null,
  currentBid: 0,
  winningTeamId: null,
  currentAuctionStatus: 'Pending',
  history: [],
};

/**
 * Custom hook to manage Pusher connection for auction updates
 *
 * @param tournamentId - The ID of the tournament to subscribe to
 * @param initialData - Optional initial data to populate state (from server-side props)
 * @returns Object containing tournament, auction state, players, teams, connection status, and errors
 */
export function usePusherAuction(
  tournamentId: string | null,
  initialData?: {
    tournament?: Tournament | null;
    auctionState?: AuctionState;
    players?: Player[];
    teams?: Team[];
  }
): UsePusherAuctionReturn {
  const [tournament, setTournament] = useState<Tournament | null>(
    initialData?.tournament || null
  );
  const [auctionState, setAuctionState] = useState<AuctionState>(
    initialData?.auctionState || defaultAuctionState
  );
  const [players, setPlayers] = useState<Player[]>(initialData?.players || []);
  const [teams, setTeams] = useState<Team[]>(initialData?.teams || []);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<Channel | null>(null);
  const pusherRef = useRef<ReturnType<typeof getPusherClient> | null>(null);

  // Fetch initial data if not provided
  const fetchInitialData = useCallback(async () => {
    if (!tournamentId || initialData) return;

    try {
      // Fetch tournament data
      const tournamentRes = await fetch(`/api/tournaments/${tournamentId}`);
      if (tournamentRes.ok) {
        const tournamentData = await tournamentRes.json();
        setTournament(tournamentData);
      }

      // Fetch auction state
      const stateRes = await fetch(`/api/auction/state/${tournamentId}`);
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        if (stateData.auctionState) {
          setAuctionState(stateData.auctionState);
        }
      }

      // Fetch players
      const playersRes = await fetch(`/api/players?tournamentId=${tournamentId}`);
      if (playersRes.ok) {
        const playersData = await playersRes.json();
        setPlayers(playersData);
      }

      // Fetch teams
      const teamsRes = await fetch(`/api/teams?tournamentId=${tournamentId}`);
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }
    } catch (err) {
      console.error('Error fetching initial auction data:', err);
      setError('Failed to load auction data');
    }
  }, [tournamentId, initialData]);

  useEffect(() => {
    // Don't connect if no tournament ID
    if (!tournamentId) {
      setIsConnected(false);
      return;
    }

    // Fetch initial data
    fetchInitialData();

    // Initialize Pusher and subscribe to channel
    try {
      const pusher = getPusherClient();
      pusherRef.current = pusher;

      const channelName = `tournament-${tournamentId}`;
      const channel = pusher.subscribe(channelName);
      channelRef.current = channel;

      console.log(`[Pusher] Subscribing to channel: ${channelName}`);

      // Handle subscription success
      channel.bind('pusher:subscription_succeeded', () => {
        console.log(`[Pusher] Successfully subscribed to ${channelName}`);
        setIsConnected(true);
        setError(null);
      });

      // Handle subscription error
      channel.bind('pusher:subscription_error', (status: any) => {
        console.error(`[Pusher] Subscription error:`, status);
        setError('Failed to subscribe to auction updates');
        setIsConnected(false);
      });

      // Event: auction:started
      channel.bind('auction:started', (data: AuctionStartedEvent) => {
        console.log('[Pusher] Auction started:', data);
        setTournament(data.tournament);
        setTeams(data.teams);
        setPlayers(data.players);
        setError(null);
      });

      // Event: auction:stopped
      channel.bind('auction:stopped', (data: AuctionStoppedEvent) => {
        console.log('[Pusher] Auction stopped:', data);
        setTournament(data.tournament);
        if (data.auctionState) {
          setAuctionState(data.auctionState);
        }
        setError(null);
      });

      // Event: auction:restarted
      channel.bind('auction:restarted', (data: AuctionRestartedEvent) => {
        console.log('[Pusher] Auction restarted:', data);
        setTournament(data.tournament);
        if (data.auctionState) {
          setAuctionState(data.auctionState);
        }
        setError(null);
      });

      // Event: auction:player-selected
      channel.bind('auction:player-selected', (data: PlayerSelectedEvent) => {
        console.log('[Pusher] Player selected:', data);
        setAuctionState(data.auctionState);
        setError(null);
      });

      // Event: auction:bid-placed
      channel.bind('auction:bid-placed', (data: BidPlacedEvent) => {
        console.log('[Pusher] Bid placed:', data);
        setAuctionState(data.auctionState);

        // Update winning team in teams array if available
        if (data.winningTeam) {
          setTeams((prevTeams) =>
            prevTeams.map((team) =>
              team._id === data.winningTeam!._id ? data.winningTeam! : team
            )
          );
        }
        setError(null);
      });

      // Event: auction:player-sold
      channel.bind('auction:player-sold', (data: PlayerSoldEvent) => {
        console.log('[Pusher] Player sold:', data);

        // Update sold player in players array
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) =>
            player._id === data.soldPlayer._id ? data.soldPlayer : player
          )
        );

        // Update winning team
        setTeams((prevTeams) =>
          prevTeams.map((team) =>
            team._id === data.winningTeam._id ? data.winningTeam : team
          )
        );

        // Reset auction state or update with new state
        if (data.auctionState) {
          setAuctionState(data.auctionState);
        } else {
          setAuctionState(defaultAuctionState);
        }

        setError(null);
      });

      // Event: auction:reset
      channel.bind('auction:reset', (data: AuctionResetEvent) => {
        console.log('[Pusher] Auction reset:', data);
        if (data.auctionState) {
          setAuctionState(data.auctionState);
        } else {
          setAuctionState(defaultAuctionState);
        }
        setError(null);
      });

      // Event: auction:undo
      channel.bind('auction:undo', (data: AuctionUndoEvent) => {
        console.log('[Pusher] Sale undone:', data);

        // Update restored player
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) =>
            player._id === data.restoredPlayer._id ? data.restoredPlayer : player
          )
        );

        // Update team with refunded budget
        setTeams((prevTeams) =>
          prevTeams.map((team) =>
            team._id === data.updatedTeam._id ? data.updatedTeam : team
          )
        );

        // Update auction state
        if (data.auctionState) {
          setAuctionState(data.auctionState);
        } else {
          setAuctionState(defaultAuctionState);
        }

        setError(null);
      });

      // Event: auction:state-update (generic fallback)
      channel.bind('auction:state-update', (data: AuctionStateUpdateEvent) => {
        console.log('[Pusher] State update:', data);
        setTournament(data.tournament);
        if (data.auctionState) {
          setAuctionState(data.auctionState);
        }
        setPlayers(data.players);
        setTeams(data.teams);
        setError(null);
      });

      // Monitor Pusher connection state
      const handleConnectionStateChange = (states: { current: string }) => {
        console.log(`[Pusher] Connection state changed to: ${states.current}`);
        setIsConnected(states.current === 'connected');

        if (states.current === 'unavailable' || states.current === 'failed') {
          setError('Connection lost. Attempting to reconnect...');
        } else if (states.current === 'connected') {
          setError(null);
        }
      };

      pusher.connection.bind('state_change', handleConnectionStateChange);

      // Cleanup function
      return () => {
        console.log(`[Pusher] Unsubscribing from ${channelName}`);

        // Unbind all event handlers
        if (channelRef.current) {
          channelRef.current.unbind_all();
          pusher.unsubscribe(channelName);
        }

        // Unbind connection state handler
        pusher.connection.unbind('state_change', handleConnectionStateChange);

        setIsConnected(false);
      };
    } catch (err) {
      console.error('[Pusher] Error setting up connection:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to establish real-time connection';
      setError(`Pusher connection failed: ${errorMessage}`);
      setIsConnected(false);
    }
  }, [tournamentId, fetchInitialData]);

  return {
    tournament,
    auctionState,
    players,
    teams,
    isConnected,
    error,
  };
}
