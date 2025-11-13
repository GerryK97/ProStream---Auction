'use client';

import React, { useState } from 'react';
import { useAuction } from '@/hooks/useAuction';
import { Player, Team, Tournament, PlayerStats, MasterTeam, MasterPlayer } from '@/types';
import Modal from './Modal';
import { PlusIcon, DeleteIcon, EditIcon } from './icons';
import { imageOptimizers } from '@/lib/imageOptimization';
import ImageUpload from './ImageUpload';
import { getSortedClasses, getClassConfig } from '@/lib/playerClassUtils';


interface AddPlayerFromDatabaseProps {
    selectedTournament: Tournament;
    masterPlayers: MasterPlayer[];
    tournamentPlayers: Player[];
    onAdd: (masterPlayerId: string, playerClass?: string) => Promise<void>;
    onCreateNew: () => void;
    onError?: (error: string) => void;
}

interface AddTeamFromDatabaseProps {
    selectedTournament: Tournament;
    masterTeams: MasterTeam[];
    tournamentTeams: Team[];
    onAdd: (masterTeamId: string) => Promise<void>;
    onCreateNew: () => void;
}

const AddPlayerFromDatabase: React.FC<AddPlayerFromDatabaseProps> = ({
    selectedTournament,
    masterPlayers,
    tournamentPlayers,
    onAdd,
    onCreateNew,
    onError,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [addingPlayerId, setAddingPlayerId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlayerClasses, setSelectedPlayerClasses] = useState<Record<string, string>>({});

    // Filter out master players already in this tournament
    const tournamentMasterPlayerIds = new Set(tournamentPlayers.map(p => p.masterPlayerId).filter(Boolean));
    const availablePlayers = masterPlayers.filter(p => !tournamentMasterPlayerIds.has(p._id));

    const filteredPlayers = availablePlayers.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.currentClub.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddPlayer = async (masterPlayerId: string) => {
        setAddingPlayerId(masterPlayerId);
        setError(null);
        try {
            await onAdd(masterPlayerId, selectedPlayerClasses[masterPlayerId]);
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to add player';
            setError(errorMsg);
            if (onError) onError(errorMsg);
        }
        setAddingPlayerId(null);
    };

    // Get player class for a master player (use selected or suggested)
    const getPlayerClass = (player: MasterPlayer) => {
        if (!selectedTournament.usePlayerClasses) return undefined;
        return selectedPlayerClasses[player._id] || player.suggestedClass || '';
    };

    // Initialize selected class to suggested class for each player
    React.useEffect(() => {
        if (selectedTournament.usePlayerClasses) {
            const initialClasses: Record<string, string> = {};
            availablePlayers.forEach(player => {
                if (player.suggestedClass) {
                    initialClasses[player._id] = player.suggestedClass;
                }
            });
            setSelectedPlayerClasses(initialClasses);
        }
    }, [availablePlayers, selectedTournament.usePlayerClasses]);

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-md p-3 flex items-start justify-between">
                    <div>
                        <p className="font-semibold">Error Adding Player</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-200 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            )}
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-neutral-400">
                    {availablePlayers.length} player(s) available to add
                </p>
            </div>
            <div className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-neutral-700 border-neutral-600 rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                />
                <button
                    onClick={onCreateNew}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors whitespace-nowrap"
                >
                    + Create New
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredPlayers.length === 0 ? (
                    <p className="text-center text-neutral-400 py-8">
                        {searchTerm ? 'No players found matching your search' : 'No available players in database'}
                    </p>
                ) : (
                    filteredPlayers.map((player) => {
                        const selectedClass = getPlayerClass(player);
                        const classConfig = selectedClass ? getClassConfig(selectedTournament, selectedClass) : null;

                        return (
                            <div
                                key={player._id}
                                className="bg-neutral-700/50 p-3 rounded-md hover:bg-neutral-700 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3 flex-1">
                                        <img
                                            src={imageOptimizers.playerThumbnail(player.photoURL)}
                                            alt={player.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold">{player.name}</p>
                                            <p className="text-xs text-neutral-400">
                                                {player.position} | {player.currentClub}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                Matches: {player.careerStats?.matchesPlayed || 0} | Score: {player.careerStats?.totalScore || 0}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddPlayer(player._id)}
                                        disabled={addingPlayerId === player._id}
                                        className={`font-bold py-2 px-4 rounded-md text-sm transition-colors whitespace-nowrap ${
                                            addingPlayerId === player._id
                                                ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                                        }`}
                                    >
                                        {addingPlayerId === player._id ? 'Adding...' : 'Add Player'}
                                    </button>
                                </div>

                                {/* Player Class Dropdown - Only show if tournament uses player classes */}
                                {selectedTournament.usePlayerClasses && selectedTournament.playerClasses && selectedTournament.playerClasses.length > 0 && (
                                    <div className="ml-15 flex items-center gap-2">
                                        <label htmlFor={`class-${player._id}`} className="text-xs text-neutral-400 whitespace-nowrap">
                                            Player Class:
                                        </label>
                                        <select
                                            id={`class-${player._id}`}
                                            value={selectedClass}
                                            onChange={(e) => setSelectedPlayerClasses(prev => ({
                                                ...prev,
                                                [player._id]: e.target.value
                                            }))}
                                            className="flex-1 bg-neutral-600 border-neutral-500 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                                            style={{
                                                color: classConfig?.color || 'inherit'
                                            }}
                                        >
                                            <option value="">None</option>
                                            {getSortedClasses(selectedTournament).map(cls => (
                                                <option
                                                    key={cls.name}
                                                    value={cls.name}
                                                    style={{ color: cls.color }}
                                                >
                                                    {cls.icon} {cls.name} {cls.basePrice ? `(${cls.basePrice.toLocaleString()})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {player.suggestedClass && (
                                            <span className="text-xs text-neutral-500 italic">
                                                (Suggested: {player.suggestedClass})
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

const AddTeamFromDatabase: React.FC<AddTeamFromDatabaseProps> = ({
    selectedTournament,
    masterTeams,
    tournamentTeams,
    onAdd,
    onCreateNew,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [addingTeamId, setAddingTeamId] = useState<string | null>(null);

    // Filter out master teams already in this tournament
    const tournamentMasterTeamIds = new Set(tournamentTeams.map(t => t.masterTeamId).filter(Boolean));
    const availableTeams = masterTeams.filter(t => !tournamentMasterTeamIds.has(t._id));

    const filteredTeams = availableTeams.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddTeam = async (masterTeamId: string) => {
        setAddingTeamId(masterTeamId);
        await onAdd(masterTeamId);
        setAddingTeamId(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-neutral-400">
                    {availableTeams.length} team(s) available to add
                </p>
            </div>
            <div className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Search teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-neutral-700 border-neutral-600 rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                />
                <button
                    onClick={onCreateNew}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors whitespace-nowrap"
                >
                    + Create New
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredTeams.length === 0 ? (
                    <p className="text-center text-neutral-400 py-8">
                        {searchTerm ? 'No teams found matching your search' : 'No available teams in database'}
                    </p>
                ) : (
                    filteredTeams.map((team) => (
                        <div
                            key={team._id}
                            className="bg-neutral-700/50 p-3 rounded-md flex items-center justify-between hover:bg-neutral-700 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <img
                                    src={imageOptimizers.teamThumbnail(team.logoURL)}
                                    alt={team.name}
                                    className="w-12 h-12 rounded-md object-cover"
                                    loading="lazy"
                                />
                                <div>
                                    <p className="font-semibold">{team.name}</p>
                                    <p className="text-xs text-neutral-400">
                                        Owner: {team.ownerName} | {team.shortCode}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleAddTeam(team._id)}
                                disabled={addingTeamId === team._id}
                                className={`font-bold py-2 px-4 rounded-md text-sm transition-colors whitespace-nowrap ${
                                    addingTeamId === team._id
                                        ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                            >
                                {addingTeamId === team._id ? 'Adding...' : 'Add Team'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

interface PlayerFormProps {
    onSave: (player: Omit<Player, '_id' | 'tournamentId' | 'isSold' | 'finalPrice' | 'winningTeamId'>) => void;
    onClose: () => void;
    tournament: Tournament | null;
    playerToEdit?: Player;
}

const PlayerForm: React.FC<PlayerFormProps> = ({ onSave, tournament, playerToEdit }) => {
    const isEditing = !!playerToEdit;
    const [name, setName] = useState(playerToEdit?.name || '');
    const [imageURL, setImageURL] = useState(playerToEdit?.photoURL || '');
    const [stats, setStats] = useState<PlayerStats>(playerToEdit?.stats || { matchesPlayed: 0, totalScore: 0, totalWickets: 0 });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name) {
            onSave({ name, photoURL: imageURL || `https://picsum.photos/seed/${name}/200`, stats });
        }
    };

    const handleStatChange = (field: keyof PlayerStats, value: string) => {
        setStats(prev => ({
            ...prev,
            [field]: parseInt(value, 10) || 0
        }));
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-300">Player Name</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
            </div>

            <div className="bg-neutral-700/50 p-3 rounded-md space-y-3 animate-fade-in">
                 <h4 className="font-semibold text-neutral-200 mb-2 border-b border-neutral-600 pb-2">Player Stats</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="matchesPlayed" className="block text-sm font-medium text-neutral-300">Matches Played</label>
                        <input type="number" id="matchesPlayed" value={stats.matchesPlayed} onChange={(e) => handleStatChange('matchesPlayed', e.target.value)} required className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                     </div>
                     <div>
                        <label htmlFor="totalScore" className="block text-sm font-medium text-neutral-300">Total Score</label>
                        <input type="number" id="totalScore" value={stats.totalScore} onChange={(e) => handleStatChange('totalScore', e.target.value)} required className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                     </div>
                     <div>
                        <label htmlFor="totalWickets" className="block text-sm font-medium text-neutral-300">Total Wickets</label>
                        <input type="number" id="totalWickets" value={stats.totalWickets} onChange={(e) => handleStatChange('totalWickets', e.target.value)} required className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                     </div>
                 </div>
            </div>

            <ImageUpload
                value={imageURL}
                onChange={setImageURL}
                folder="players"
                label="Player Profile Image"
                placeholder="Image URL (optional)"
                previewClassName="w-16 h-16"
                previewShape="circle"
                id="player-image-file-setup"
            />
            <div className="pt-2 text-right">
                <button type="submit" className="inline-flex justify-center items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                    {isEditing ? <EditIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                    {isEditing ? 'Save Changes' : 'Add Player'}
                </button>
            </div>
        </form>
    );
};

interface TeamFormProps {
    onSave: (teamData: { name: string; ownerName: string; logoURL?: string }) => void;
}

const TeamForm: React.FC<TeamFormProps> = ({ onSave }) => {
    const [name, setName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [logoURL, setLogoURL] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && ownerName) {
            onSave({ name, ownerName, logoURL });
            // Clear form after successful submission
            setName('');
            setOwnerName('');
            setLogoURL('');
        }
    };

    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-neutral-300">Team Name</label>
                <input type="text" id="teamName" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
            </div>
             <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-neutral-300">Owner Name</label>
                <input type="text" id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
            </div>
            <ImageUpload
                value={logoURL}
                onChange={setLogoURL}
                folder="teams"
                label="Team Logo"
                placeholder="Logo URL (optional)"
                previewClassName="w-16 h-16"
                previewShape="square"
                id="logo-file-auction-setup"
            />
            <div className="pt-2 text-right">
                <button type="submit" className="inline-flex justify-center items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                    <PlusIcon className="h-5 w-5" />
                    Add Team
                </button>
            </div>
        </form>
    );
}

const AuctionSetupPanel: React.FC = () => {
    const { tournament, setTournamentStatus, addPlayer, deletePlayer, addTeam, deleteTeam } = useAuction();

    const [isAddPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
    const [isAddTeamModalOpen, setAddTeamModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedTournamentId, setSelectedTournamentId] = useState(tournament?._id || '');
    const [masterPlayers, setMasterPlayers] = useState<MasterPlayer[]>([]);
    const [masterTeams, setMasterTeams] = useState<MasterTeam[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [tournamentPlayers, setTournamentPlayers] = useState<Player[]>([]);
    const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Handle player removal from tournament (delete tournament instance)
    const handleRemovePlayer = async (playerId: string) => {
        try {
            const response = await fetch(`/api/players/${playerId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (error) {
            console.error('Failed to remove player:', error);
        }
    };

    // Handle team removal from tournament (delete tournament instance)
    const handleRemoveTeam = async (teamId: string) => {
        try {
            const response = await fetch(`/api/teams/${teamId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (error) {
            console.error('Failed to remove team:', error);
        }
    };

    // Fetch master players, master teams, and tournaments from database on mount and when refresh is triggered
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const startTime = Date.now();
                console.log('[AuctionSetup] Starting data fetch...');

                // Build parallel fetch requests
                const requests = [
                    fetch('/api/tournaments'),
                    fetch('/api/master-players'),
                    fetch('/api/master-teams'),
                ];

                // Add tournament-specific requests if tournament is selected
                if (selectedTournamentId) {
                    requests.push(
                        fetch(`/api/players?tournamentId=${selectedTournamentId}`),
                        fetch(`/api/teams?tournamentId=${selectedTournamentId}`)
                    );
                }

                // Execute all requests in parallel
                const responses = await Promise.all(requests);
                console.log(`[AuctionSetup] All requests completed in ${Date.now() - startTime}ms`);

                // Parse responses in parallel
                const [
                    tournamentsData,
                    masterPlayersData,
                    masterTeamsData,
                    tournamentPlayersData,
                    tournamentTeamsData
                ] = await Promise.all(responses.map(res => res.ok ? res.json() : null));

                // Update state
                if (tournamentsData) {
                    console.log('[AuctionSetup] Loaded tournaments:', tournamentsData.length, tournamentsData.map((t: Tournament) => ({ id: t._id, name: t.name })));
                    setTournaments(tournamentsData);
                }
                if (masterPlayersData) setMasterPlayers(masterPlayersData);
                if (masterTeamsData) setMasterTeams(masterTeamsData);
                if (tournamentPlayersData) setTournamentPlayers(tournamentPlayersData);
                if (tournamentTeamsData) setTournamentTeams(tournamentTeamsData);

                console.log(`[AuctionSetup] Total fetch time: ${Date.now() - startTime}ms`);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        fetchData();
    }, [refreshTrigger, selectedTournamentId]);

    // Initialize selectedTournamentId from context or first tournament
    React.useEffect(() => {
        console.log('[AuctionSetup] Checking tournament selection:', {
            selectedTournamentId,
            tournamentFromContext: tournament?._id,
            tournamentsLoaded: tournaments.length
        });

        if (!selectedTournamentId && tournaments.length > 0) {
            // Initialize to first tournament if no selection
            const firstTournamentId = tournaments[0]._id;
            console.log('[AuctionSetup] Initializing to first tournament:', firstTournamentId);
            setSelectedTournamentId(firstTournamentId);
        } else if (selectedTournamentId && !tournaments.find(t => t._id === selectedTournamentId) && tournaments.length > 0) {
            // If selected tournament doesn't exist in loaded tournaments, switch to first
            const firstTournamentId = tournaments[0]._id;
            console.log('[AuctionSetup] Selected tournament not found, switching to first:', firstTournamentId);
            setSelectedTournamentId(firstTournamentId);
        }
    }, [tournaments, selectedTournamentId, tournament]);

    // Get selected tournament
    const selectedTournament = tournaments.find(t => t._id === selectedTournamentId);
    console.log('[AuctionSetup] Selected tournament result:', {
        selectedTournamentId,
        found: !!selectedTournament,
        tournamentName: selectedTournament?.name
    });

    // Show message when no tournaments exist
    if (tournaments.length === 0) {
        return (
            <div className="text-center p-12">
                <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-8 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold mb-2">No Tournaments Found</h2>
                    <p className="text-neutral-400 mb-6">
                        Create a tournament in the Management Dashboard to get started with auction setup.
                    </p>
                    <a
                        href="/management"
                        className="inline-block bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        Go to Management Dashboard
                    </a>
                </div>
            </div>
        );
    }

    if (!selectedTournament) {
        return <div className="text-center p-8 text-neutral-400">Loading tournament data...</div>;
    }

    const totalPlayers = tournamentPlayers.length;
    const totalTeams = tournamentTeams.length;
    const soldPlayersCount = tournamentPlayers.filter(p => p.isSold).length;
    const availablePlayersCount = totalPlayers - soldPlayersCount;

    const isAuctionLive = selectedTournament.status === 'Live';
    const isAuctionStopped = selectedTournament.status === 'Stopped';
    const isAuctionCompleted = selectedTournament.status === 'Completed';
    const isAuctionArchived = selectedTournament.status === 'Archived';
    const canStartAuction = ['Draft', 'Setup'].includes(selectedTournament.status);
    const canArchive = isAuctionCompleted && soldPlayersCount === totalPlayers;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold">Auction Setup</h1>
                <p className="text-neutral-400 mt-1">Manage tournament rosters - add or remove players and teams</p>
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="relative w-full max-w-xl">
                        <label className="text-sm text-neutral-400 mb-1 block">Select Tournament</label>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center justify-between gap-4 w-full p-3 border border-neutral-600 rounded-md bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
                        >
                             <p className="text-lg font-semibold">{selectedTournament.name} - Budget: {selectedTournament.budgetPerTeam.toLocaleString()} | Squad: {selectedTournament.squadSize}</p>
                             <svg className={`w-5 h-5 text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-neutral-800 border border-neutral-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {tournaments.map((t) => {
                                    const getStatusColor = (status: string) => {
                                        switch(status) {
                                            case 'Live': return 'text-green-400 font-bold';
                                            case 'Stopped': return 'text-yellow-400 font-bold';
                                            case 'Completed': return 'text-purple-400 font-bold';
                                            case 'Archived': return 'text-neutral-500';
                                            default: return 'text-neutral-400';
                                        }
                                    };

                                    return (
                                        <button
                                            key={t._id}
                                            onClick={() => {
                                                setSelectedTournamentId(t._id);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left p-3 hover:bg-neutral-700 transition-colors ${
                                                t._id === selectedTournamentId ? 'bg-neutral-700 text-brand-primary' : ''
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold">{t.name}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(t.status)}`}>
                                                    {t.status === 'Live' && '🔴 '}
                                                    {t.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-400">
                                                Budget: {t.budgetPerTeam.toLocaleString()} | Squad: {t.squadSize}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {isAuctionLive && (
                        <div className="bg-green-600/50 text-green-200 border border-green-500 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
                             <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="6" /></svg>
                            LIVE
                        </div>
                    )}
                    {isAuctionStopped && (
                        <div className="bg-yellow-600/50 text-yellow-200 border border-yellow-500 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2">
                             <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                            Stopped
                        </div>
                    )}
                    {isAuctionCompleted && (
                        <div className="bg-purple-600/50 text-purple-200 border border-purple-500 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2">
                             <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.06 0l4.001-5.5z" clipRule="evenodd" /></svg>
                            Completed
                        </div>
                    )}
                    {isAuctionArchived && (
                        <div className="bg-neutral-600/50 text-neutral-200 border border-neutral-500 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2">
                             <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" /><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                            Archived
                        </div>
                    )}
                </div>

                <div className="bg-neutral-900/40 p-3 rounded-md text-xs text-neutral-400 font-mono space-y-1">
                    <p>Status: <span className="text-yellow-300">{selectedTournament.status.toUpperCase()}</span></p>
                    <p>isAuctionActive: <span className={isAuctionLive ? 'text-green-400' : 'text-red-400'}>{isAuctionLive.toString()}</span></p>
                    <p>Tournament ID: <span className="text-cyan-400">{selectedTournament._id}</span></p>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-700 pt-4">
                    <div className="flex items-center gap-4">
                        {/* Start Auction Button - Show for Draft/Setup */}
                        {canStartAuction && (
                            <button
                                onClick={async () => {
                                    if (totalTeams < 2) {
                                        return;
                                    }
                                    if (totalPlayers < 1) {
                                        return;
                                    }

                                    try {
                                        const response = await fetch('/api/auction/start', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ tournamentId: selectedTournament._id }),
                                        });
                                        const data = await response.json();

                                        if (response.ok) {
                                            setRefreshTrigger(prev => prev + 1);
                                        }
                                    } catch (error) {
                                        console.error('Failed to start auction:', error);
                                    }
                                }}
                                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Start Auction
                            </button>
                        )}

                        {/* Stop Auction Button - Show for Live */}
                        {isAuctionLive && (
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await fetch('/api/auction/stop', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ tournamentId: selectedTournament._id }),
                                        });
                                        const data = await response.json();

                                        if (response.ok) {
                                            setRefreshTrigger(prev => prev + 1);
                                        }
                                    } catch (error) {
                                        console.error('Failed to stop auction:', error);
                                    }
                                }}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                </svg>
                                Stop Auction
                            </button>
                        )}

                        {/* Restart Auction Button - Show for Stopped */}
                        {isAuctionStopped && (
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await fetch('/api/auction/restart', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ tournamentId: selectedTournament._id }),
                                        });
                                        const data = await response.json();

                                        if (response.ok) {
                                            setRefreshTrigger(prev => prev + 1);
                                        }
                                    } catch (error) {
                                        console.error('Failed to restart auction:', error);
                                    }
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Restart Auction
                            </button>
                        )}

                        {/* Archive Button - Show for Completed */}
                        {canArchive && (
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await fetch(`/api/tournaments/${selectedTournament._id}/archive`, {
                                            method: 'POST',
                                        });
                                        const data = await response.json();

                                        if (response.ok) {
                                            setRefreshTrigger(prev => prev + 1);
                                        }
                                    } catch (error) {
                                        console.error('Failed to archive tournament:', error);
                                    }
                                }}
                                className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                Archive Tournament
                            </button>
                        )}

                        {isAuctionArchived && (
                            <div className="text-neutral-400 italic">This tournament is archived (read-only)</div>
                        )}
                    </div>
                    <div className="flex gap-8 text-center">
                        <div>
                            <p className="text-2xl font-bold">{totalPlayers}<span className="text-sm text-neutral-400">/{totalPlayers}</span></p>
                            <p className="text-xs text-neutral-500">Players</p>
                        </div>
                         <div>
                            <p className="text-2xl font-bold">{totalTeams}</p>
                            <p className="text-xs text-neutral-500">Teams</p>
                        </div>
                         <div>
                            <p className="text-2xl font-bold text-green-400">{availablePlayersCount}</p>
                            <p className="text-xs text-neutral-500">Available</p>
                        </div>
                         <div>
                            <p className="text-2xl font-bold text-red-400">{soldPlayersCount}</p>
                            <p className="text-xs text-neutral-500">Sold</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Registered Players</h3>
                        <div className="flex gap-2">
                             <button className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">Sync All</button>
                             <button onClick={() => setAddPlayerModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-1"><PlusIcon className="h-4 w-4" /> Add Players</button>
                        </div>
                    </div>
                    <ul className="space-y-3 h-96 overflow-y-auto pr-2">
                        {tournamentPlayers.length === 0 ? (
                            <p className="text-center text-neutral-400 py-8">No players registered for this tournament</p>
                        ) : (
                            tournamentPlayers.map(player => (
                                <li key={player._id} className="bg-neutral-900/50 p-3 rounded-md flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={imageOptimizers.playerThumbnail(player.photoURL)}
                                            alt={player.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                            loading="lazy"
                                        />
                                        <div>
                                            <p className="font-semibold">#{player.playerNo || player._id} {player.name}</p>
                                            <p className="text-sm text-neutral-400">Matches: {player.stats.matchesPlayed}</p>
                                            <p className={`text-xs font-semibold ${player.isSold ? 'text-red-400' : 'text-green-400'} tracking-wider`}>
                                                {player.isSold ? 'SOLD' : 'AVAILABLE'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemovePlayer(player._id)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-lg text-sm transition-colors">Remove</button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
                 <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Registered Teams</h3>
                        <button onClick={() => setAddTeamModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-1"><PlusIcon className="h-4 w-4" /> Add Teams</button>
                    </div>
                     <ul className="space-y-3 h-96 overflow-y-auto pr-2">
                        {totalTeams === 0 ? (
                            <p className="text-center text-neutral-400 py-8">No teams registered for this tournament</p>
                        ) : (
                            tournamentTeams.map(team => (
                                <li key={team._id} className="bg-neutral-900/50 p-3 rounded-md flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={imageOptimizers.teamThumbnail(team.logoURL)}
                                            alt={team.name}
                                            className="w-12 h-12 rounded-md object-cover"
                                            loading="lazy"
                                        />
                                        <div>
                                            <p className="font-semibold">{team.name}</p>
                                            <p className="text-sm text-neutral-400">Budget: {team.initialBudget?.toLocaleString() || 'Not set'}</p>
                                            <p className="text-xs text-neutral-400">Remaining: {team.currentBalance?.toLocaleString() || 'N/A'} | Players: {team.playersPurchased?.length || 0}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveTeam(team._id)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-lg text-sm transition-colors">Remove</button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            <Modal isOpen={isAddPlayerModalOpen} onClose={() => setAddPlayerModalOpen(false)} title="Add Players to Tournament" size="2xl">
                <AddPlayerFromDatabase
                    selectedTournament={selectedTournament}
                    masterPlayers={masterPlayers}
                    tournamentPlayers={tournamentPlayers}
                    onAdd={async (masterPlayerId, playerClass) => {
                        // Create tournament player instance from master player
                        const response = await fetch('/api/players/create-from-master', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                masterPlayerId,
                                tournamentId: selectedTournament._id,
                                playerClass: playerClass || undefined
                            }),
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to add player to tournament');
                        }

                        // Refresh player list without closing modal
                        setRefreshTrigger(prev => prev + 1);
                    }}
                    onCreateNew={() => {
                        setAddPlayerModalOpen(false);
                        // Navigate to Management Dashboard to create new master players
                    }}
                />
            </Modal>

            <Modal isOpen={isAddTeamModalOpen} onClose={() => setAddTeamModalOpen(false)} title="Add Teams to Tournament" size="2xl">
                <AddTeamFromDatabase
                    selectedTournament={selectedTournament}
                    masterTeams={masterTeams}
                    tournamentTeams={tournamentTeams}
                    onAdd={async (masterTeamId) => {
                        // Create tournament team instance from master team
                        try {
                            const response = await fetch('/api/teams/create-from-master', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    masterTeamId,
                                    tournamentId: selectedTournament._id
                                }),
                            });
                            if (response.ok) {
                                // Refresh team list without closing modal
                                setRefreshTrigger(prev => prev + 1);
                            }
                        } catch (error) {
                            console.error('Failed to add team:', error);
                        }
                    }}
                    onCreateNew={() => {
                        setAddTeamModalOpen(false);
                        // Navigate to Management Dashboard to create new master teams
                    }}
                />
            </Modal>
        </div>
    );
};

export default AuctionSetupPanel;
