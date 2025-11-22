'use client';

import React, { useState, useMemo } from 'react';
import { useAuction } from '@/hooks/useAuction';
import { Player, Team, Tournament, PlayerStats, MasterTeam, MasterPlayer } from '@/types';
import { getAuthHeaders } from '@/lib/api-client';
import Modal from './Modal';
import { PlusIcon, EditIcon } from './icons';
import { imageOptimizers } from '@/lib/imageOptimization';
import ImageUpload from './ImageUpload';
import { getSortedClasses, getClassConfig } from '@/lib/playerClassUtils';
import BulkAddTournamentPlayers from './BulkAddTournamentPlayers';
import DeleteButton from './shared/DeleteButton';


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

const MASTER_DATA_CACHE_KEY = 'prostream:auction-setup-master';
const MASTER_DATA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

    // Memoize tournament player IDs set to avoid recreating on every render
    const tournamentMasterPlayerIds = useMemo(
        () => new Set(tournamentPlayers.map(p => p.masterPlayerId).filter(Boolean)),
        [tournamentPlayers]
    );

    // Memoize available players to avoid filtering on every render
    const availablePlayers = useMemo(
        () => masterPlayers.filter(p => !tournamentMasterPlayerIds.has(p._id)),
        [masterPlayers, tournamentMasterPlayerIds]
    );

    // Memoize filtered players based on search term
    const filteredPlayers = useMemo(
        () => availablePlayers.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.currentClub.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [availablePlayers, searchTerm]
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
                <div className="rounded-md p-3 flex items-start justify-between" style={{
                    color: 'var(--status-danger)',
                    border: '1px solid color-mix(in oklab, var(--status-danger) 40%, transparent)',
                    background: 'color-mix(in oklab, var(--status-danger) 12%, transparent)'
                }}>
                    <div>
                        <p className="font-semibold">Error Adding Player</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="hover:opacity-80"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        ✕
                    </button>
                </div>
            )}
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {availablePlayers.length} player(s) available to add
                </p>
            </div>
            <div className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                    style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                />
                <button
                    onClick={onCreateNew}
                    className="text-white font-bold py-2 px-4 rounded-md transition-colors whitespace-nowrap hover:opacity-80"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                    + Create New
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredPlayers.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                        {searchTerm ? 'No players found matching your search' : 'No available players in database'}
                    </p>
                ) : (
                    filteredPlayers.map((player) => {
                        const selectedClass = getPlayerClass(player);
                        const classConfig = selectedClass ? getClassConfig(selectedTournament, selectedClass) : null;

                        return (
                            <div
                                key={player._id}
                                className="p-3 rounded-md transition-colors"
                                style={{ backgroundColor: 'var(--surface-card)' }}
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
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
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
                                                ? 'opacity-60 cursor-not-allowed'
                                                : ''
                                        }`}
                                    >
                                        {addingPlayerId === player._id ? 'Adding...' : 'Add Player'}
                                    </button>
                                </div>

                                {/* Player Class Dropdown - Only show if tournament uses player classes */}
                                {selectedTournament.usePlayerClasses && selectedTournament.playerClasses && selectedTournament.playerClasses.length > 0 && (
                                    <div className="ml-15 flex items-center gap-2">
                                        <label htmlFor={`class-${player._id}`} className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                                            Player Class:
                                        </label>
                                        <select
                                            id={`class-${player._id}`}
                                            value={selectedClass}
                                            onChange={(e) => setSelectedPlayerClasses(prev => ({
                                                ...prev,
                                                [player._id]: e.target.value
                                            }))}
                                            className="flex-1 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                                            style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
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
                                                    {cls.code} - {cls.icon} {cls.name} {cls.basePrice ? `(${cls.basePrice.toLocaleString()})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {player.suggestedClass && (
                                            <span className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>
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

    // Memoize tournament team IDs set to avoid recreating on every render
    const tournamentMasterTeamIds = useMemo(
        () => new Set(tournamentTeams.map(t => t.masterTeamId).filter(Boolean)),
        [tournamentTeams]
    );

    // Memoize available teams to avoid filtering on every render
    const availableTeams = useMemo(
        () => masterTeams.filter(t => !tournamentMasterTeamIds.has(t._id)),
        [masterTeams, tournamentMasterTeamIds]
    );

    // Memoize filtered teams based on search term
    const filteredTeams = useMemo(
        () => availableTeams.filter(t =>
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [availableTeams, searchTerm]
    );

    const handleAddTeam = async (masterTeamId: string) => {
        setAddingTeamId(masterTeamId);
        await onAdd(masterTeamId);
        setAddingTeamId(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {availableTeams.length} team(s) available to add
                </p>
            </div>
            <div className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Search teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                    style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                />
                <button
                    onClick={onCreateNew}
                    className="text-white font-bold py-2 px-4 rounded-md transition-colors whitespace-nowrap hover:opacity-80"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                    + Create New
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredTeams.length === 0 ? (
                    <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                        {searchTerm ? 'No teams found matching your search' : 'No available teams in database'}
                    </p>
                ) : (
                    filteredTeams.map((team) => (
                        <div
                            key={team._id}
                            className="p-3 rounded-md flex items-center justify-between transition-colors"
                            style={{ backgroundColor: 'var(--surface-card)' }}
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
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        Owner: {team.ownerName} | {team.shortCode}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleAddTeam(team._id)}
                                disabled={addingTeamId === team._id}
                                className={`font-bold py-2 px-4 rounded-md text-sm transition-colors whitespace-nowrap ${
                                    addingTeamId === team._id
                                        ? 'opacity-60 cursor-not-allowed'
                                        : ''
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
                <label htmlFor="name" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Player Name</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>

            <div className="p-3 rounded-md space-y-3 animate-fade-in" style={{ backgroundColor: 'var(--surface-card)' }}>
                 <h4 className="font-semibold mb-2 border-b pb-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}>Player Stats</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="matchesPlayed" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Matches Played</label>
                        <input type="number" id="matchesPlayed" value={stats.matchesPlayed} onChange={(e) => handleStatChange('matchesPlayed', e.target.value)} required className="mt-1 block w-full rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
                     </div>
                     <div>
                        <label htmlFor="totalScore" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Score</label>
                        <input type="number" id="totalScore" value={stats.totalScore} onChange={(e) => handleStatChange('totalScore', e.target.value)} required className="mt-1 block w-full rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
                     </div>
                     <div>
                        <label htmlFor="totalWickets" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Wickets</label>
                        <input type="number" id="totalWickets" value={stats.totalWickets} onChange={(e) => handleStatChange('totalWickets', e.target.value)} required className="mt-1 block w-full rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
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
                <label htmlFor="teamName" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Team Name</label>
                <input type="text" id="teamName" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
             <div>
                <label htmlFor="ownerName" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Owner Name</label>
                <input type="text" id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required className="mt-1 block w-full rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
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
    const [isBulkAddPlayerModalOpen, setBulkAddPlayerModalOpen] = useState(false);
    const [isAddTeamModalOpen, setAddTeamModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedTournamentId, setSelectedTournamentId] = useState(tournament?._id || '');
    const [masterPlayers, setMasterPlayers] = useState<MasterPlayer[]>([]);
    const [masterTeams, setMasterTeams] = useState<MasterTeam[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [tournamentPlayers, setTournamentPlayers] = useState<Player[]>([]);
    const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [exportingPlayers, setExportingPlayers] = useState(false);
    const [showClearPlayersConfirm, setShowClearPlayersConfirm] = useState(false);
    const [showClearTeamsConfirm, setShowClearTeamsConfirm] = useState(false);
    const [clearingPlayers, setClearingPlayers] = useState(false);
    const [clearingTeams, setClearingTeams] = useState(false);

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

    // Export tournament players to Excel
    const handleExportPlayers = async () => {
        if (!selectedTournament || tournamentPlayers.length === 0) {
            alert('No players to export');
            return;
        }

        setExportingPlayers(true);
        try {
            const response = await fetch(`/api/players/tournament-export?tournamentId=${selectedTournament._id}`, { headers: getAuthHeaders() });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to export players');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tournament_players_export_${selectedTournament.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            alert(`Failed to export players: ${error.message}`);
        } finally {
            setExportingPlayers(false);
        }
    };

    // Clear all tournament players
    const handleClearAllPlayers = async () => {
        if (!selectedTournament) return;

        setClearingPlayers(true);
        try {
            const response = await fetch('/api/players/bulk-delete', {
                method: 'DELETE',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: selectedTournament._id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to clear players');
            }

            alert(`Successfully cleared ${data.deletedCount} player(s) from the tournament`);
            setShowClearPlayersConfirm(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (error: any) {
            alert(`Failed to clear players: ${error.message}`);
        } finally {
            setClearingPlayers(false);
        }
    };

    // Clear all tournament teams
    const handleClearAllTeams = async () => {
        if (!selectedTournament) return;

        setClearingTeams(true);
        try {
            const response = await fetch('/api/teams/bulk-delete', {
                method: 'DELETE',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: selectedTournament._id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to clear teams');
            }

            alert(`Successfully cleared ${data.deletedCount} team(s) from the tournament`);
            setShowClearTeamsConfirm(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (error: any) {
            alert(`Failed to clear teams: ${error.message}`);
        } finally {
            setClearingTeams(false);
        }
    };

    const hydrateMasterDataFromCache = React.useCallback(() => {
        if (typeof window === 'undefined') return false;
        try {
            const cachedRaw = sessionStorage.getItem(MASTER_DATA_CACHE_KEY);
            if (!cachedRaw) return false;
            const cached = JSON.parse(cachedRaw);
            if (!cached?.timestamp || Date.now() - cached.timestamp > MASTER_DATA_CACHE_TTL) {
                return false;
            }

            setTournaments(cached.tournaments || []);
            setMasterPlayers(cached.masterPlayers || []);
            setMasterTeams(cached.masterTeams || []);
            return true;
        } catch (error) {
            console.warn('Failed to hydrate master data cache:', error);
            return false;
        }
    }, []);

    // Fetch master data only on mount (not when tournament selection changes)
    React.useEffect(() => {
        let cancelled = false;

        const fetchMasterData = async () => {
            try {
                const startTime = Date.now();
                console.log('[AuctionSetup] Starting master data fetch...');

                // Only fetch master data that doesn't depend on tournament selection
                const headers = getAuthHeaders();
                const responses = await Promise.all([
                    fetch('/api/tournaments', { headers }),
                    fetch('/api/master-players', { headers }),
                    fetch('/api/master-teams', { headers }),
                ]);

                const [tournamentsData, masterPlayersData, masterTeamsData] = await Promise.all(
                    responses.map(res => (res.ok ? res.json() : null))
                );

                if (cancelled) return;

                const tournaments = tournamentsData || [];
                const players = masterPlayersData
                    ? Array.isArray(masterPlayersData)
                        ? masterPlayersData
                        : masterPlayersData.data || []
                    : [];
                const teams = masterTeamsData
                    ? Array.isArray(masterTeamsData)
                        ? masterTeamsData
                        : masterTeamsData.data || []
                    : [];

                console.log('[AuctionSetup] Loaded tournaments:', tournaments.length);

                setTournaments(tournaments);
                setMasterPlayers(players);
                setMasterTeams(teams);

                if (typeof window !== 'undefined') {
                    sessionStorage.setItem(
                        MASTER_DATA_CACHE_KEY,
                        JSON.stringify({
                            timestamp: Date.now(),
                            tournaments,
                            masterPlayers: players,
                            masterTeams: teams,
                        })
                    );
                }

                console.log(`[AuctionSetup] Master data fetch completed in ${Date.now() - startTime}ms`);
            } catch (error) {
                console.error('Failed to fetch master data:', error);
            }
        };

        const shouldUseCache = refreshTrigger === 0 && hydrateMasterDataFromCache();
        if (!shouldUseCache) {
            fetchMasterData();
        }

        return () => {
            cancelled = true;
        };
    }, [refreshTrigger, hydrateMasterDataFromCache]);

    // Fetch tournament-specific data only when tournament selection changes
    React.useEffect(() => {
        const fetchTournamentData = async () => {
            if (!selectedTournamentId) {
                setTournamentPlayers([]);
                setTournamentTeams([]);
                return;
            }

            try {
                const startTime = Date.now();
                console.log(`[AuctionSetup] Starting tournament-specific data fetch for ${selectedTournamentId}...`);

                // Only fetch tournament-specific data
                const headers = getAuthHeaders();
                const responses = await Promise.all([
                    fetch(`/api/players?tournamentId=${selectedTournamentId}`, { headers }),
                    fetch(`/api/teams?tournamentId=${selectedTournamentId}`, { headers })
                ]);

                const [tournamentPlayersData, tournamentTeamsData] = await Promise.all(
                    responses.map(res => res.ok ? res.json() : null)
                );

                if (tournamentPlayersData) setTournamentPlayers(tournamentPlayersData);
                if (tournamentTeamsData) setTournamentTeams(tournamentTeamsData);

                console.log(`[AuctionSetup] Tournament data fetch completed in ${Date.now() - startTime}ms`);
            } catch (error) {
                console.error('Failed to fetch tournament data:', error);
            }
        };

        fetchTournamentData();
    }, [selectedTournamentId, refreshTrigger]);

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
                <div className="rounded-lg p-8 max-w-2xl mx-auto setup-panel">
                    <h2 className="text-2xl font-bold mb-2">No Tournaments Found</h2>
                    <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
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
        return <div className="text-center p-8" style={{ color: 'var(--text-secondary)' }}>Loading tournament data...</div>;
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

            <div className="rounded-lg p-6 space-y-4 setup-panel">
                <div className="flex justify-between items-start">
                    <div className="relative w-full max-w-xl">
                        <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Select Tournament</label>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center justify-between gap-4 w-full p-3 rounded-md transition-colors border"
                            style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--surface-subtle)' }}
                        >
                             <p className="text-lg font-semibold">{selectedTournament.name} - Budget: {selectedTournament.budgetPerTeam.toLocaleString()} | Squad: {selectedTournament.squadSize}</p>
                             <svg className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        </button>
                          {isDropdownOpen && (
                              <div className="absolute z-10 mt-1 w-full rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
                                  {tournaments.map((t) => {
                                      const getStatusStyle = (status: string) => {
                                          switch(status) {
                                              case 'Live': return { color: 'var(--status-success)', fontWeight: 700 } as const;
                                              case 'Stopped': return { color: 'var(--status-warning)', fontWeight: 700 } as const;
                                              case 'Completed': return { color: 'var(--status-info)', fontWeight: 700 } as const;
                                              case 'Archived': return { color: 'var(--text-tertiary)' } as const;
                                              default: return { color: 'var(--text-secondary)' } as const;
                                          }
                                      };

                                    return (
                                        <button
                                            key={t._id}
                                            onClick={() => {
                                                setSelectedTournamentId(t._id);
                                                setIsDropdownOpen(false);
                                            }}
                                              className={`w-full text-left p-3 transition-colors`}
                                              style={{ backgroundColor: t._id === selectedTournamentId ? 'var(--surface-hover)' : 'transparent', color: t._id === selectedTournamentId ? 'var(--brand-primary)' : 'var(--text-primary)' }}
                                              style={{ backgroundColor: t._id === selectedTournamentId ? 'var(--surface-hover)' : undefined, color: t._id === selectedTournamentId ? 'var(--brand-primary)' : undefined }}
                                              >
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold">{t.name}</p>
                                                  <span className={`text-xs px-2 py-0.5 rounded-full`} style={getStatusStyle(t.status)}>
                                                    {t.status === 'Live' && '🔴 '}
                                                    {t.status}
                                                </span>
                                            </div>
                                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                  Budget: {t.budgetPerTeam.toLocaleString()} | Squad: {t.squadSize}
                                              </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {isAuctionLive && (
                        <div className="text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2 animate-pulse" style={{ color: 'var(--status-success)', border: '1px solid color-mix(in oklab, var(--status-success) 40%, transparent)', background: 'color-mix(in oklab, var(--status-success) 12%, transparent)' }}>
                             <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="6" /></svg>
                            LIVE
                        </div>
                    )}
                    {isAuctionStopped && (
                        <div className="text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2" style={{ color: 'var(--status-warning)', border: '1px solid color-mix(in oklab, var(--status-warning) 40%, transparent)', background: 'color-mix(in oklab, var(--status-warning) 12%, transparent)' }}>
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
                        <div className="text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-primary)', background: 'var(--surface-subtle)' }}>
                             <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" /><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                            Archived
                        </div>
                    )}
                </div>

                <div className="p-3 rounded-md text-xs font-mono space-y-1" style={{ backgroundColor: 'var(--surface-subtle)', color: 'var(--text-secondary)' }}>
                    <p>Status: <span style={{ color: 'var(--status-warning)' }}>{selectedTournament.status.toUpperCase()}</span></p>
                    <p>isAuctionActive: <span style={{ color: isAuctionLive ? 'var(--status-success)' : 'var(--status-danger)' }}>{isAuctionLive.toString()}</span></p>
                    <p>Tournament ID: <span className="text-cyan-400">{selectedTournament._id}</span></p>
                </div>

                <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: 'var(--border-primary)' }}>
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
                                            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
                                className="text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 hover:opacity-80"
                                style={{ backgroundColor: 'var(--brand-primary)' }}
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
                                            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
                                className="text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 hover:opacity-80"
                                style={{ backgroundColor: 'var(--status-danger)' }}
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
                                            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
                                className="text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 hover:opacity-80"
                                style={{ backgroundColor: 'var(--brand-primary)' }}
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
                                className="text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 hover:opacity-80"
                                style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                Archive Tournament
                            </button>
                        )}

                        {isAuctionArchived && (
                            <div className="italic" style={{ color: 'var(--text-secondary)' }}>This tournament is archived (read-only)</div>
                        )}
                    </div>
                    <div className="flex gap-8 text-center">
                        <div>
                            <p className="text-2xl font-bold">{totalPlayers}<span className="text-sm" style={{ color: 'var(--text-secondary)' }}>/{totalPlayers}</span></p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Players</p>
                        </div>
                         <div>
                            <p className="text-2xl font-bold">{totalTeams}</p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Teams</p>
                        </div>
                         <div>
                            <p className="text-2xl font-bold" style={{ color: 'var(--status-success)' }}>{availablePlayersCount}</p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Available</p>
                        </div>
                         <div>
                            <p className="text-2xl font-bold" style={{ color: 'var(--status-danger)' }}>{soldPlayersCount}</p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Sold</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="rounded-lg p-6 setup-panel">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Registered Players</h3>
                        <div className="flex gap-2">
                             <button className="text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' }}>Sync All</button>
                             <button
                                onClick={handleExportPlayers}
                                disabled={exportingPlayers || tournamentPlayers.length === 0}
                                className="disabled:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-1 hover:opacity-80"
                                style={{ backgroundColor: 'var(--brand-secondary)' }}
                             >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {exportingPlayers ? 'Exporting...' : 'Export to Excel'}
                             </button>
                             <button onClick={() => setBulkAddPlayerModalOpen(true)} className="text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-1 hover:opacity-80" style={{ backgroundColor: 'var(--brand-primary)' }}>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Bulk Add
                             </button>
                             <button onClick={() => setAddPlayerModalOpen(true)} className="text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-1 hover:opacity-80" style={{ backgroundColor: 'var(--brand-primary)' }}><PlusIcon className="h-4 w-4" /> Add Players</button>
                             <button
                                onClick={() => setShowClearPlayersConfirm(true)}
                                disabled={tournamentPlayers.length === 0}
                                className="disabled:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors hover:opacity-80"
                                style={{ backgroundColor: 'var(--status-danger)' }}
                             >
                                Clear All
                             </button>
                        </div>
                    </div>
                    <ul className="space-y-3 h-96 overflow-y-auto pr-2">
                        {tournamentPlayers.length === 0 ? (
                            <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>No players registered for this tournament</p>
                        ) : (
                            tournamentPlayers.map(player => (
                                <li key={player._id} className="p-3 rounded-md flex items-center justify-between" style={{ backgroundColor: 'var(--surface-card)' }}>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={imageOptimizers.playerThumbnail(player.photoURL)}
                                            alt={player.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                            loading="lazy"
                                        />
                                        <div>
                                            <p className="font-semibold">#{player.playerNo || player._id} {player.name}</p>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Matches: {player.stats.matchesPlayed}</p>
                                            <p className={`text-xs font-semibold tracking-wider`} style={{ color: player.isSold ? 'var(--status-danger)' : 'var(--status-success)' }}>
                                                {player.isSold ? 'SOLD' : 'AVAILABLE'}
                                            </p>
                                        </div>
                                    </div>
                                    <DeleteButton
                                        ariaLabel={`Remove ${player.name}`}
                                        onClick={() => handleRemovePlayer(player._id)}
                                        className="shrink-0"
                                    />
                                </li>
                            ))
                        )}
                    </ul>
                </div>
                 <div className="rounded-lg p-6 setup-panel">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Registered Teams</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setAddTeamModalOpen(true)} className="text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-1 hover:opacity-80" style={{ backgroundColor: 'var(--brand-primary)' }}><PlusIcon className="h-4 w-4" /> Add Teams</button>
                            <button
                                onClick={() => setShowClearTeamsConfirm(true)}
                                disabled={totalTeams === 0}
                                className="disabled:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors hover:opacity-80"
                                style={{ backgroundColor: 'var(--status-danger)' }}
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                     <ul className="space-y-3 h-96 overflow-y-auto pr-2">
                        {totalTeams === 0 ? (
                            <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>No teams registered for this tournament</p>
                        ) : (
                            tournamentTeams.map(team => (
                                <li key={team._id} className="p-3 rounded-md flex items-center justify-between" style={{ backgroundColor: 'var(--surface-card)' }}>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={imageOptimizers.teamThumbnail(team.logoURL)}
                                            alt={team.name}
                                            className="w-12 h-12 rounded-md object-cover"
                                            loading="lazy"
                                        />
                                        <div>
                                            <p className="font-semibold">{team.name}</p>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Budget: {team.initialBudget?.toLocaleString() || 'Not set'}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Remaining: {team.currentBalance?.toLocaleString() || 'N/A'} | Players: {team.playersPurchased?.length || 0}</p>
                                        </div>
                                    </div>
                                    <DeleteButton
                                        ariaLabel={`Remove ${team.name}`}
                                        onClick={() => handleRemoveTeam(team._id)}
                                        className="shrink-0"
                                    />
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            <Modal isOpen={isBulkAddPlayerModalOpen} onClose={() => setBulkAddPlayerModalOpen(false)} title="Bulk Add Players to Tournament" size="2xl">
                <BulkAddTournamentPlayers
                    tournament={selectedTournament}
                    onSuccess={() => {
                        setRefreshTrigger(prev => prev + 1);
                        setBulkAddPlayerModalOpen(false);
                    }}
                />
            </Modal>

            <Modal isOpen={isAddPlayerModalOpen} onClose={() => setAddPlayerModalOpen(false)} title="Add Players to Tournament" size="2xl">
                <AddPlayerFromDatabase
                    selectedTournament={selectedTournament}
                    masterPlayers={masterPlayers}
                    tournamentPlayers={tournamentPlayers}
                    onAdd={async (masterPlayerId, playerClass) => {
                        // Create tournament player instance from master player
                        const response = await fetch('/api/players/create-from-master', {
                            method: 'POST',
                            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
                                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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

            <Modal isOpen={showClearPlayersConfirm} onClose={() => setShowClearPlayersConfirm(false)} title="Clear All Tournament Players" size="sm">
                <div className="space-y-4">
                    <div className="rounded-lg p-4" style={{ color: 'var(--status-danger)', border: '1px solid color-mix(in oklab, var(--status-danger) 40%, transparent)', background: 'color-mix(in oklab, var(--status-danger) 12%, transparent)' }}>
                        <p className="font-semibold mb-2">Warning: This action cannot be undone</p>
                        <p className="text-sm">You are about to delete all {tournamentPlayers.length} registered players from this tournament.</p>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Are you sure you want to clear all players?</p>
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={() => setShowClearPlayersConfirm(false)}
                            className="text-white font-bold py-2 px-4 rounded-lg transition-colors hover:opacity-80"
                            style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleClearAllPlayers}
                            disabled={clearingPlayers}
                            className="disabled:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg transition-colors hover:opacity-80"
                            style={{ backgroundColor: 'var(--status-danger)' }}
                        >
                            {clearingPlayers ? 'Clearing...' : 'Clear All Players'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showClearTeamsConfirm} onClose={() => setShowClearTeamsConfirm(false)} title="Clear All Tournament Teams" size="sm">
                <div className="space-y-4">
                    <div className="rounded-lg p-4" style={{ color: 'var(--status-danger)', border: '1px solid color-mix(in oklab, var(--status-danger) 40%, transparent)', background: 'color-mix(in oklab, var(--status-danger) 12%, transparent)' }}>
                        <p className="font-semibold mb-2">Warning: This action cannot be undone</p>
                        <p className="text-sm">You are about to delete all {tournamentTeams.length} registered teams from this tournament.</p>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Are you sure you want to clear all teams?</p>
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={() => setShowClearTeamsConfirm(false)}
                            className="text-white font-bold py-2 px-4 rounded-lg transition-colors hover:opacity-80"
                            style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleClearAllTeams}
                            disabled={clearingTeams}
                            className="disabled:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg transition-colors hover:opacity-80"
                            style={{ backgroundColor: 'var(--status-danger)' }}
                        >
                            {clearingTeams ? 'Clearing...' : 'Clear All Teams'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AuctionSetupPanel;
