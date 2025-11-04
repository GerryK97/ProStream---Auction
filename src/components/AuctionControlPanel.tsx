'use client';

import React, { useState, useEffect } from 'react';
import { Player, Team, Tournament } from '@/types';

const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

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
    auctionState: ReturnType<typeof useAuction>['auctionState'];
    onBid: (amount: number) => void;
    onSell: () => void;
    onReset: () => void;
}> = ({ currentPlayer, tournament, teams, biddingTeamId, setBiddingTeamId, auctionState, onBid, onSell, onReset }) => {
    const [bidAmount, setBidAmount] = useState(0);

    useEffect(() => {
        const base = tournament?.basePricePerPlayer || 0;
        const nextBid = auctionState.currentBid > 0 ? auctionState.currentBid + 1000 : base;
        setBidAmount(nextBid);
    }, [auctionState.currentBid, currentPlayer, tournament]);

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
                    <img src={currentPlayer.imageURL} alt={currentPlayer.name} className="w-40 h-40 rounded-lg object-cover border-4 border-neutral-700 shadow-lg" />
                    <div>
                        <p className="text-neutral-400 text-sm">Current Bid</p>
                        <p className="text-6xl font-bold text-green-400">{formatCurrency(currentBid)}</p>
                    </div>
                </div>
                 <div className="text-center mb-6">
                    <p>Base Price: <span className="font-semibold">{formatCurrency(tournament.basePricePerPlayer)}</span></p>
                </div>
                <div className="bg-neutral-900/50 p-4 rounded-lg max-w-lg mx-auto">
                    <p className="text-center mb-3 font-semibold text-neutral-300">Update Bid Amount</p>
                     <div className="flex justify-center gap-1 sm:gap-2 mb-3">
                        {bidIncrements.map(inc => (
                            <button key={inc} onClick={() => setBidAmount(prev => prev + inc)} disabled={isSold} className="btn-secondary text-xs px-2 sm:px-3 py-1.5 flex-1 disabled:opacity-50">+ {inc.toLocaleString()}</button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <select value={biddingTeamId} onChange={e => setBiddingTeamId(e.target.value)} disabled={isSold} className="input-field w-1/2 disabled:opacity-50">
                            {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                         <input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(parseInt(e.target.value, 10) || 0)}
                            disabled={isSold}
                            className="input-field text-center text-lg w-1/2 disabled:opacity-50"
                        />
                    </div>
                     <button onClick={() => onBid(bidAmount)} disabled={isSold} className="btn-primary w-full mt-3">Set</button>
                </div>
            </div>
            <div className="mt-6 border-t border-neutral-700 pt-4 text-center">
                 <p className="mb-3 text-sm text-neutral-500">Auctioneer Actions</p>
                 <div className="flex justify-center gap-4 mb-3">
                     <button onClick={onSell} disabled={isSold || currentBid === 0} className="btn-primary py-3 px-8 disabled:opacity-50">Sell Player</button>
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
    winningTeamId: string | null;
    onUndo: () => void;
    onCleanup: () => void;
}> = ({ teams, soldPlayers, winningTeamId, onUndo, onCleanup }) => {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700 flex-grow h-1/2 overflow-hidden flex flex-col">
                 <h3 className="font-bold text-lg mb-3">Teams</h3>
                 <ul className="space-y-2 overflow-y-auto pr-2 flex-grow">
                     {teams.map(team => (
                         <li key={team._id} className={`p-2 rounded-md flex items-center gap-3 relative overflow-hidden transition-all duration-300 ${winningTeamId === team._id ? 'bg-neutral-700' : 'bg-neutral-700/40'}`}>
                            {winningTeamId === team._id && <div className="absolute left-0 top-0 h-full w-1.5 bg-red-500 animate-pulse"></div>}
                            <img src={team.logoURL} alt={team.name} className="w-10 h-10 rounded-full object-cover"/>
                            <div>
                                <p className="font-semibold">{team.name}</p>
                                <p className="text-xs text-neutral-300">Budget: <span className="text-green-400">{formatCurrency(team.currentBalance)}</span></p>
                                <p className="text-xs text-neutral-300">Max Bid: <span className="text-red-400">{formatCurrency(team.currentBalance)}</span></p>
                            </div>
                         </li>
                     ))}
                 </ul>
            </div>
             <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                <h3 className="font-bold text-lg mb-3">Sold Players ({soldPlayers.length})</h3>
                <div className="flex gap-2">
                    <button onClick={onUndo} className="btn-secondary w-full text-sm">Undo Last Sale</button>
                    <button onClick={onCleanup} className="btn-danger w-full text-sm">Cleanup All</button>
                </div>
             </div>
        </div>
    );
};


const AuctionControlPanel: React.FC = () => {
    const [biddingTeamId, setBiddingTeamId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [auctionState, setAuctionState] = useState<any>({ currentPlayerId: null, currentBid: 0, winningTeamId: null, currentAuctionStatus: 'Pending', history: [] });
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [liveTournament, setLiveTournament] = useState<Tournament | null>(null);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);

    // Listen for auction start/stop from localStorage
    useEffect(() => {
        const loadLiveTournament = async () => {
            const liveTournamentId = localStorage.getItem('liveTournamentId');

            if (!liveTournamentId) {
                console.log('No live tournament ID found in localStorage');
                setLiveTournament(null);
                return;
            }

            try {
                console.log(`Loading tournament ${liveTournamentId} from API...`);
                const response = await fetch(`/api/tournaments/${liveTournamentId}`);
                if (response.ok) {
                    const tournament = await response.json();
                    console.log('Loaded tournament:', tournament);

                    // Verify the tournament is actually Live
                    if (tournament.status === 'Live') {
                        setLiveTournament(tournament);
                    } else {
                        console.warn(`Tournament ${tournament.name} is not Live (status: ${tournament.status}). Clearing localStorage.`);
                        localStorage.removeItem('liveTournamentId');
                        setLiveTournament(null);
                    }
                } else {
                    console.error('Failed to load tournament:', response.status);
                    localStorage.removeItem('liveTournamentId');
                    setLiveTournament(null);
                }
            } catch (error) {
                console.error('Failed to fetch live tournament:', error);
                localStorage.removeItem('liveTournamentId');
                setLiveTournament(null);
            }
        };

        // Initial load
        loadLiveTournament();

        // Listen for storage events (when auction is started/stopped in another tab or component)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'auctionStarted' || e.key === 'auctionStopped') {
                console.log('Detected auction state change:', e.key);
                loadLiveTournament();
            }
        };

        // Listen for custom event (for same-tab updates)
        const handleAuctionChange = () => {
            console.log('Detected auction change event');
            loadLiveTournament();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('auctionStateChanged', handleAuctionChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('auctionStateChanged', handleAuctionChange);
        };
    }, [refreshTrigger]);

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            if (!liveTournament) return;

            try {
                // Fetch players
                const playersRes = await fetch('/api/players');
                if (playersRes.ok) {
                    const allPlayers = await playersRes.json();
                    setPlayers(allPlayers.filter((p: Player) => p.tournamentId === liveTournament._id));
                }

                // Fetch teams
                const teamsRes = await fetch('/api/teams');
                if (teamsRes.ok) {
                    const allTeams = await teamsRes.json();
                    setTeams(allTeams.filter((t: Team) => t.tournamentId === liveTournament._id));
                }

                // Fetch auction state
                const auctionRes = await fetch(`/api/auction/state/${liveTournament._id}`);
                if (auctionRes.ok) {
                    const state = await auctionRes.json();
                    setAuctionState(state);
                }
            } catch (error) {
                console.error('Failed to fetch auction data:', error);
            }
        };
        fetchData();
    }, [liveTournament, refreshTrigger]);

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
                        No live auction found. Please go to Auction Setup and click 'Start Auction' to begin.
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
        if (!biddingTeamId) {
            setError("Please select a team.");
            return;
        }
        if (!liveTournament) return;

        try {
            const response = await fetch('/api/auction/bid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId: liveTournament._id,
                    teamId: biddingTeamId,
                    amount,
                }),
            });
            if (response.ok) {
                setRefreshTrigger(prev => prev + 1);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to place bid');
            }
        } catch (error) {
            console.error('Failed to place bid:', error);
            setError('An error occurred while placing the bid');
        }
    };

    const handleSell = async () => {
        if (!liveTournament) return;
        try {
            const response = await fetch('/api/auction/sell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id }),
            });
            if (response.ok) {
                setRefreshTrigger(prev => prev + 1);
            } else {
                const data = await response.json();
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

    return (
        <div className="animate-fade-in space-y-4">
            {/* Live Auction Header */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 font-semibold text-sm uppercase tracking-wide">Live Auction</span>
                    </div>
                    <div className="h-6 w-px bg-neutral-600"></div>
                    <div>
                        <p className="text-xl font-bold text-cyan-400">{liveTournament.name}</p>
                        <p className="text-xs text-neutral-400">
                            Budget: {liveTournament.budgetPerTeam.toLocaleString()} | Squad: {liveTournament.squadSize} | Base Price: {liveTournament.basePricePerPlayer.toLocaleString()}
                        </p>
                    </div>
                </div>
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
