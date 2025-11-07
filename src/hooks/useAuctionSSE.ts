import { useEffect, useRef, useState } from 'react';
import { Player, Team, Tournament, AuctionState } from '@/types';

interface AuctionUpdateEvent {
  type: 'auction-update' | 'connected' | 'error';
  timestamp: number;
  tournament?: Tournament;
  auctionState?: AuctionState;
  players?: Player[];
  teams?: Team[];
  message?: string;
}

interface UseAuctionSSEReturn {
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
 * Custom hook to manage Server-Sent Events (SSE) connection for auction updates
 *
 * @param tournamentId - The ID of the tournament to stream updates for
 * @returns Object containing tournament, auction state, players, teams, connection status, and errors
 */
export function useAuctionSSE(tournamentId: string | null): UseAuctionSSEReturn {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionState>(defaultAuctionState);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Don't connect if no tournament ID
    if (!tournamentId) {
      setIsConnected(false);
      return;
    }

    // Create SSE connection
    const connectSSE = () => {
      try {
        const eventSource = new EventSource(`/api/auction/stream/${tournamentId}`);
        eventSourceRef.current = eventSource;

        // Handle incoming messages
        eventSource.onmessage = (event) => {
          try {
            const data: AuctionUpdateEvent = JSON.parse(event.data);

            switch (data.type) {
              case 'connected':
                console.log('SSE Connected:', data);
                setIsConnected(true);
                setError(null);
                break;

              case 'auction-update':
                console.log('Auction Update Received:', data);
                if (data.tournament) setTournament(data.tournament);
                if (data.auctionState) setAuctionState(data.auctionState);
                if (data.players) setPlayers(data.players);
                if (data.teams) setTeams(data.teams);
                setError(null);
                break;

              case 'error':
                console.error('SSE Error event:', data.message);
                setError(data.message || 'Unknown error');
                break;

              default:
                console.log('Unknown SSE event type:', data);
            }
          } catch (err) {
            console.error('Error parsing SSE message:', err);
            setError('Failed to parse server message');
          }
        };

        // Handle connection open
        eventSource.onopen = () => {
          console.log('SSE connection opened');
          setIsConnected(true);
          setError(null);
        };

        // Handle errors and reconnection
        eventSource.onerror = (err) => {
          console.error('SSE connection error:', err);
          setIsConnected(false);

          // Close the failed connection
          eventSource.close();
          eventSourceRef.current = null;

          // Attempt to reconnect after 5 seconds
          setError('Connection lost. Reconnecting...');
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect SSE...');
            connectSSE();
          }, 5000);
        };

      } catch (err) {
        console.error('Error creating SSE connection:', err);
        setError('Failed to establish connection');
        setIsConnected(false);
      }
    };

    // Initial connection
    connectSSE();

    // Cleanup on unmount or when tournamentId changes
    return () => {
      if (eventSourceRef.current) {
        console.log('Closing SSE connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsConnected(false);
    };
  }, [tournamentId]);

  return {
    tournament,
    auctionState,
    players,
    teams,
    isConnected,
    error,
  };
}
