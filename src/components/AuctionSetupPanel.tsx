'use client';

import React, { useState } from 'react';
import { useAuction } from '@/hooks/useAuction';
import { Player, Team, Tournament, PlayerStats } from '@/types';
import Modal from './Modal';
import { PlusIcon, DeleteIcon, EditIcon } from './icons';


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
    const [stats, setStats] = useState<PlayerStats>(playerToEdit?.stats || { matchesPlayed: 0, totalScore: 0, totalWickets: 0 });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageURL(reader.result as string);
            };
            reader.readAsDataURL(file);
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
                            <label htmlFor="player-image-file-setup" className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-colors">
                                Choose File
                            </label>
                            <input type="file" id="player-image-file-setup" className="hidden" onChange={handleFileChange} accept="image/*" />
                            <span className="text-sm text-neutral-400 truncate ml-2">{imageFile?.name ?? 'No file chosen'}</span>
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
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoURL(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, ownerName, logoURL });
        setName('');
        setOwnerName('');
        setLogoURL('');
        setLogoFile(null);
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
            <div>
                 <label className="block text-sm font-medium text-neutral-300 mb-1">Team Logo</label>
                <div className="flex items-center justify-between bg-neutral-700 border-neutral-600 rounded-md p-2">
                    <label htmlFor="logo-file-auction-setup" className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-colors">Choose File</label>
                    <input type="file" id="logo-file-auction-setup" className="hidden" onChange={handleFileChange} accept="image/*" />
                    <span className="text-sm text-neutral-400 truncate ml-2">{logoFile?.name ?? 'No file chosen'}</span>
                </div>
                <p className="text-center text-xs text-neutral-500 my-1">or enter a URL below</p>
                <input type="text" id="logoURL" value={logoURL} onChange={(e) => setLogoURL(e.target.value)} placeholder="Logo URL (optional)" className="mt-1 block w-full bg-neutral-700 border-neutral-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
            </div>
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
    const { tournament, teams, players, setTournamentStatus, addPlayer, deletePlayer, addTeam, deleteTeam } = useAuction();

    const [isAddPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
    const [isAddTeamModalOpen, setAddTeamModalOpen] = useState(false);

    if (!tournament) {
        return <div className="text-center p-8 text-neutral-400">Loading tournament data...</div>;
    }

    const totalPlayers = players.length;
    const totalTeams = teams.length;
    const soldPlayersCount = players.filter(p => p.isSold).length;
    const availablePlayersCount = totalPlayers - soldPlayersCount;

    const isAuctionLive = tournament.status === 'Live';
    const isAuctionCompleted = tournament.status === 'Completed';

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold">Auction Setup</h1>
                <p className="text-neutral-400 mt-1">Manage tournament rosters - add or remove players and teams</p>
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <label className="text-sm text-neutral-400">Select Tournament</label>
                        <div className="flex items-center gap-4 p-2 border border-neutral-600 rounded-md bg-neutral-900/50 mt-1">
                             <p className="text-lg font-semibold">{tournament.name} - Budget: {tournament.budgetPerTeam.toLocaleString()} | Squad: 5</p>
                             <svg className="w-5 h-5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        </div>
                    </div>
                    {isAuctionCompleted && (
                        <div className="bg-purple-600/50 text-purple-200 border border-purple-500 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2">
                             <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.06 0l4.001-5.5z" clipRule="evenodd" /></svg>
                            Completed
                        </div>
                    )}
                </div>

                <div className="bg-neutral-900/40 p-3 rounded-md text-xs text-neutral-400 font-mono space-y-1">
                    <p>Status: <span className="text-yellow-300">{tournament.status.toUpperCase()}</span></p>
                    <p>isAuctionActive: <span className={isAuctionLive ? 'text-green-400' : 'text-red-400'}>{isAuctionLive.toString()}</span></p>
                    <p>Show Complete Button: <span className="text-red-400">false</span></p>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-700 pt-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setTournamentStatus('Live')} disabled={isAuctionLive || isAuctionCompleted} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed">Start Auction</button>
                        <button onClick={() => setTournamentStatus('Completed')} className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">Archive Tournament</button>
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
                        {players.map(player => (
                            <li key={player._id} className="bg-neutral-900/50 p-3 rounded-md flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={player.imageURL} alt={player.name} className="w-12 h-12 rounded-full object-cover"/>
                                    <div>
                                        <p className="font-semibold">{player.name}</p>
                                        <p className="text-sm text-neutral-400">Batsman</p>
                                        <p className="text-xs font-semibold text-green-400 tracking-wider">AVAILABLE</p>
                                    </div>
                                </div>
                                <button onClick={() => deletePlayer(player._id)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-lg text-sm transition-colors">Remove</button>
                            </li>
                        ))}
                    </ul>
                </div>
                 <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Registered Teams</h3>
                        <button onClick={() => setAddTeamModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-1"><PlusIcon className="h-4 w-4" /> Add Teams</button>
                    </div>
                     <ul className="space-y-3 h-96 overflow-y-auto pr-2">
                        {teams.map(team => (
                            <li key={team._id} className="bg-neutral-900/50 p-3 rounded-md flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={team.logoURL} alt={team.name} className="w-12 h-12 rounded-md object-cover"/>
                                    <div>
                                        <p className="font-semibold">{team.name}</p>
                                        <p className="text-sm text-neutral-400">Budget: {team.initialBudget.toLocaleString()}</p>
                                        <p className="text-xs text-neutral-400">Remaining: {team.currentBalance.toLocaleString()} | Players: {team.playersPurchased.length}</p>
                                    </div>
                                </div>
                                <button onClick={() => deleteTeam(team._id)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-lg text-sm transition-colors">Remove</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <Modal isOpen={isAddPlayerModalOpen} onClose={() => setAddPlayerModalOpen(false)} title="Add New Player">
                <PlayerForm
                    tournament={tournament}
                    onSave={(playerData) => {
                        addPlayer(playerData);
                        setAddPlayerModalOpen(false);
                    }}
                    onClose={() => setAddPlayerModalOpen(false)}
                />
            </Modal>

            <Modal isOpen={isAddTeamModalOpen} onClose={() => setAddTeamModalOpen(false)} title="Add New Team">
                <TeamForm
                    onSave={(teamData) => {
                        addTeam(teamData as Omit<Team, '_id' | 'tournamentId' | 'initialBudget' | 'currentBalance' | 'playersPurchased'>);
                        setAddTeamModalOpen(false);
                    }}
                />
            </Modal>
        </div>
    );
};

export default AuctionSetupPanel;
