'use client';

import React, { useState } from 'react';
import { Tournament, Player } from '@/types';
import { getAuthHeaders } from '@/lib/api-client';
import ImageUpload from './ImageUpload';
import { PlusIcon } from './icons';
import { getSortedClasses } from '@/lib/playerClassUtils';

const PLAYER_POSITIONS = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];

interface PlayerFormProps {
    tournaments: Tournament[];
    defaultTournamentId?: string;
    editPlayer?: Player;
    onSuccess: () => void;
    onCancel: () => void;
}

const PlayerForm: React.FC<PlayerFormProps> = ({ tournaments, defaultTournamentId = '', editPlayer, onSuccess, onCancel }) => {
    const isEditMode = !!editPlayer;

    const [tournamentId, setTournamentId] = useState(editPlayer?.tournamentId ?? defaultTournamentId);
    const [name, setName] = useState(editPlayer?.name ?? '');
    const [position, setPosition] = useState(editPlayer?.position ?? '');
    const [currentClub, setCurrentClub] = useState(editPlayer?.currentClub ?? '');
    const [photoURL, setPhotoURL] = useState(editPlayer?.photoURL ?? '');
    const [playerClass, setPlayerClass] = useState(editPlayer?.playerClass ?? '');
    const [age, setAge] = useState<string>(editPlayer?.age !== undefined ? String(editPlayer.age) : '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const selectedTournament = tournaments.find(t => t._id === tournamentId);
    const useClasses = selectedTournament?.usePlayerClasses && selectedTournament.playerClasses?.length;

    const handleTournamentChange = (id: string) => {
        setTournamentId(id);
        setPlayerClass('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !position || !currentClub || !tournamentId) return;
        setSaving(true);
        setError('');
        try {
            let res: Response;
            if (isEditMode) {
                res = await fetch(`/api/players/${editPlayer._id}`, {
                    method: 'PUT',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, position, currentClub, photoURL: photoURL || undefined, playerClass: playerClass || undefined, age: age ? Number(age) : undefined }),
                });
            } else {
                res = await fetch('/api/players', {
                    method: 'POST',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, position, currentClub, photoURL: photoURL || undefined, playerClass: playerClass || undefined, age: age ? Number(age) : undefined, tournamentId }),
                });
            }
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || (isEditMode ? 'Failed to update player' : 'Failed to create player'));
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || (isEditMode ? 'Failed to update player' : 'Failed to create player'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="rounded-md p-3 text-sm" style={{ color: 'var(--status-danger)', background: 'color-mix(in oklab, var(--status-danger) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--status-danger) 40%, transparent)' }}>
                    {error}
                </div>
            )}

            {isEditMode ? (
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tournament</label>
                    <p className="rounded-md p-2 text-sm" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-tertiary)' }}>
                        {selectedTournament?.name ?? tournamentId}
                    </p>
                </div>
            ) : (
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tournament</label>
                    <select value={tournamentId} onChange={(e) => handleTournamentChange(e.target.value)} required className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                        <option value="">Select Tournament</option>
                        {tournaments.map(t => (
                            <option key={t._id} value={t._id}>{t.name} ({t.year})</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Player Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Position</label>
                <select value={position} onChange={(e) => setPosition(e.target.value)} required className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                    <option value="">Select Position</option>
                    {PLAYER_POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Current Club</label>
                <input type="text" value={currentClub} onChange={(e) => setCurrentClub(e.target.value)} required placeholder="e.g., Mumbai Indians" className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Age <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span></label>
                <input type="number" min="1" max="99" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Leave blank if not applicable" className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>

            {useClasses && selectedTournament && (
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Player Class</label>
                    <select value={playerClass} onChange={(e) => setPlayerClass(e.target.value)} required className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                        <option value="" disabled>Select a class</option>
                        {getSortedClasses(selectedTournament).map(cls => (
                            <option key={cls.name} value={cls.name} style={{ color: cls.color }}>
                                {cls.icon} {cls.name} {cls.basePrice ? `(${cls.basePrice.toLocaleString()})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <ImageUpload
                value={photoURL}
                onChange={setPhotoURL}
                folder="players"
                label="Player Photo (optional)"
                placeholder="Photo URL"
                previewClassName="w-16 h-16"
                previewShape="circle"
                id="player-photo-form"
            />

            <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="font-bold py-2 px-4 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 text-white font-bold py-2 px-4 rounded-lg transition-colors hover:opacity-80 disabled:opacity-60" style={{ backgroundColor: 'var(--brand-primary)' }}>
                    {isEditMode ? (
                        saving ? 'Saving...' : 'Save Changes'
                    ) : (
                        <>
                            <PlusIcon className="h-4 w-4" />
                            {saving ? 'Adding...' : 'Add Player'}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default PlayerForm;
