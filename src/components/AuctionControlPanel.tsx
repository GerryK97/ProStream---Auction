'use client';

import React, { useState, useEffect } from 'react';
import { Player, Team, Tournament } from '@/types';
import { useAuctionSSE } from '@/hooks/useAuctionSSE';
import { imageOptimizers } from '@/lib/imageOptimization';

const formatCurrency = (amount: number) => amount.toLocaleString();

const AvailablePlayersPanel: React.FC<{
    players: Player[];
    onSelectPlayer: (id: string) => void;
    isAuctioning: boolean;
}> = ({ players, onSelectPlayer, isAuctioning }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const availablePlayers = players
        .filter(p => !p.isSold)
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="bg-neutral-800 rounded-lg p-4 flex flex-col h-[calc(100vh-15rem)] border border-neutral-700">
            <h3 className="font-bold text-lg mb-2">Available Players</h3>
            {isAuctioning && (
                <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 text-xs rounded-md p-2 mb-3">
                    Please reset or complete the current auction to start a new one.
                </div>
            )}
            <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-600 rounded-md px-3 py-2 mb-3 focus:ring-brand-primary focus:border-brand-primary"
            />
            <div className="flex-grow overflow-y-auto pr-2">
                <ul className="space-y-2">
                    {availablePlayers.map(player => (
                        <li key={player._id} className="flex items-center justify-between bg-neutral-700/50 p-2 rounded-md">
                            <div>
                                <p className="font-semibold text-cyan-400">#{player._id.replace('p', '').padStart(3, '0')} {player.name}</p>
                                <p className="text-xs text-neutral-400">Batsman</p>
                            </div>
                            <button
                                onClick={() => onSelectPlayer(player._id)}
                                disabled={isAuctioning}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed">
                                Auction
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const CurrentAuctionPanel: React.FC<{
    currentPlayer: Player | undefined;
    tournament: Tournament | null;
    teams: Team[];
    biddingTeamId: string;
    setBiddingTeamId: (id: string) => void;
    auctionState: any;
    onBid: (amount: number) => void;
    onSell: () => void;
    onReset: () => void;
}> = ({ currentPlayer, tournament, teams, biddingTeamId, setBiddingTeamId, auctionState, onBid, onSell, onReset }) => {
    const [bidAmount, setBidAmount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const base = tournament?.basePricePerPlayer || 0;
        const nextBid = auctionState.currentBid > 0 ? auctionState.currentBid + 1000 : base;
        setBidAmount(nextBid);
    }, [auctionState.currentBid, currentPlayer, tournament]);

    const handleQuickBid = async (increment: number) => {
        // If no bid yet, start from base price, otherwise add to current bid
        const basePrice = tournament?.basePricePerPlayer || 0;
        const startingPoint = auctionState.currentBid > 0 ? auctionState.currentBid : basePrice;
        const newAmount = startingPoint + increment;

        setIsSubmitting(true);
        try {
            await onBid(newAmount);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentPlayer || !tournament) {
        return (
            <div className="bg-neutral-800 rounded-lg p-4 flex items-center justify-center h-[calc(100vh-15rem)] border border-neutral-700">
                <p className="text-neutral-400 text-lg">{!tournament ? "No tournament data" : "Select a player to start the auction"}</p>
            </div>
        );
    }

    const { currentBid, currentAuctionStatus } = auctionState;
    const isSold = currentAuctionStatus === 'Sold';
    const bidIncrements = [1000, 5000, 10000, 25000, 50000];

    return (
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700 h-[calc(100vh-15rem)] flex flex-col justify-between">
            <div>
                <div className="text-center mb-4">
                    <p className="text-3xl font-bold text-cyan-400">#{currentPlayer._id.replace('p', '').padStart(3, '0')} {currentPlayer.name}</p>
                    <p className="text-neutral-400">Batsman</p>
                </div>
                <div className="flex justify-center items-center gap-6 mb-4">
                    <img
                        src={imageOptimizers.playerCard(currentPlayer.imageURL)}
                        alt={currentPlayer.name}
                        className="w-40 h-40 rounded-lg object-cover border-4 border-neutral-700 shadow-lg"
                        loading="lazy"
                    />
                    <div>
                        <p className="text-neutral-400 text-sm">Current Bid</p>
                        <p className="text-6xl font-bold text-green-400">{formatCurrency(currentBid)}</p>
                    </div>
                </div>
                 <div className="text-center mb-6">
                    <p>Base Price: <span className="font-semibold">{formatCurrency(tournament.basePricePerPlayer)}</span></p>
                </div>
                <div className="bg-neutral-900/50 p-4 rounded-lg max-w-lg mx-auto">
                    <p className="text-center mb-3 font-semibold text-neutral-300">Quick Bid (Auto Submit)</p>
                     <div className="flex justify-center gap-1 sm:gap-2 mb-3">
                        {bidIncrements.map(inc => (
                            <button
                                key={inc}
                                onClick={() => handleQuickBid(inc)}
                                disabled={isSold || isSubmitting}
                                className="btn-secondary text-xs px-2 sm:px-3 py-1.5 flex-1 disabled:opacity-50 hover:bg-green-600 transition-colors">
                                + {inc.toLocaleString()}
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-neutral-700 pt-3 mt-3">
                        <p className="text-center mb-3 text-sm text-neutral-400">Or Set Custom Amount</p>
                        <input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(parseInt(e.target.value, 10) || 0)}
                            disabled={isSold || isSubmitting}
                            className="input-field text-center text-lg w-full disabled:opacity-50"
                            placeholder="Enter bid amount"
                        />
                         <button
                            onClick={() => onBid(bidAmount)}
                            disabled={isSold || isSubmitting}
                            className="btn-primary w-full mt-3 disabled:opacity-50">
                            {isSubmitting ? 'Submitting...' : 'Set Custom Bid'}
                        </button>
                    </div>
                </div>
            </div>
            <div className="mt-6 border-t border-neutral-700 pt-4 text-center bg-neutral-800">
                 <p className="mb-3 text-sm text-neutral-500">Finalize Sale</p>
                 <div className="mb-3 max-w-md mx-auto">
                     <label className="block text-sm font-semibold text-neutral-300 mb-2">Select Winning Team</label>
                     <select
                         value={biddingTeamId}
                         onChange={e => setBiddingTeamId(e.target.value)}
                         disabled={isSold || currentBid === 0}
                         className="w-full bg-neutral-700 text-white border-2 border-neutral-600 rounded-md px-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                         {teams.map(t => (
                             <option key={t._id} value={t._id} className="bg-neutral-800 text-white py-2">
                                 {t.name}
                             </option>
                         ))}
                     </select>
                 </div>
                 <div className="flex justify-center gap-4 mb-3">
                     <button
                         onClick={onSell}
                         disabled={isSold || currentBid === 0 || !biddingTeamId}
                         className="btn-primary py-3 px-8 disabled:opacity-50">
                         Sell Player
                     </button>
                     <button onClick={onReset} disabled={isSold} className="btn-danger py-3 px-8 disabled:opacity-50">Reset</button>
                 </div>
                 <p className="font-bold text-xl tracking-widest text-yellow-400">{currentAuctionStatus === 'Bidding' ? 'BIDDING ACTIVE' : (isSold ? 'PLAYER SOLD' : 'BIDDING PENDING')}</p>
            </div>
        </div>
    );
}

const TeamsAndSoldPlayersPanel: React.FC<{
    teams: Team[];
    soldPlayers: Player[];
    tournament: Tournament | null;
    winningTeamId: string | null;
    onUndo: () => void;
    onCleanup: () => void;
}> = ({ teams, soldPlayers, tournament, winningTeamId, onUndo, onCleanup }) => {
    const calculateMaxBid = (team: Team) => {
        if (!tournament || !team.currentBalance) return 0;

        const squadSize = tournament.squadSize;
        const basePrice = tournament.basePricePerPlayer;
        const playersPurchased = team.playersPurchased?.length || 0;
        const remainingPlayers = squadSize - playersPurchased;

        // If squad is complete or it's the last player, team can spend all remaining balance
        if (remainingPlayers <= 1) {
            return team.currentBalance;
        }

        // Otherwise, reserve base price for remaining players
        const reservedAmount = (remainingPlayers - 1) * basePrice;
        const maxBid = team.currentBalance - reservedAmount;

        // Return 0 if insufficient funds
        return Math.max(0, maxBid);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700 flex-grow h-1/2 overflow-hidden flex flex-col">
                 <h3 className="font-bold text-lg mb-3">Teams</h3>
                 <ul className="space-y-2 overflow-y-auto pr-2 flex-grow">
                     {teams.map(team => {
                         const maxBid = calculateMaxBid(team);
                         const playersPurchased = team.playersPurchased?.length || 0;
                         const squadSize = tournament?.squadSize || 0;
                         const remainingPlayers = squadSize - playersPurchased;
                         const hasInsufficientFunds = maxBid <= 0 && remainingPlayers > 0;

                         return (
                             <li key={team._id} className={`p-2 rounded-md flex items-center gap-3 relative overflow-hidden transition-all duration-300 ${winningTeamId === team._id ? 'bg-neutral-700' : 'bg-neutral-700/40'}`}>
                                {winningTeamId === team._id && <div className="absolute left-0 top-0 h-full w-1.5 bg-red-500 animate-pulse"></div>}
                                <img
                                    src={imageOptimizers.teamThumbnail(team.logoURL)}
                                    alt={team.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                    loading="lazy"
                                />
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{team.name}</p>
                                        {hasInsufficientFunds && (
                                            <span className="text-red-500 text-xs" title="Insufficient funds for remaining players">⚠️</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-neutral-300">Budget: <span className="text-green-400">{formatCurrency(team.currentBalance || 0)}</span></p>
                                    <p className="text-xs text-neutral-300">
                                        Max Bid: <span className={hasInsufficientFunds ? "text-red-500 font-semibold" : "text-cyan-400"}>{formatCurrency(maxBid)}</span>
                                    </p>
                                    <p className="text-xs text-neutral-500">{playersPurchased}/{squadSize} players</p>
                                </div>
                             </li>
                         );
                     })}
                 </ul>
            </div>
             <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700 flex-grow h-1/2 overflow-hidden flex flex-col">
                <h3 className="font-bold text-lg mb-3">Sold Players ({soldPlayers.length})</h3>
                <div className="flex gap-2 mb-3">
                    <button onClick={onUndo} className="btn-secondary w-full text-sm py-1.5">Undo Last Sale</button>
                    <button onClick={onCleanup} className="btn-danger w-full text-sm py-1.5">Cleanup All</button>
                </div>
                <div className="overflow-y-auto pr-2 flex-grow">
                    {soldPlayers.length === 0 ? (
                        <p className="text-center text-neutral-400 py-8 text-sm">No players sold yet</p>
                    ) : (
                        <ul className="space-y-2">
                            {soldPlayers.map(player => {
                                const playerTeam = teams.find(t => t._id === player.winningTeamId);
                                return (
                                    <li key={player._id} className="bg-neutral-700/50 p-2 rounded-md">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={imageOptimizers.playerThumbnail(player.imageURL)}
                                                alt={player.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                                loading="lazy"
                                            />
                                            <div className="flex-grow min-w-0">
                                                <p className="font-semibold text-sm truncate">{player.name}</p>
                                                <p className="text-xs text-green-400">{formatCurrency(player.finalPrice || 0)}</p>
                                                <p className="text-xs text-neutral-400 truncate">
                                                    {playerTeam ? playerTeam.name : 'Unknown Team'}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
             </div>
        </div>
    );
};


const AuctionControlPanel: React.FC = () => {
    const [biddingTeamId, setBiddingTeamId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [liveTournamentId, setLiveTournamentId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch active tournament ID (one-time check, then SSE handles updates)
    useEffect(() => {
        const loadActiveTournament = async () => {
            try {
                const response = await fetch('/api/tournaments/active');

                if (response.ok) {
                    const tournament = await response.json();
                    setLiveTournamentId(tournament._id);
                } else if (response.status === 404) {
                    setLiveTournamentId(null);
                }
            } catch (error) {
                console.error('Failed to fetch active tournament:', error);
                setLiveTournamentId(null);
            }
        };

        loadActiveTournament();

        // Re-check when actions are performed
    }, [refreshTrigger]);

    // Use SSE hook to get real-time auction updates
    const {
        tournament: liveTournament,
        auctionState,
        players,
        teams,
        isConnected,
        error: sseError,
    } = useAuctionSSE(liveTournamentId);

    // Display SSE errors
    useEffect(() => {
        if (sseError && !error) {
            setError(sseError);
        }
    }, [sseError, error]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if(!biddingTeamId && teams.length > 0) {
            setBiddingTeamId(teams[0]._id);
        }
    }, [teams, biddingTeamId]);

    const currentPlayer = players.find(p => p._id === auctionState.currentPlayerId);
    const soldPlayers = players.filter(p => p.isSold);
    const isAuctioning = !!currentPlayer && auctionState.currentAuctionStatus !== 'Sold';

    // Check if tournament is live
    if (!liveTournament) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-12rem)] animate-fade-in">
                <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-12 max-w-2xl text-center">
                    <div className="mb-6">
                        <svg className="w-24 h-24 mx-auto text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold mb-4 text-neutral-200">Auction Not Started</h2>
                    <p className="text-neutral-400 mb-6 text-lg">
                        No live auction found. Please go to Auction Setup and click &apos;Start Auction&apos; to begin.
                    </p>
                    <a
                        href="/auction/setup"
                        className="inline-block bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                        Go to Auction Setup
                    </a>
                </div>
            </div>
        );
    }

    const handleSelectPlayer = async (playerId: string) => {
        if (!liveTournament) return;
        try {
            const response = await fetch('/api/auction/select-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id, playerId }),
            });
            if (response.ok) {
                setRefreshTrigger(prev => prev + 1);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to select player');
            }
        } catch (error) {
            console.error('Failed to select player:', error);
            setError('An error occurred while selecting the player');
        }
    };

    const handleBid = async (amount: number) => {
        console.log('handleBid called with amount:', amount);

        if (!liveTournament) return;

        // Client-side validation
        const currentBid = auctionState.currentBid || 0;
        const basePrice = liveTournament.basePricePerPlayer || 0;

        if (currentBid > 0 && amount <= currentBid) {
            setError(`Bid must be greater than current bid of ${formatCurrency(currentBid)}`);
            return;
        }

        if (currentBid === 0 && amount < basePrice) {
            setError(`First bid must be at least base price of ${formatCurrency(basePrice)}`);
            return;
        }

        try {
            console.log('Sending bid request:', { tournamentId: liveTournament._id, amount });
            const response = await fetch('/api/auction/bid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId: liveTournament._id,
                    amount,
                }),
            });
            console.log('Bid response status:', response.status);
            if (response.ok) {
                setRefreshTrigger(prev => prev + 1);
            } else {
                const data = await response.json();
                console.log('Bid error:', data);
                setError(data.error || 'Failed to place bid');
            }
        } catch (error) {
            console.error('Failed to place bid:', error);
            setError('An error occurred while placing the bid');
        }
    };

    const handleSell = async () => {
        console.log('handleSell called with team:', biddingTeamId);
        if (!liveTournament) {
            console.log('No live tournament');
            return;
        }
        if (!biddingTeamId) {
            setError('Please select a winning team before selling');
            return;
        }
        try {
            console.log('Sending sell request for tournament:', liveTournament._id, 'team:', biddingTeamId);
            const response = await fetch('/api/auction/sell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId: liveTournament._id,
                    teamId: biddingTeamId,
                }),
            });
            console.log('Sell response status:', response.status);
            if (response.ok) {
                setRefreshTrigger(prev => prev + 1);
            } else {
                const data = await response.json();
                console.log('Sell error:', data);
                setError(data.error || 'Failed to sell player');
            }
        } catch (error) {
            console.error('Failed to sell player:', error);
            setError('An error occurred while selling the player');
        }
    };

    const handleReset = async () => {
        if (!liveTournament) return;
        try {
            const response = await fetch('/api/auction/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id }),
            });
            if (response.ok) {
                setRefreshTrigger(prev => prev + 1);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to reset auction');
            }
        } catch (error) {
            console.error('Failed to reset auction:', error);
            setError('An error occurred while resetting the auction');
        }
    };

    const handleUndo = async () => {
        if (!liveTournament) return;
        try {
            const response = await fetch('/api/auction/undo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id }),
            });
            if (response.ok) {
                setRefreshTrigger(prev => prev + 1);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to undo sale');
            }
        } catch (error) {
            console.error('Failed to undo sale:', error);
            setError('An error occurred while undoing the sale');
        }
    };

    const handleCleanupAll = async () => {
        if (!liveTournament) return;
        if (!window.confirm("Are you sure you want to reset all sales? This cannot be undone.")) {
            return;
        }
        try {
            const response = await fetch('/api/auction/reset-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id }),
            });
            if (response.ok) {
                setRefreshTrigger(prev => prev + 1);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to reset all sales');
            }
        } catch (error) {
            console.error('Failed to reset all sales:', error);
            setError('An error occurred while resetting all sales');
        }
    }

    const handleRestartAuction = async () => {
        if (!liveTournament) return;
        try {
            const response = await fetch('/api/auction/restart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id }),
            });
            const data = await response.json();

            if (response.ok) {
                setRefreshTrigger(prev => prev + 1);
                setError(null);
            } else {
                setError(data.error || 'Failed to restart auction');
            }
        } catch (error) {
            console.error('Failed to restart auction:', error);
            setError('An error occurred while restarting the auction');
        }
    }

    const isAuctionStopped = liveTournament?.status === 'Stopped';

    return (
        <div className="animate-fade-in space-y-4">
            {/* Auction Header */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {isAuctionStopped ? (
                                <>
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wide">Auction Stopped</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-green-400 font-semibold text-sm uppercase tracking-wide">Live Auction</span>
                                </>
                            )}
                        </div>
                        <div className="h-6 w-px bg-neutral-600"></div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                        <div className="h-6 w-px bg-neutral-600"></div>
                        <div>
                            <p className="text-xl font-bold text-cyan-400">{liveTournament.name}</p>
                            <p className="text-xs text-neutral-400">
                                Budget: {liveTournament.budgetPerTeam.toLocaleString()} | Squad: {liveTournament.squadSize} | Base Price: {liveTournament.basePricePerPlayer.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    {isAuctionStopped && (
                        <button
                            onClick={handleRestartAuction}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restart Auction
                        </button>
                    )}
                </div>
                {isAuctionStopped && (
                    <div className="mt-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md p-3 text-yellow-200 text-sm">
                        <p className="font-semibold mb-1">⚠️ Auction Paused</p>
                        <p className="text-yellow-300/80">
                            The auction has been stopped. You can view the current status or restart the auction to continue selling remaining players.
                        </p>
                    </div>
                )}
            </div>

            {/* Auction Control Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-7 gap-6 relative">
                <div className="xl:col-span-2">
                    <AvailablePlayersPanel
                        players={players}
                        onSelectPlayer={handleSelectPlayer}
                        isAuctioning={isAuctioning}
                    />
                </div>
                <div className="xl:col-span-3">
                    <CurrentAuctionPanel
                        currentPlayer={currentPlayer}
                        tournament={liveTournament}
                        teams={teams}
                        biddingTeamId={biddingTeamId}
                        setBiddingTeamId={setBiddingTeamId}
                        auctionState={auctionState}
                        onBid={handleBid}
                        onSell={handleSell}
                        onReset={handleReset}
                    />
                </div>
                <div className="xl:col-span-2">
                    <TeamsAndSoldPlayersPanel
                        teams={teams}
                        soldPlayers={soldPlayers}
                        tournament={liveTournament}
                        winningTeamId={auctionState.winningTeamId}
                        onUndo={handleUndo}
                        onCleanup={handleCleanupAll}
                    />
                </div>
                {error && <div className="absolute bottom-4 right-4 text-center text-red-400 bg-red-900/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-red-700 animate-fade-in">{error}</div>}
            </div>
             <style jsx>{`
                .btn-primary { @apply bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-neutral-600 disabled:cursor-not-allowed; }
                .btn-secondary { @apply bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-neutral-600 disabled:cursor-not-allowed; }
                .btn-danger { @apply bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-neutral-600 disabled:cursor-not-allowed; }
                .input-field { @apply bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary p-2; }
            `}</style>
        </div>
    );
};

export default AuctionControlPanel;
