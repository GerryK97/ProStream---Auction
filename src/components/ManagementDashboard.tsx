'use client';

import React, { useState, useEffect } from 'react';
import { useAuction } from '@/hooks/useAuction';
import { Player, Team, Tournament, PlayerStats, MasterTeam, MasterPlayer, PlayerClassConfig, BasePriceStrategy } from '@/types';
import { PlusIcon, EditIcon, DeleteIcon, LoadingSpinner, CheckCircleIcon, DocumentTextIcon } from './icons';
import Modal from './Modal';
import { imageOptimizers } from '@/lib/imageOptimization';
import ImageUpload from './ImageUpload';
import { getDefaultClasses } from '@/lib/playerClassUtils';
import BulkPlayerUpload from './BulkPlayerUpload';

type ManagementView = 'tournaments' | 'teams' | 'players';

const ManagementDashboard: React.FC<{ view: ManagementView }> = ({ view }) => {
    const { } = useAuction();

    // State fetched from API
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [masterTeams, setMasterTeams] = useState<MasterTeam[]>([]);
    const [masterPlayers, setMasterPlayers] = useState<MasterPlayer[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [isAddPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<MasterTeam | null>(null);
    const [editingPlayer, setEditingPlayer] = useState<MasterPlayer | null>(null);
    const [playerToDelete, setPlayerToDelete] = useState<MasterPlayer | null>(null);

    // Clear All confirmation modals
    const [showClearPlayersConfirm, setShowClearPlayersConfirm] = useState(false);
    const [showClearTeamsConfirm, setShowClearTeamsConfirm] = useState(false);
    const [clearConfirmText, setClearConfirmText] = useState('');
    const [clearingMasterData, setClearingMasterData] = useState(false);

    // View-based data fetching - only fetch data needed for the active view
    // This reduces network requests by 33-67% depending on the current view
    useEffect(() => {
        const fetchData = async () => {
            try {
                const requests: Promise<Response>[] = [];

                // Always fetch tournaments as it's used for context
                requests.push(fetch('/api/tournaments'));

                // Fetch view-specific data only
                switch (view) {
                    case 'teams':
                        requests.push(fetch('/api/master-teams'));
                        break;
                    case 'players':
                        requests.push(fetch('/api/master-players'));
                        break;
                    case 'tournaments':
                        // Tournaments already fetched above
                        break;
                }

                const responses = await Promise.all(requests);
                let responseIndex = 0;

                // Parse tournaments response
                const tournamentsRes = responses[responseIndex++];
                if (tournamentsRes.ok) {
                    const tournamentsData = await tournamentsRes.json();
                    setTournaments(tournamentsData);
                }

                // Parse view-specific responses
                switch (view) {
                    case 'teams':
                        if (responseIndex < responses.length) {
                            const teamsRes = responses[responseIndex];
                            if (teamsRes.ok) {
                                const teamsData = await teamsRes.json();
                                // Handle paginated response
                                setMasterTeams(Array.isArray(teamsData) ? teamsData : teamsData.data || []);
                            }
                        }
                        break;
                    case 'players':
                        if (responseIndex < responses.length) {
                            const playersRes = responses[responseIndex];
                            if (playersRes.ok) {
                                const playersData = await playersRes.json();
                                // Handle paginated response
                                setMasterPlayers(Array.isArray(playersData) ? playersData : playersData.data || []);
                            }
                        }
                        break;
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };

        fetchData();
    }, [refreshTrigger, view]);

    useEffect(() => {
        setAddPlayerModalOpen(false);
        setEditingTeam(null);
        setEditingPlayer(null);
        setPlayerToDelete(null);
    }, [view]);

    // Clear all master players
    const handleClearAllMasterPlayers = async () => {
        setClearingMasterData(true);
        try {
            const response = await fetch('/api/master-players/bulk-delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirm: clearConfirmText }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to clear master players');
            }

            alert(`Successfully cleared ${data.deletedMasterPlayers} master player(s) and their ${data.deletedTournamentInstances} tournament instance(s)`);
            setShowClearPlayersConfirm(false);
            setClearConfirmText('');
            setRefreshTrigger(prev => prev + 1);
        } catch (error: any) {
            alert(`Failed to clear master players: ${error.message}`);
        } finally {
            setClearingMasterData(false);
        }
    };

    // Clear all master teams
    const handleClearAllMasterTeams = async () => {
        setClearingMasterData(true);
        try {
            const response = await fetch('/api/master-teams/bulk-delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirm: clearConfirmText }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to clear master teams');
            }

            alert(`Successfully cleared ${data.deletedMasterTeams} master team(s) and their ${data.deletedTournamentInstances} tournament instance(s)`);
            setShowClearTeamsConfirm(false);
            setClearConfirmText('');
            setRefreshTrigger(prev => prev + 1);
        } catch (error: any) {
            alert(`Failed to clear master teams: ${error.message}`);
        } finally {
            setClearingMasterData(false);
        }
    };

    if (!tournaments) {
        return <div className="text-center p-8">No tournament data available.</div>;
    }

    const renderView = () => {
        switch (view) {
            case 'tournaments':
                return <TournamentManagementPanel
                            tournaments={tournaments}
                            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                        />;
            case 'teams':
                return <TeamManagementPanel
                    teams={masterTeams}
                    editingTeam={editingTeam}
                    setEditingTeam={setEditingTeam}
                    onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                    onClearAll={() => setShowClearTeamsConfirm(true)}
                />;
            case 'players':
                return <PlayersSection
                            players={masterPlayers}
                            onAddPlayer={() => setAddPlayerModalOpen(true)}
                            onEditPlayer={setEditingPlayer}
                            onDeletePlayer={setPlayerToDelete}
                            onClearAll={() => setShowClearPlayersConfirm(true)}
                        />;
            default:
                return <div className="text-center p-8 text-neutral-500">This section is under construction.</div>;
        }
    }

    return (
        <div className="animate-fade-in" key={view}>
            {renderView()}

            <Modal isOpen={isAddPlayerModalOpen} onClose={() => setAddPlayerModalOpen(false)} title="Add New Player">
                <PlayerForm
                    onSave={async (playerData) => {
                        try {
                            const response = await fetch('/api/master-players', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(playerData),
                            });
                            if (response.ok) {
                                setRefreshTrigger(prev => prev + 1);
                                setAddPlayerModalOpen(false);
                            }
                        } catch (error) {
                            console.error('Failed to add player:', error);
                        }
                    }}
                    onClose={() => setAddPlayerModalOpen(false)}
                />
            </Modal>

            <Modal isOpen={!!editingPlayer} onClose={() => setEditingPlayer(null)} title="Edit Player">
                {editingPlayer && (
                    <PlayerForm
                        playerToEdit={editingPlayer}
                        onSave={async (playerData) => {
                            try {
                                const response = await fetch(`/api/master-players/${editingPlayer._id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(playerData),
                                });
                                if (response.ok) {
                                    setRefreshTrigger(prev => prev + 1);
                                    setEditingPlayer(null);
                                }
                            } catch (error) {
                                console.error('Failed to update player:', error);
                            }
                        }}
                        onClose={() => setEditingPlayer(null)}
                    />
                )}
            </Modal>

            <Modal isOpen={!!playerToDelete} onClose={() => setPlayerToDelete(null)} title="Confirm Deletion">
                {playerToDelete && (
                     <div>
                        <p className="text-neutral-300">Are you sure you want to permanently delete <strong className="text-white">{playerToDelete.name}</strong>? This action cannot be undone.</p>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setPlayerToDelete(null)} className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">Cancel</button>
                            <button onClick={async () => {
                                try {
                                    const response = await fetch(`/api/master-players/${playerToDelete._id}`, {
                                        method: 'DELETE',
                                    });
                                    if (response.ok) {
                                        setRefreshTrigger(prev => prev + 1);
                                        setPlayerToDelete(null);
                                    }
                                } catch (error) {
                                    console.error('Failed to delete player:', error);
                                }
                            }} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">Delete</button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={showClearPlayersConfirm} onClose={() => { setShowClearPlayersConfirm(false); setClearConfirmText(''); }} title="Clear All Master Players" size="sm">
                <div className="space-y-4">
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                        <p className="text-red-200 font-semibold mb-2">Warning: This action affects multiple tournaments</p>
                        <p className="text-red-100 text-sm">This will delete all {masterPlayers.length} master players and remove them from all tournaments. This action cannot be undone.</p>
                    </div>
                    <p className="text-neutral-300 text-sm">To proceed, type <strong>DELETE ALL MASTER PLAYERS</strong> in the field below:</p>
                    <input
                        type="text"
                        value={clearConfirmText}
                        onChange={(e) => setClearConfirmText(e.target.value)}
                        placeholder="Type confirmation text"
                        className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-white placeholder-neutral-400 focus:outline-none focus:border-red-500"
                    />
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={() => { setShowClearPlayersConfirm(false); setClearConfirmText(''); }}
                            className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleClearAllMasterPlayers}
                            disabled={clearingMasterData || clearConfirmText !== 'DELETE ALL MASTER PLAYERS'}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            {clearingMasterData ? 'Clearing...' : 'Clear All Players'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showClearTeamsConfirm} onClose={() => { setShowClearTeamsConfirm(false); setClearConfirmText(''); }} title="Clear All Master Teams" size="sm">
                <div className="space-y-4">
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                        <p className="text-red-200 font-semibold mb-2">Warning: This action affects multiple tournaments</p>
                        <p className="text-red-100 text-sm">This will delete all {masterTeams.length} master teams and remove them from all tournaments. This action cannot be undone.</p>
                    </div>
                    <p className="text-neutral-300 text-sm">To proceed, type <strong>DELETE ALL MASTER TEAMS</strong> in the field below:</p>
                    <input
                        type="text"
                        value={clearConfirmText}
                        onChange={(e) => setClearConfirmText(e.target.value)}
                        placeholder="Type confirmation text"
                        className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-white placeholder-neutral-400 focus:outline-none focus:border-red-500"
                    />
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={() => { setShowClearTeamsConfirm(false); setClearConfirmText(''); }}
                            className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleClearAllMasterTeams}
                            disabled={clearingMasterData || clearConfirmText !== 'DELETE ALL MASTER TEAMS'}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            {clearingMasterData ? 'Clearing...' : 'Clear All Teams'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const SectionHeader: React.FC<{ title: string; subtitle: string; children?: React.ReactNode; }> = ({ title, subtitle, children }) => (
    <div className="flex justify-between items-center mb-4 pb-2 border-b border-neutral-700">
        <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-sm text-neutral-400">{subtitle}</p>
        </div>
        {children}
    </div>
);


const TournamentManagementPanel: React.FC<{
    tournaments: Tournament[];
    onRefresh: () => void;
}> = ({ tournaments, onRefresh }) => {
    const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

    const handleEdit = (tournament: Tournament) => {
        setEditingTournament(tournament);
    };

    const handleDelete = (tournament: Tournament) => {
        setTournamentToDelete(tournament);
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
                <CreateTournamentForm
                    key={editingTournament?._id || 'new'}
                    onSave={async (data) => {
                        try {
                            if (editingTournament) {
                                const response = await fetch(`/api/tournaments/${editingTournament._id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(data),
                                });
                                if (response.ok) {
                                    onRefresh();
                                    setEditingTournament(null);
                                }
                            } else {
                                const response = await fetch('/api/tournaments', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(data),
                                });
                                if (response.ok) {
                                    onRefresh();
                                }
                            }
                        } catch (error) {
                            console.error('Failed to save tournament:', error);
                        }
                    }}
                    tournamentToEdit={editingTournament}
                    onCancelEdit={() => setEditingTournament(null)}
                />
            </div>
            <div className="lg:col-span-3">
                <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                    <h3 className="text-xl font-bold mb-1">Existing Tournaments</h3>
                    <div className="bg-blue-900/50 text-blue-200 border border-blue-700 rounded-md p-3 text-sm mb-4">
                        <strong>Note:</strong> To add players/teams to tournaments, go to <strong className="text-white">Auction → Auction Setup</strong>
                    </div>
                    <ul className="space-y-3">
                        {tournaments.map(t => (
                            <li key={t._id} className="bg-neutral-900/50 p-3 rounded-lg flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={t.logoURL ? imageOptimizers.teamThumbnail(t.logoURL) : `https://placehold.co/64x64/4B5563/FFFFFF/png?text=${t.name.charAt(0)}`}
                                        alt={`${t.name} logo`}
                                        className="w-12 h-12 rounded-md object-cover bg-neutral-700"
                                        loading="lazy"
                                    />
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-bold text-lg">{t.name}</h4>
                                            {getStatusBadge(t.status)}
                                        </div>
                                        <p className="text-sm text-neutral-400">
                                            Budget: {t.budgetPerTeam.toLocaleString()} | Squad Size: {t.squadSize} | Base Price: {t.basePricePerPlayer.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={() => handleEdit(t)} className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">Edit</button>
                                    <button onClick={() => handleDelete(t)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
            <Modal isOpen={!!tournamentToDelete} onClose={() => setTournamentToDelete(null)} title="Confirm Deletion">
                {tournamentToDelete && (
                     <div>
                        <p className="text-neutral-300">Are you sure you want to permanently delete <strong className="text-white">{tournamentToDelete.name}</strong>? This action cannot be undone.</p>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setTournamentToDelete(null)} className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">Cancel</button>
                            <button onClick={async () => {
                                try {
                                    const response = await fetch(`/api/tournaments/${tournamentToDelete._id}`, {
                                        method: 'DELETE',
                                    });
                                    if (response.ok) {
                                        onRefresh();
                                        setTournamentToDelete(null);
                                    }
                                } catch (error) {
                                    console.error('Failed to delete tournament:', error);
                                }
                            }} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">Delete</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
        case 'Completed':
            return (
                <span className="flex items-center gap-1.5 text-xs font-medium bg-purple-600/30 text-purple-300 border border-purple-500 px-2 py-0.5 rounded-full">
                    <CheckCircleIcon className="h-3.5 w-3.5" /> Completed
                </span>
            );
        case 'Draft':
            return (
                <span className="flex items-center gap-1.5 text-xs font-medium bg-neutral-600/50 text-neutral-300 border border-neutral-500 px-2 py-0.5 rounded-full">
                    <DocumentTextIcon className="h-3.5 w-3.5" /> Draft
                </span>
            );
        default:
            return <span className="text-xs font-medium bg-yellow-600/50 text-yellow-300 px-2 py-0.5 rounded-full">{status}</span>;
    }
};

const CreateTournamentForm: React.FC<{
    onSave: (data: Omit<Tournament, '_id' | 'status'>) => void;
    tournamentToEdit?: Tournament | null;
    onCancelEdit?: () => void;
}> = ({ onSave, tournamentToEdit, onCancelEdit }) => {
    const isEditing = !!tournamentToEdit;
    const [name, setName] = useState(tournamentToEdit?.name || '');
    const [budget, setBudget] = useState(tournamentToEdit?.budgetPerTeam.toString() || '');
    const [squadSize, setSquadSize] = useState(tournamentToEdit?.squadSize.toString() || '');
    const [basePrice, setBasePrice] = useState(tournamentToEdit?.basePricePerPlayer.toString() || '');
    const [logoURL, setLogoURL] = useState(tournamentToEdit?.logoURL || '');
    const [usePlayerClasses, setUsePlayerClasses] = useState(tournamentToEdit?.usePlayerClasses || false);
    const [playerClasses, setPlayerClasses] = useState<PlayerClassConfig[]>(
        tournamentToEdit?.playerClasses || []
    );
    const [basePriceStrategy, setBasePriceStrategy] = useState<BasePriceStrategy>(
        tournamentToEdit?.basePriceStrategy || 'tournament-level'
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate player classes if enabled
        if (usePlayerClasses && playerClasses.length > 0) {
            // Check for empty codes
            const hasEmptyCode = playerClasses.some(cls => !cls.code || cls.code.trim() === '');
            if (hasEmptyCode) {
                alert('Error: All player classes must have a code. Please fill in all code fields.');
                return;
            }

            // Check for duplicate codes
            const codes = playerClasses.map(cls => cls.code.toUpperCase());
            const hasDuplicates = codes.some((code, index) => codes.indexOf(code) !== index);
            if (hasDuplicates) {
                alert('Error: Duplicate player class codes detected. Each class must have a unique code.');
                return;
            }
        }

        onSave({
            name,
            budgetPerTeam: parseInt(budget, 10),
            squadSize: parseInt(squadSize, 10),
            basePricePerPlayer: parseInt(basePrice, 10),
            logoURL,
            usePlayerClasses,
            playerClasses: usePlayerClasses ? playerClasses : [],
            basePriceStrategy,
            year: parseInt(name.split(' ').pop() || new Date().getFullYear().toString(), 10) || new Date().getFullYear()
        });
        if (!isEditing) {
           setName(''); setBudget(''); setSquadSize(''); setBasePrice(''); setLogoURL('');
           setUsePlayerClasses(false); setPlayerClasses([]); setBasePriceStrategy('tournament-level');
        }
    }

    return (
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <h3 className="text-xl font-bold mb-4">{isEditing ? 'Edit Tournament' : 'Create New Tournament'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput id="name" label="Tournament Name" value={name} onChange={setName} required />
                <FormInput id="budget" label="Budget Per Team" value={budget} onChange={setBudget} placeholder="e.g., 1,000,000" type="number" required />
                <FormInput id="squadSize" label="Squad Size" value={squadSize} onChange={setSquadSize} placeholder="e.g., 11" type="number" required />
                <FormInput id="basePrice" label="Base Price Per Player" value={basePrice} onChange={setBasePrice} placeholder="e.g., 50,000" type="number" required />
                <ImageUpload
                    value={logoURL}
                    onChange={setLogoURL}
                    folder="tournaments"
                    label="Tournament Logo"
                    placeholder="Logo URL (optional)"
                    previewClassName="w-16 h-16"
                    previewShape="square"
                    id="tournament-logo"
                />

                {/* Player Classes Section */}
                <div className="border-t border-neutral-700 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={usePlayerClasses}
                                onChange={(e) => setUsePlayerClasses(e.target.checked)}
                                className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-brand-primary focus:ring-brand-primary"
                            />
                            <span className="text-sm font-medium text-neutral-300">Enable Player Classes</span>
                        </label>
                        {usePlayerClasses && playerClasses.length === 0 && (
                            <button
                                type="button"
                                onClick={() => setPlayerClasses(getDefaultClasses())}
                                className="text-xs bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1 rounded transition-colors"
                            >
                                Load Defaults
                            </button>
                        )}
                    </div>

                    {usePlayerClasses && (
                        <div className="space-y-3 bg-neutral-700/50 p-4 rounded-lg">
                            <p className="text-xs text-neutral-400 mb-2">Configure player classes for this tournament:</p>
                            {playerClasses.map((cls, index) => {
                                // Check for duplicate codes
                                const isDuplicateCode = playerClasses.some((c, i) =>
                                    i !== index && c.code && cls.code && c.code.toUpperCase() === cls.code.toUpperCase()
                                );
                                const isCodeEmpty = !cls.code || cls.code.trim() === '';

                                return (
                                    <div key={index} className="flex items-start gap-2 bg-neutral-800 p-3 rounded border border-neutral-600">
                                        <div className="flex-1 space-y-2">
                                            {/* First Row: Code and Name */}
                                            <div className="grid grid-cols-[120px_1fr] gap-2">
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Code *"
                                                        value={cls.code || ''}
                                                        onChange={(e) => {
                                                            const updated = [...playerClasses];
                                                            updated[index].code = e.target.value.toUpperCase();
                                                            setPlayerClasses(updated);
                                                        }}
                                                        className={`w-full bg-neutral-700 border rounded p-2 text-sm font-mono ${
                                                            isCodeEmpty || isDuplicateCode
                                                                ? 'border-red-500 focus:border-red-400'
                                                                : 'border-neutral-600 focus:border-blue-500'
                                                        }`}
                                                        maxLength={10}
                                                        required
                                                    />
                                                    {(isCodeEmpty || isDuplicateCode) && (
                                                        <p className="text-xs text-red-400 mt-1">
                                                            {isCodeEmpty ? 'Required' : 'Duplicate code'}
                                                        </p>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Class Name *"
                                                    value={cls.name}
                                                    onChange={(e) => {
                                                        const updated = [...playerClasses];
                                                        updated[index].name = e.target.value;
                                                        setPlayerClasses(updated);
                                                    }}
                                                    className="bg-neutral-700 border-neutral-600 rounded p-2 text-sm"
                                                    required
                                                />
                                            </div>
                                            {/* Second Row: Base Price, Color, Icon */}
                                            <div className="grid grid-cols-[1fr_auto_100px] gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Base Price (optional)"
                                                    value={cls.basePrice || ''}
                                                    onChange={(e) => {
                                                        const updated = [...playerClasses];
                                                        updated[index].basePrice = e.target.value ? parseInt(e.target.value) : undefined;
                                                        setPlayerClasses(updated);
                                                    }}
                                                    className="bg-neutral-700 border-neutral-600 rounded p-2 text-sm"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={cls.color}
                                                        onChange={(e) => {
                                                            const updated = [...playerClasses];
                                                            updated[index].color = e.target.value;
                                                            setPlayerClasses(updated);
                                                        }}
                                                        className="w-10 h-8 rounded cursor-pointer"
                                                        title="Color"
                                                    />
                                                    <span className="text-xs text-neutral-400">Color</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Icon"
                                                    value={cls.icon || ''}
                                                    onChange={(e) => {
                                                        const updated = [...playerClasses];
                                                        updated[index].icon = e.target.value;
                                                        setPlayerClasses(updated);
                                                    }}
                                                    className="bg-neutral-700 border-neutral-600 rounded p-2 text-sm"
                                                    maxLength={2}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPlayerClasses(playerClasses.filter((_, i) => i !== index))}
                                            className="text-red-400 hover:text-red-300 p-2"
                                            title="Remove class"
                                        >
                                            ×
                                        </button>
                                    </div>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => {
                                    setPlayerClasses([
                                        ...playerClasses,
                                        { code: '', name: '', color: '#3B82F6', order: playerClasses.length + 1 }
                                    ]);
                                }}
                                className="w-full text-sm bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded transition-colors"
                            >
                                + Add Class
                            </button>
                        </div>
                    )}
                </div>

                {/* Base Price Strategy Selection - Only show when Player Classes enabled */}
                {usePlayerClasses && playerClasses.length > 0 && (
                    <div className="border-t border-neutral-700 pt-4">
                        <label className="block text-sm font-medium text-neutral-300 mb-3">
                            Base Price Strategy
                        </label>
                        <div className="space-y-2 bg-neutral-700/50 p-4 rounded-lg">
                            <label className="flex items-start gap-3 cursor-pointer p-3 rounded border border-neutral-600 hover:bg-neutral-700/50 transition-colors">
                                <input
                                    type="radio"
                                    name="basePriceStrategy"
                                    value="tournament-level"
                                    checked={basePriceStrategy === 'tournament-level'}
                                    onChange={(e) => setBasePriceStrategy(e.target.value as BasePriceStrategy)}
                                    className="mt-1 w-4 h-4 text-brand-primary focus:ring-brand-primary"
                                />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-white">Tournament Level Base Price</span>
                                    <p className="text-xs text-neutral-400 mt-1">
                                        All players use the same base price ({parseInt(basePrice || '0').toLocaleString()}) regardless of their class.
                                        Player classes are only used for visual categorization.
                                    </p>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer p-3 rounded border border-neutral-600 hover:bg-neutral-700/50 transition-colors">
                                <input
                                    type="radio"
                                    name="basePriceStrategy"
                                    value="player-class-based"
                                    checked={basePriceStrategy === 'player-class-based'}
                                    onChange={(e) => setBasePriceStrategy(e.target.value as BasePriceStrategy)}
                                    className="mt-1 w-4 h-4 text-brand-primary focus:ring-brand-primary"
                                />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-white">Player Class Based Pricing</span>
                                    <p className="text-xs text-neutral-400 mt-1">
                                        Each player class has its own base price. Tournament base price ({parseInt(basePrice || '0').toLocaleString()})
                                        is used as fallback for classes without a specific price.
                                    </p>
                                    {basePriceStrategy === 'player-class-based' && (
                                        <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-200">
                                            <strong>Important:</strong> Ensure all player classes above have base prices defined for this strategy to work effectively.
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                <div className="border-t border-neutral-700 pt-4 flex justify-end gap-3">
                    {isEditing && <button type="button" onClick={onCancelEdit} className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>}
                    <button type="submit" className="bg-brand-primary hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        {isEditing ? 'Save Changes' : 'Create Tournament'}
                    </button>
                </div>
            </form>
        </div>
    );
}

const FormInput: React.FC<{id: string, label: string, value: string, onChange: (val: string) => void, placeholder?: string, type?: string, required?: boolean}> = 
({id, label, value, onChange, placeholder, type="text", required=false}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-neutral-300 mb-1">{label}</label>
        <input 
            type={type} 
            id={id} 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder} 
            required={required} 
            className="w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary p-2"
        />
    </div>
);


const TeamManagementPanel: React.FC<{
    teams: MasterTeam[];
    editingTeam: MasterTeam | null;
    setEditingTeam: (team: MasterTeam | null) => void;
    onRefresh: () => void;
    onClearAll?: () => void;
}> = ({ teams, editingTeam, setEditingTeam, onRefresh, onClearAll }) => {
    const [teamToDelete, setTeamToDelete] = useState<MasterTeam | null>(null);

    const handleConfirmDelete = async () => {
        if (teamToDelete) {
            try {
                const response = await fetch(`/api/master-teams/${teamToDelete._id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    onRefresh();
                    setTeamToDelete(null);
                }
            } catch (error) {
                console.error('Failed to delete team:', error);
            }
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
                <TeamCreationForm
                    key={editingTeam?._id ?? 'new'}
                    editingTeam={editingTeam}
                    onSave={async (data) => {
                        try {
                            if (editingTeam) {
                                const response = await fetch(`/api/master-teams/${editingTeam._id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(data),
                                });
                                if (response.ok) {
                                    onRefresh();
                                    setEditingTeam(null);
                                }
                            } else {
                                const response = await fetch('/api/master-teams', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(data),
                                });
                                if (response.ok) {
                                    onRefresh();
                                }
                            }
                        } catch (error) {
                            console.error('Failed to save team:', error);
                        }
                    }}
                    onCancel={() => setEditingTeam(null)}
                />
            </div>
            <div className="lg:col-span-3">
                <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Master Team List</h3>
                        <button
                            onClick={onClearAll}
                            disabled={teams.length === 0}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                    <ul className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
                        {teams.map(team => (
                             <li key={team._id} className="bg-neutral-900/50 p-3 rounded-lg flex items-center justify-between gap-4 hover:bg-neutral-700/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={imageOptimizers.teamThumbnail(team.logoURL)}
                                        alt={`${team.name} logo`}
                                        className="w-12 h-12 rounded-md object-cover bg-neutral-700"
                                        loading="lazy"
                                    />
                                    <div>
                                        <h4 className="font-bold text-lg">{team.name}</h4>
                                        <p className="text-sm text-neutral-400">Owner: {team.ownerName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={() => setEditingTeam(team)} className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">Edit</button>
                                    <button onClick={() => setTeamToDelete(team)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <Modal isOpen={!!teamToDelete} onClose={() => setTeamToDelete(null)} title="Confirm Deletion">
                 {teamToDelete && (
                     <div>
                        <p className="text-neutral-300">Are you sure you want to permanently delete <strong className="text-white">{teamToDelete.name}</strong>? This action cannot be undone.</p>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setTeamToDelete(null)} className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">Cancel</button>
                            <button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">Delete</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};


const TeamCreationForm: React.FC<{
    editingTeam: MasterTeam | null;
    onSave: (data: Partial<Omit<MasterTeam, '_id'>>) => void;
    onCancel: () => void;
}> = ({ editingTeam, onSave, onCancel }) => {
    const isEditing = !!editingTeam;
    const [name, setName] = useState('');
    const [shortCode, setShortCode] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [logoURL, setLogoURL] = useState('');

    useEffect(() => {
        setName(editingTeam?.name || '');
        setShortCode(editingTeam?.shortCode || '');
        setOwnerName(editingTeam?.ownerName || '');
        setLogoURL(editingTeam?.logoURL || '');
    }, [editingTeam]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, shortCode, ownerName, logoURL });
        if (!isEditing) {
            setName('');
            setShortCode('');
            setOwnerName('');
            setLogoURL('');
        }
    };
    
    return (
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
             <h3 className="text-xl font-bold mb-4">{isEditing ? `Edit ${editingTeam.name}` : 'Add New Team (Global)'}</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <FormInput id="teamName" label="Team Name" value={name} onChange={setName} required />
                 <FormInput id="shortCode" label="Short Code (e.g., MI)" value={shortCode} onChange={setShortCode} required />
                 <FormInput id="ownerName" label="Owner Name" value={ownerName} onChange={setOwnerName} required />
                 
                 <ImageUpload
                    value={logoURL}
                    onChange={setLogoURL}
                    folder="teams"
                    label="Team Logo"
                    placeholder="Logo URL (optional)"
                    previewClassName="w-16 h-16"
                    previewShape="square"
                    id="logo-file"
                 />
                                  
                 <div className="border-t border-neutral-700 pt-4 flex justify-end gap-3">
                    {isEditing && <button type="button" onClick={onCancel} className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>}
                    <button type="submit" className="bg-brand-primary hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        {isEditing ? 'Save Changes' : 'Create Team'}
                    </button>
                </div>
             </form>
        </div>
    );
};

const PlayersSection: React.FC<{ players: MasterPlayer[]; onAddPlayer: () => void; onEditPlayer: (player: MasterPlayer) => void; onDeletePlayer: (player: MasterPlayer) => void; onClearAll: () => void; }> = ({ players, onAddPlayer, onEditPlayer, onDeletePlayer, onClearAll }) => {
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [downloading, setDownloading] = useState(false);

    const handleDownloadMasterPlayers = async () => {
        setDownloading(true);
        try {
            const response = await fetch('/api/master-players/export');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `master_players_export_${Date.now()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            alert(`Download failed: ${error.message}`);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <section>
            <SectionHeader title="Players" subtitle="Eligible players for the auction.">
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowBulkUpload(!showBulkUpload)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Bulk Upload
                    </button>
                    <button onClick={onAddPlayer} className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                        <PlusIcon className="h-5 w-5" />
                        Add Player
                    </button>
                    <button
                        onClick={handleDownloadMasterPlayers}
                        disabled={players.length === 0 || downloading}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {downloading ? 'Downloading...' : 'Download List'}
                    </button>
                    <button
                        onClick={onClearAll}
                        disabled={players.length === 0}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        Clear All
                    </button>
                </div>
            </SectionHeader>

            {showBulkUpload && (
                <div className="mb-6 animate-fade-in">
                    <BulkPlayerUpload
                        onSuccess={() => {
                            setRefreshKey(prev => prev + 1);
                            window.location.reload();
                        }}
                    />
                </div>
            )}

            <div className="bg-neutral-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-700/50">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-neutral-300">#</th>
                                <th className="p-4 text-sm font-semibold text-neutral-300">Player ID</th>
                                <th className="p-4 text-sm font-semibold text-neutral-300">Player</th>
                                <th className="p-4 text-sm font-semibold text-neutral-300">Position</th>
                                <th className="p-4 text-sm font-semibold text-neutral-300">Current Club</th>
                                <th className="p-4 text-sm font-semibold text-neutral-300">Matches</th>
                                <th className="p-4 text-sm font-semibold text-neutral-300">Score</th>
                                <th className="p-4 text-sm font-semibold text-neutral-300">Wickets</th>
                                <th className="p-4 text-sm font-semibold text-neutral-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((player, idx) => (
                                <tr key={player._id} className={`border-t border-neutral-700 ${idx % 2 === 0 ? 'bg-neutral-800' : 'bg-neutral-800/50'}`}>
                                    <td className="p-4 text-neutral-400 text-sm font-medium w-12">{idx + 1}</td>
                                    <td className="p-4 text-neutral-400 text-xs font-mono">{player._id}</td>
                                    <td className="p-4 flex items-center gap-4">
                                        <img
                                            src={imageOptimizers.playerThumbnail(player.photoURL)}
                                            alt={player.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                            loading="lazy"
                                        />
                                        <span className="font-medium">{player.name}</span>
                                    </td>
                                    <td className="p-4 text-neutral-300">{player.position}</td>
                                    <td className="p-4 text-neutral-300">{player.currentClub}</td>
                                    <td className="p-4 text-neutral-300">{player.careerStats?.matchesPlayed || 0}</td>
                                    <td className="p-4 text-neutral-300">{player.careerStats?.totalScore.toLocaleString() || 0}</td>
                                    <td className="p-4 text-neutral-300">{player.careerStats?.totalWickets || 0}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => onEditPlayer(player)} className="p-2 text-neutral-400 hover:text-brand-primary"><EditIcon className="h-5 w-5"/></button>
                                        <button onClick={() => onDeletePlayer(player)} className="p-2 text-neutral-400 hover:text-red-500"><DeleteIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

interface PlayerFormProps {
    onSave: (player: Omit<MasterPlayer, '_id'>) => void;
    onClose: () => void;
    playerToEdit?: MasterPlayer;
}

// Standard player positions
const PLAYER_POSITIONS = [
    'Batsman',
    'Bowler',
    'All-rounder',
    'Wicket-keeper'
];

const PlayerForm: React.FC<PlayerFormProps> = ({ onSave, playerToEdit }) => {
    const isEditing = !!playerToEdit;
    const [name, setName] = useState(playerToEdit?.name || '');
    const [position, setPosition] = useState(playerToEdit?.position || '');
    const [currentClub, setCurrentClub] = useState(playerToEdit?.currentClub || '');
    const [photoURL, setPhotoURL] = useState(playerToEdit?.photoURL || '');
    const [careerStats, setCareerStats] = useState<PlayerStats>(playerToEdit?.careerStats || { matchesPlayed: 0, totalScore: 0, totalWickets: 0 });
    const [suggestedClass, setSuggestedClass] = useState(playerToEdit?.suggestedClass || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && position && currentClub) {
            onSave({
                name,
                position,
                currentClub,
                photoURL: photoURL || `https://placehold.co/200x200/4B5563/FFFFFF/png?text=${name.charAt(0)}`,
                careerStats,
                suggestedClass: suggestedClass || undefined
            });
        }
    };

    const handleStatChange = (field: keyof PlayerStats, value: string) => {
        setCareerStats(prev => ({
            ...prev,
            [field]: parseInt(value, 10) || 0
        }));
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-300">Player Name</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary p-2" />
            </div>

            <div>
                <label htmlFor="position" className="block text-sm font-medium text-neutral-300">Position</label>
                <select
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                    className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary p-2"
                >
                    <option value="">Select Position</option>
                    {PLAYER_POSITIONS.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="currentClub" className="block text-sm font-medium text-neutral-300">Current Club</label>
                <input type="text" id="currentClub" value={currentClub} onChange={(e) => setCurrentClub(e.target.value)} placeholder="e.g., Mumbai Indians, CSK" required className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary p-2" />
            </div>

            <div>
                <label htmlFor="suggestedClass" className="block text-sm font-medium text-neutral-300">Suggested Class (Optional)</label>
                <select
                    id="suggestedClass"
                    value={suggestedClass}
                    onChange={(e) => setSuggestedClass(e.target.value)}
                    className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary p-2"
                >
                    <option value="">None</option>
                    {getDefaultClasses().map(cls => (
                        <option key={cls.name} value={cls.name}>
                            {cls.icon} {cls.name}
                        </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-neutral-400">Default class when adding player to tournaments</p>
            </div>

            <div className="bg-neutral-700/50 p-3 rounded-md space-y-3 animate-fade-in">
                 <h4 className="font-semibold text-neutral-200 mb-2 border-b border-neutral-600 pb-2">Career Stats</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="matchesPlayed" className="block text-sm font-medium text-neutral-300">Matches Played</label>
                        <input type="number" id="matchesPlayed" value={careerStats.matchesPlayed} onChange={(e) => handleStatChange('matchesPlayed', e.target.value)} required className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary p-2" />
                     </div>
                     <div>
                        <label htmlFor="totalScore" className="block text-sm font-medium text-neutral-300">Total Score</label>
                        <input type="number" id="totalScore" value={careerStats.totalScore} onChange={(e) => handleStatChange('totalScore', e.target.value)} required className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary p-2" />
                     </div>
                     <div>
                        <label htmlFor="totalWickets" className="block text-sm font-medium text-neutral-300">Total Wickets</label>
                        <input type="number" id="totalWickets" value={careerStats.totalWickets} onChange={(e) => handleStatChange('totalWickets', e.target.value)} required className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary p-2" />
                     </div>
                 </div>
            </div>
            <ImageUpload
                value={photoURL}
                onChange={setPhotoURL}
                folder="players"
                label="Player Profile Photo"
                placeholder="Photo URL (optional)"
                previewClassName="w-16 h-16"
                previewShape="circle"
                id="player-image-file-mgmt"
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

export default ManagementDashboard;
