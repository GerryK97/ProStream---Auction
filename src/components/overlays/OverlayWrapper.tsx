'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePusherAuction } from '@/hooks/usePusherAuction';
import { Tournament, AuctionState, Player, Team } from '@/types';
import '../../styles/animations.css';

interface OverlayWrapperProps {
    tournamentId?: string;
    children: (data: {
        tournament: Tournament | null;
        auctionState: AuctionState;
        players: Player[];
        teams: Team[];
        isConnected: boolean;
        currentPlayer: Player | undefined;
        soldPlayers: Player[];
    }) => ReactNode;
}

const OverlayWrapper: React.FC<OverlayWrapperProps> = ({
    tournamentId,
    children
}) => {
    const searchParams = useSearchParams();
    const [liveTournamentId, setLiveTournamentId] = useState<string | null>(tournamentId || null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(!tournamentId);

    // Get debug mode and token from URL
    const isDebugMode = searchParams.get('debug') === 'true';
    const urlToken = searchParams.get('token');

    // Fetch active tournament if no tournamentId provided
    useEffect(() => {
        if (!tournamentId) {
            const loadActiveTournament = async () => {
                try {
                    setIsLoading(true);
                    setError(null);

                    // Check for token in URL first (for OBS), then fall back to localStorage
                    const localToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                    const token = urlToken || localToken;

                    // Build URL with token if available
                    const apiUrl = token
                        ? `/api/tournaments/active?token=${encodeURIComponent(token)}`
                        : '/api/tournaments/active';

                    const headers: Record<string, string> = {};
                    if (!urlToken && localToken) {
                        // Only use Authorization header if using localStorage token
                        headers['Authorization'] = `Bearer ${localToken}`;
                    }

                    const response = await fetch(apiUrl, { headers });

                    if (response.ok) {
                        const tournament = await response.json();
                        setLiveTournamentId(tournament._id);
                        setError(null);
                    } else {
                        const errorData = await response.json().catch(() => ({ error: response.statusText }));
                        setError(`Failed to load tournament: ${errorData.error || response.statusText} (${response.status})`);
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    setError(`Failed to fetch active tournament: ${errorMessage}`);
                    console.error('Failed to fetch active tournament:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            loadActiveTournament();
        }
    }, [tournamentId, urlToken]);

    // Use Pusher hook for real-time updates
    const {
        tournament,
        auctionState,
        players,
        teams,
        isConnected,
    } = usePusherAuction(liveTournamentId);

    const currentPlayer = players.find(p => p._id === auctionState.currentPlayerId);
    const soldPlayers = players.filter(p => p.isSold);

    // Error state - visible on transparent background
    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-red-900/90">
                <div className="text-white text-center p-8 bg-red-800/90 rounded-lg max-w-2xl mx-4 border-2 border-red-600">
                    <h2 className="text-3xl font-bold mb-4">⚠️ Overlay Error</h2>
                    <p className="text-lg mb-4">{error}</p>
                    <div className="text-sm text-red-200 space-y-2 text-left bg-red-950/50 p-4 rounded">
                        <p><strong>Troubleshooting:</strong></p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>For OBS: Add <code className="bg-red-900 px-1 rounded">?token=YOUR_SECRET</code> to the URL</li>
                            <li>Check if OVERLAY_SECRET_TOKEN is set in environment variables</li>
                            <li>Verify a tournament is set to "Live" status</li>
                            <li>Open browser DevTools (F12) for more details</li>
                        </ul>
                    </div>
                    {isDebugMode && (
                        <div className="mt-4 text-xs text-left bg-black/50 p-3 rounded font-mono">
                            <div>URL Token: {urlToken ? '✓ Present' : '✗ Missing'}</div>
                            <div>Tournament ID: {liveTournamentId || 'None'}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Loading state - visible on transparent background
    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-blue-900/90">
                <div className="text-white text-center p-8 bg-blue-800/90 rounded-lg border-2 border-blue-600">
                    <div className="text-5xl mb-4 animate-pulse">⏳</div>
                    <h2 className="text-2xl font-bold">Loading Overlay...</h2>
                    <p className="text-sm mt-2 text-blue-200">Connecting to tournament data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-transparent text-white font-sans relative overflow-hidden">
            {/* Debug overlay - shows connection status */}
            {isDebugMode && (
                <div className="fixed top-2 right-2 bg-black/90 text-white p-3 text-xs font-mono rounded border border-green-500 z-50 max-w-xs">
                    <div className="font-bold mb-2 text-green-400">🔍 Debug Mode</div>
                    <div className="space-y-1">
                        <div>Tournament: {tournament?._id ? `✓ ${tournament.name}` : '✗ None'}</div>
                        <div>Connected: {isConnected ? '✓ Yes' : '✗ No'}</div>
                        <div>Current Player: {currentPlayer?.name || 'None'}</div>
                        <div>URL Token: {urlToken ? '✓ Present' : '✗ Missing'}</div>
                        <div>Teams: {teams.length}</div>
                        <div>Players: {players.length}</div>
                        <div>Sold: {soldPlayers.length}</div>
                    </div>
                </div>
            )}

            {/* Render children with data */}
            {children({
                tournament,
                auctionState,
                players,
                teams,
                isConnected,
                currentPlayer,
                soldPlayers,
            })}
        </div>
    );
};

export default OverlayWrapper;
