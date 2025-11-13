'use client';

import React, { useState, useEffect } from 'react';
import { usePusherAuction } from '@/hooks/usePusherAuction';
import SaleBanner from './overlays/SaleBanner';
import { Player, Team } from '@/types';
import '../styles/animations.css';

const formatCurrency = (amount: number) => amount.toLocaleString();

interface LiveOverlayPreviewProps {
    tournamentId?: string;
}

const LiveOverlayPreview: React.FC<LiveOverlayPreviewProps> = ({ tournamentId }) => {
    const [liveTournamentId, setLiveTournamentId] = useState<string | null>(tournamentId || null);
    const [previousBid, setPreviousBid] = useState<number>(0);
    const [bidPulseKey, setBidPulseKey] = useState<number>(0);
    const [showSoldAnimation, setShowSoldAnimation] = useState<boolean>(false);
    const [previousStatus, setPreviousStatus] = useState<string>('');
    const [lastSoldPlayer, setLastSoldPlayer] = useState<Player | null>(null);
    const [lastSoldTeam, setLastSoldTeam] = useState<Team | null>(null);
    const [showSaleBanner, setShowSaleBanner] = useState<boolean>(false);

    // Fetch active tournament if no tournamentId provided
    useEffect(() => {
        if (!tournamentId) {
            const loadActiveTournament = async () => {
                try {
                    const response = await fetch('/api/tournaments/active');
                    if (response.ok) {
                        const tournament = await response.json();
                        // Handle null response (no active tournament)
                        setLiveTournamentId(tournament?._id || null);
                    }
                } catch (error) {
                    console.error('Failed to fetch active tournament:', error);
                }
            };
            loadActiveTournament();
        }
    }, [tournamentId]);

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

    const isBiddingLive = tournament?.status === 'Live' && currentPlayer;

    // Hide sale banner when new player is selected
    useEffect(() => {
        if (currentPlayer && auctionState.currentAuctionStatus !== 'Sold') {
            setShowSaleBanner(false);
        }
    }, [currentPlayer, auctionState.currentAuctionStatus]);

    // Detect bid changes and trigger pulse animation
    useEffect(() => {
        if (auctionState.currentBid !== previousBid && auctionState.currentBid > 0) {
            setBidPulseKey(prev => prev + 1);
            setPreviousBid(auctionState.currentBid);
        }
    }, [auctionState.currentBid, previousBid]);

    // Detect sold status and trigger celebration animation + sale banner
    useEffect(() => {
        if (auctionState.currentAuctionStatus === 'Sold' && previousStatus !== 'Sold') {
            setShowSoldAnimation(true);
            setTimeout(() => setShowSoldAnimation(false), 2000);

            // Show sale banner
            if (currentPlayer) {
                const soldTeam = teams.find(t => t._id === currentPlayer.winningTeamId);
                if (soldTeam) {
                    setLastSoldPlayer(currentPlayer);
                    setLastSoldTeam(soldTeam);
                    setShowSaleBanner(true);
                }
            }
        }
        setPreviousStatus(auctionState.currentAuctionStatus);
    }, [auctionState.currentAuctionStatus, previousStatus, currentPlayer, teams]);

    // Calculate max bid for teams
    const calculateMaxBid = (teamId: string) => {
        if (!tournament) return 0;
        const team = teams.find(t => t._id === teamId);
        if (!team || !team.currentBalance) return 0;

        const squadSize = tournament.squadSize;
        const basePrice = tournament.basePricePerPlayer;
        const playersPurchased = team.playersPurchased?.length || 0;
        const remainingPlayers = squadSize - playersPurchased;

        if (remainingPlayers <= 1) {
            return team.currentBalance;
        }

        const reservedAmount = (remainingPlayers - 1) * basePrice;
        const maxBid = team.currentBalance - reservedAmount;
        return Math.max(0, maxBid);
    };

    return (
        <div className="w-full h-full bg-transparent text-white font-sans p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Top Section: Player on the Block */}
            <div className={`transition-all duration-500 ease-in-out ${isBiddingLive ? 'animate-slide-in-top' : 'opacity-0 -translate-y-full'}`}>
                {currentPlayer && (
                    <div className={`backdrop-blur-md bg-black/30 p-6 rounded-lg flex items-center gap-6 border-2 border-cyan-500 shadow-2xl relative ${showSoldAnimation ? 'animate-sold-celebration' : ''}`}>
                        {/* Sold Overlay */}
                        {showSoldAnimation && (
                            <div className="absolute inset-0 bg-green-500/20 animate-sold-flash rounded-lg flex items-center justify-center">
                                <div className="text-8xl font-bold text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,1)]">SOLD!</div>
                            </div>
                        )}

                        <img
                            src={currentPlayer.photoURL}
                            alt={currentPlayer.name}
                            className="w-32 h-32 rounded-md object-cover border-4 border-cyan-500 shadow-lg"
                        />
                        <div>
                            <p className="text-xl text-cyan-400 font-semibold tracking-wider">ON THE BLOCK</p>
                            <h2 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">{currentPlayer.name}</h2>
                            <div className="flex gap-6 mt-2">
                                <div>
                                    <p className="text-sm text-neutral-400">Matches</p>
                                    <p className="text-lg font-bold">{currentPlayer.stats.matchesPlayed}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-400">Score</p>
                                    <p className="text-lg font-bold">{currentPlayer.stats.totalScore.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-400">Wickets</p>
                                    <p className="text-lg font-bold">{currentPlayer.stats.totalWickets}</p>
                                </div>
                            </div>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-xl text-neutral-300 tracking-wider">CURRENT BID</p>
                            <p
                                key={bidPulseKey}
                                className={`text-6xl font-bold ${auctionState.currentBid > 0 ? 'text-green-400 animate-bid-pulse' : 'text-neutral-500'}`}
                            >
                                {formatCurrency(auctionState.currentBid)}
                            </p>
                            {auctionState.currentBid === 0 && tournament && (
                                <p className="text-sm text-neutral-400 mt-1">
                                    Base: {formatCurrency(tournament.basePricePerPlayer)}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Section: Team Balances */}
            <div className="space-y-4">
                {/* Teams Row */}
                <div className={`transition-all duration-500 ease-in-out ${tournament?.status === 'Live' ? 'animate-slide-in-bottom' : 'opacity-0 translate-y-full'}`}>
                    <div className="flex justify-center gap-4 flex-wrap">
                        {teams.map(team => {
                            const maxBid = calculateMaxBid(team._id);
                            const isWinningTeam = currentPlayer?.winningTeamId === team._id;
                            const playersPurchased = team.playersPurchased?.length || 0;
                            const squadSize = tournament?.squadSize || 0;

                            return (
                                <div
                                    key={team._id}
                                    className={`backdrop-blur-md bg-black/30 p-3 rounded-lg flex items-center gap-3 w-64 border-2 shadow-lg transition-all ${
                                        isWinningTeam ? 'border-red-500 animate-team-highlight' : 'border-neutral-700/50'
                                    }`}
                                >
                                    <img src={team.logoURL} alt={team.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div className="flex-grow">
                                        <p className="font-bold truncate text-white">{team.name}</p>
                                        <p className="text-sm text-neutral-400">{playersPurchased}/{squadSize} players</p>
                                        <p className="text-lg font-mono text-green-400">{formatCurrency(team.currentBalance || 0)}</p>
                                        <p className="text-xs text-cyan-400">Max: {formatCurrency(maxBid)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sold Players Ticker */}
                {soldPlayers.length > 0 && (
                    <div className="relative overflow-hidden bg-black/30 backdrop-blur-md rounded-lg py-2 border border-neutral-700/50">
                        <div className="flex gap-4 animate-ticker whitespace-nowrap">
                            {/* Duplicate for seamless loop */}
                            {[...soldPlayers, ...soldPlayers].map((player, index) => {
                                const playerTeam = teams.find(t => t._id === player.winningTeamId);
                                return (
                                    <div key={`${player._id}-${index}`} className="inline-flex items-center gap-2 px-4">
                                        <img src={player.photoURL} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                                        <span className="text-white font-semibold">{player.name}</span>
                                        <span className="text-neutral-400">→</span>
                                        <span className="text-cyan-400">{playerTeam?.name || 'Unknown'}</span>
                                        <span className="text-green-400 font-bold">{formatCurrency(player.finalPrice || 0)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Center Status Message */}
            {!isBiddingLive && (
                <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
                    <div className="bg-black/40 p-8 rounded-lg backdrop-blur-md border border-neutral-600/50">
                        <h2 className="text-5xl font-bold text-white drop-shadow-lg">
                            {tournament?.status === 'Stopped' && 'AUCTION PAUSED'}
                            {tournament?.status === 'Setup' && 'AUCTION STARTING SOON'}
                            {tournament?.status === 'Completed' && 'AUCTION COMPLETED'}
                            {(tournament?.status === 'Live' && !currentPlayer) && 'AWAITING NEXT PLAYER'}
                            {!tournament && 'NO ACTIVE AUCTION'}
                        </h2>
                    </div>
                </div>
            )}

            {/* Sale Banner Notification */}
            {showSaleBanner && lastSoldPlayer && lastSoldTeam && (
                <SaleBanner
                    player={lastSoldPlayer}
                    team={lastSoldTeam}
                    onComplete={() => setShowSaleBanner(false)}
                />
            )}
        </div>
    );
};

export default LiveOverlayPreview;
