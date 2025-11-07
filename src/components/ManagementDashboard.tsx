'use client';

import React, { useState, useEffect } from 'react';
import { useAuction } from '@/hooks/useAuction';
import { Player, Team, Tournament, PlayerStats } from '@/types';
import { PlusIcon, EditIcon, DeleteIcon, LoadingSpinner, CheckCircleIcon, DocumentTextIcon } from './icons';
import Modal from './Modal';

type ManagementView = 'tournaments' | 'teams' | 'players';

const ManagementDashboard: React.FC<{ view: ManagementView }> = ({ view }) => {
    const { tournaments, teams, players, addPlayer, updatePlayer, deletePlayer, addTournament, updateTournament, deleteTournament, addTeam, updateTeam, deleteTeam } = useAuction();
    
    const [isAddPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
    
    useEffect(() => {
        setAddPlayerModalOpen(false);
        setEditingTeam(null);
        setEditingPlayer(null);
        setPlayerToDelete(null);
    }, [view]);

    if (!tournaments) {
        return <div className="text-center p-8">No tournament data available.</div>;
    }
    
    const renderView = () => {
        switch (view) {
            case 'tournaments':
                return <TournamentManagementPanel 
                            tournaments={tournaments}
                            onAddTournament={addTournament}
                            onUpdateTournament={updateTournament}
                            onDeleteTournament={deleteTournament}
                        />;
            case 'teams':
                return <TeamManagementPanel 
                    teams={teams}
                    editingTeam={editingTeam}
                    setEditingTeam={setEditingTeam}
                    addTeam={addTeam}
                    updateTeam={updateTeam}
                    deleteTeam={deleteTeam}
                />;
            case 'players':
                return <PlayersSection 
                            players={players} 
                            onAddPlayer={() => setAddPlayerModalOpen(true)}
                            onEditPlayer={setEditingPlayer}
                            onDeletePlayer={setPlayerToDelete}
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
                    tournament={tournaments[0]} // Pass active tournament
                    onSave={(playerData) => {
                        addPlayer(playerData);
                        setAddPlayerModalOpen(false);
                    }}
                    onClose={() => setAddPlayerModalOpen(false)}
                />
            </Modal>
            
            <Modal isOpen={!!editingPlayer} onClose={() => setEditingPlayer(null)} title="Edit Player">
                {editingPlayer && (
                    <PlayerForm
                        playerToEdit={editingPlayer}
                        tournament={tournaments[0]}
                        onSave={(playerData) => {
                            updatePlayer(editingPlayer._id, playerData);
                            setEditingPlayer(null);
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
                            <button onClick={() => {
                                deletePlayer(playerToDelete._id);
                                setPlayerToDelete(null);
                            }} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">Delete</button>
                        </div>
                    </div>
                )}
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
    onAddTournament: (data: Omit<Tournament, '_id' | 'status'>) => void;
    onUpdateTournament: (id: string, data: Partial<Omit<Tournament, '_id'>>) => void;
    onDeleteTournament: (id: string) => void;
}> = ({ tournaments, onAddTournament, onUpdateTournament, onDeleteTournament }) => {
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
                    onSave={(data) => {
                         if (editingTournament) {
                            onUpdateTournament(editingTournament._id, data);
                            setEditingTournament(null);
                        } else {
                            onAddTournament(data);
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
                                    <img src={t.logoURL || `https://placehold.co/64x64/4B5563/FFFFFF/png?text=${t.name.charAt(0)}`} alt={`${t.name} logo`} className="w-12 h-12 rounded-md object-cover bg-neutral-700" />
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
                            <button onClick={() => {
                                onDeleteTournament(tournamentToDelete._id);
                                setTournamentToDelete(null);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            budgetPerTeam: parseInt(budget, 10),
            squadSize: parseInt(squadSize, 10),
            basePricePerPlayer: parseInt(basePrice, 10),
            logoURL,
            year: parseInt(name.split(' ').pop() || new Date().getFullYear().toString(), 10) || new Date().getFullYear()
        });
        if (!isEditing) {
           setName(''); setBudget(''); setSquadSize(''); setBasePrice(''); setLogoURL('');
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
                <FormInput id="logoUrl" label="Tournament Logo" value={logoURL} onChange={setLogoURL} placeholder="Logo URL (optional)" />
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
    teams: Team[];
    editingTeam: Team | null;
    setEditingTeam: (team: Team | null) => void;
    addTeam: (teamData: Omit<Team, '_id' | 'tournamentId' | 'initialBudget' | 'currentBalance' | 'playersPurchased'>) => void;
    updateTeam: (teamId: string, teamData: Partial<Omit<Team, '_id' | 'tournamentId'>>) => void;
    deleteTeam: (teamId: string) => void;
}> = ({ teams, editingTeam, setEditingTeam, addTeam, updateTeam, deleteTeam }) => {
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

    const handleConfirmDelete = () => {
        if (teamToDelete) {
            deleteTeam(teamToDelete._id);
            setTeamToDelete(null);
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
                <TeamCreationForm 
                    key={editingTeam?._id ?? 'new'}
                    editingTeam={editingTeam}
                    onSave={(data) => {
                        if (editingTeam) {
                            updateTeam(editingTeam._id, data);
                            setEditingTeam(null);
                        } else {
                            addTeam(data as any);
                        }
                    }}
                    onCancel={() => setEditingTeam(null)}
                />
            </div>
            <div className="lg:col-span-3">
                <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                    <h3 className="text-xl font-bold mb-4">Master Team List</h3>
                    <ul className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
                        {teams.map(team => (
                             <li key={team._id} className="bg-neutral-900/50 p-3 rounded-lg flex items-center justify-between gap-4 hover:bg-neutral-700/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <img src={team.logoURL} alt={`${team.name} logo`} className="w-12 h-12 rounded-md object-cover bg-neutral-700" />
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
    editingTeam: Team | null;
    onSave: (data: Partial<Omit<Team, '_id' | 'tournamentId'>>) => void;
    onCancel: () => void;
}> = ({ editingTeam, onSave, onCancel }) => {
    const isEditing = !!editingTeam;
    const [name, setName] = useState('');
    const [shortCode, setShortCode] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [logoURL, setLogoURL] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setName(editingTeam?.name || '');
        setShortCode(editingTeam?.shortCode || '');
        setOwnerName(editingTeam?.ownerName || '');
        setLogoURL(editingTeam?.logoURL || '');
        setLogoFile(null);
    }, [editingTeam]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, shortCode, ownerName, logoURL });
        if (!isEditing) {
            setName('');
            setShortCode('');
            setOwnerName('');
            setLogoURL('');
            setLogoFile(null);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setIsUploading(true);

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'prostream-auction/teams');

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    setLogoURL(data.url);
                    alert('✅ Team logo uploaded successfully to Cloudinary!');
                } else {
                    const errorData = await response.json();
                    console.error('Upload failed:', errorData);
                    alert(`❌ Upload failed: ${errorData.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert('❌ Upload error: Could not connect to upload service. Please check your internet connection.');
            } finally {
                setIsUploading(false);
            }
        }
    };
    
    return (
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
             <h3 className="text-xl font-bold mb-4">{isEditing ? `Edit ${editingTeam.name}` : 'Add New Team (Global)'}</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <FormInput id="teamName" label="Team Name" value={name} onChange={setName} required />
                 <FormInput id="shortCode" label="Short Code (e.g., MI)" value={shortCode} onChange={setShortCode} required />
                 <FormInput id="ownerName" label="Owner Name" value={ownerName} onChange={setOwnerName} required />
                 
                 <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Team Logo</label>
                    <div className="flex items-center justify-between bg-neutral-700 border-neutral-600 rounded-md p-2">
                        <label htmlFor="logo-file" className={`cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {isUploading ? 'Uploading...' : 'Choose File'}
                        </label>
                        <input type="file" id="logo-file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
                        <span className="text-sm text-neutral-400 truncate ml-2">
                            {isUploading ? 'Uploading to cloud...' : (logoFile?.name ?? 'No file chosen')}
                        </span>
                    </div>
                    <p className="text-center text-xs text-neutral-500 my-1">or enter a URL below</p>
                    <FormInput id="logoUrl" label="" value={logoURL} onChange={setLogoURL} placeholder="Logo URL (optional)" />
                 </div>
                                  
                 <div className="border-t border-neutral-700 pt-4 flex justify-end gap-3">
                    {isEditing && <button type="button" onClick={onCancel} className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>}
                    <button type="submit" disabled={isUploading} className="bg-brand-primary hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isEditing ? 'Save Changes' : 'Create Team'}
                    </button>
                </div>
             </form>
        </div>
    );
};

const PlayersSection: React.FC<{ players: Player[]; onAddPlayer: () => void; onEditPlayer: (player: Player) => void; onDeletePlayer: (player: Player) => void; }> = ({ players, onAddPlayer, onEditPlayer, onDeletePlayer }) => (
    <section>
        <SectionHeader title="Players" subtitle="Eligible players for the auction.">
             <button onClick={onAddPlayer} className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                <PlusIcon className="h-5 w-5" />
                Add Player
            </button>
        </SectionHeader>
        <div className="bg-neutral-800 rounded-lg overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-neutral-700/50">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-neutral-300">Player</th>
                            <th className="p-4 text-sm font-semibold text-neutral-300">Matches</th>
                            <th className="p-4 text-sm font-semibold text-neutral-300">Score</th>
                            <th className="p-4 text-sm font-semibold text-neutral-300">Wickets</th>
                            <th className="p-4 text-sm font-semibold text-neutral-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player, idx) => (
                            <tr key={player._id} className={`border-t border-neutral-700 ${idx % 2 === 0 ? 'bg-neutral-800' : 'bg-neutral-800/50'}`}>
                                <td className="p-4 flex items-center gap-4">
                                    <img src={player.imageURL} alt={player.name} className="w-10 h-10 rounded-full object-cover"/>
                                    <span className="font-medium">{player.name}</span>
                                </td>
                                <td className="p-4 text-neutral-300">{player.stats.matchesPlayed}</td>
                                <td className="p-4 text-neutral-300">{player.stats.totalScore.toLocaleString()}</td>
                                <td className="p-4 text-neutral-300">{player.stats.totalWickets}</td>
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

interface PlayerFormProps {
    onSave: (player: Omit<Player, '_id' | 'tournamentId' | 'isSold' | 'finalPrice' | 'winningTeamId'>) => void;
    onClose: () => void;
    tournament: Tournament | null;
    playerToEdit?: Player;
}

const PlayerForm: React.FC<PlayerFormProps> = ({ onSave, tournament, playerToEdit }) => {
    const isEditing = !!playerToEdit;
    const [name, setName] = useState(playerToEdit?.name || '');
    const [imageURL, setImageURL] = useState(playerToEdit?.imageURL || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [stats, setStats] = useState<PlayerStats>(playerToEdit?.stats || { matchesPlayed: 0, totalScore: 0, totalWickets: 0 });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setIsUploading(true);

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'prostream-auction/players');

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    setImageURL(data.url);
                } else {
                    console.error('Upload failed');
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImageURL(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                }
            } catch (error) {
                console.error('Upload error:', error);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImageURL(reader.result as string);
                };
                reader.readAsDataURL(file);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name) {
            onSave({ name, imageURL: imageURL || `https://picsum.photos/seed/${name}/200`, stats });
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
             <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Player Profile Image</label>
                <div className="flex items-center gap-4">
                    <img 
                        src={imageURL || 'https://placehold.co/100x100/374151/F3F4F6/png?text=No+Image'} 
                        alt="Player Preview" 
                        className="w-16 h-16 rounded-full object-cover bg-neutral-700"
                    />
                    <div className="flex-grow">
                        <div className="flex items-center justify-between bg-neutral-700 border-neutral-600 rounded-md p-2">
                            <label htmlFor="player-image-file-mgmt" className={`cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isUploading ? 'Uploading...' : 'Choose File'}
                            </label>
                            <input type="file" id="player-image-file-mgmt" className="hidden" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
                            <span className="text-sm text-neutral-400 truncate ml-2">
                                {isUploading ? 'Uploading to cloud...' : (imageFile?.name ?? 'No file chosen')}
                            </span>
                        </div>
                        <p className="text-center text-xs text-neutral-500 my-1">or enter a URL below</p>
                        <input 
                            type="text" 
                            id="imageURL" 
                            value={imageURL} 
                            onChange={(e) => {
                                setImageURL(e.target.value);
                                setImageFile(null);
                            }} 
                            placeholder="Image URL (optional)" 
                            className="w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary p-2 text-sm"
                        />
                    </div>
                </div>
            </div>
            <div className="pt-2 text-right">
                <button type="submit" disabled={isUploading} className="inline-flex justify-center items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isEditing ? <EditIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                    {isEditing ? 'Save Changes' : 'Add Player'}
                </button>
            </div>
        </form>
    );
};

export default ManagementDashboard;
