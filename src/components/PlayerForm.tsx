'use client';

import React, { useState } from 'react';
import { Tournament, Player, Team } from '@/types';
import { getAuthHeaders } from '@/lib/api-client';
import ImageUpload from './ImageUpload';
import { PlusIcon } from './icons';
import { getSortedClasses } from '@/lib/playerClassUtils';

const PLAYER_POSITIONS = [
    'Batsman',
    'Bowler',
    'All-rounder',
    'Batting All-rounder',
    'Bowling All-rounder',
    'Wicket-keeper',
    'Wicket Keeper Batsman',
];

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
    const [playerNo, setPlayerNo] = useState(editPlayer?.playerNo ?? '');
    const [name, setName] = useState(editPlayer?.name ?? '');
    const [position, setPosition] = useState(editPlayer?.position ?? '');
    const [currentClub, setCurrentClub] = useState(editPlayer?.currentClub ?? '');
    const [photoURL, setPhotoURL] = useState(editPlayer?.photoURL ?? '');
    const [secondaryImageURL, setSecondaryImageURL] = useState(editPlayer?.secondaryImageURL ?? '');
    const [playerClass, setPlayerClass] = useState(editPlayer?.playerClass ?? '');
    const [age, setAge] = useState<string>(editPlayer?.age !== undefined ? String(editPlayer.age) : '');
    const [stats, setStats] = useState<Record<string, string>>(
        editPlayer?.stats ? Object.fromEntries(Object.entries(editPlayer.stats).map(([k, v]) => [k, String(v)])) : {}
    );
    const [isIconic, setIsIconic] = useState<boolean>(editPlayer?.isIconic ?? false);
    const [winningTeamId, setWinningTeamId] = useState<string>(editPlayer?.winningTeamId ?? '');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const selectedTournament = tournaments.find(t => t._id === tournamentId);
    const useClasses = selectedTournament?.usePlayerClasses && selectedTournament.playerClasses?.length;
    const ppf = selectedTournament?.playerProfileFields;

    const handleTournamentChange = (id: string) => {
        setTournamentId(id);
        setPlayerClass('');
        setWinningTeamId('');
    };

    React.useEffect(() => {
        if (!tournamentId) {
            setTeams([]);
            return;
        }
        const fetchTeams = async () => {
            setLoadingTeams(true);
            try {
                const res = await fetch(`/api/teams?tournamentId=${tournamentId}`, {
                    headers: getAuthHeaders(),
                });
                if (res.ok) {
                    const data = await res.json();
                    setTeams(data);
                }
            } catch (err) {
                console.error('Failed to fetch teams:', err);
            } finally {
                setLoadingTeams(false);
            }
        };
        fetchTeams();
    }, [tournamentId]);

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
                    body: JSON.stringify({
                        playerNo: playerNo.trim() || undefined,
                        name, position, currentClub,
                        photoURL: photoURL || undefined,
                        secondaryImageURL: secondaryImageURL || undefined,
                        playerClass: playerClass || undefined,
                        age: age ? Number(age) : undefined,
                        stats: Object.keys(stats).length > 0 ? stats : undefined,
                        isIconic,
                        winningTeamId: isIconic ? winningTeamId : undefined
                    }),
                });
            } else {
                res = await fetch('/api/players', {
                    method: 'POST',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerNo: playerNo.trim() || undefined,
                        name, position, currentClub,
                        photoURL: photoURL || undefined,
                        secondaryImageURL: secondaryImageURL || undefined,
                        playerClass: playerClass || undefined,
                        age: age ? Number(age) : undefined,
                        stats: Object.keys(stats).length > 0 ? stats : undefined,
                        tournamentId,
                        isIconic,
                        winningTeamId: isIconic ? winningTeamId : undefined
                    }),
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
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            {error && (
                <div className="col-span-2 rounded-md p-3 text-sm" style={{ color: 'var(--status-danger)', background: 'color-mix(in oklab, var(--status-danger) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--status-danger) 40%, transparent)' }}>
                    {error}
                </div>
            )}

            {/* Tournament — full width */}
            <div className="col-span-2">
                {isEditMode ? (
                    <>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tournament</label>
                        <p className="rounded-md p-2 text-sm" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-tertiary)' }}>
                            {selectedTournament?.name ?? tournamentId}
                        </p>
                    </>
                ) : (
                    <>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tournament</label>
                        <select value={tournamentId} onChange={(e) => handleTournamentChange(e.target.value)} required className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                            <option value="">Select Tournament</option>
                            {tournaments.map(t => (
                                <option key={t._id} value={t._id}>{t.name} ({t.year})</option>
                            ))}
                        </select>
                    </>
                )}
            </div>

            {/* Player No | Player Name */}
            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Player No <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span></label>
                <input type="text" value={playerNo} onChange={(e) => setPlayerNo(e.target.value)} placeholder="e.g., 001" className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Player Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>

            {/* Position | Current Club */}
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

            {/* Age | Player Class */}
            {ppf?.showAge ? (
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Age <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span></label>
                    <input type="number" min="1" max="99" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Leave blank if not applicable" className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
                </div>
            ) : <div />}
            {useClasses && selectedTournament ? (
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
            ) : <div />}

            {/* Stat Fields — conditional on tournament config */}
            {ppf && ppf.statFields.length > 0 && (
                <div className="col-span-2 grid grid-cols-2 gap-4">
                    {ppf.statFields.map(sf => (
                        <div key={sf.key}>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                {sf.label} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={stats[sf.key] ?? ''}
                                onChange={e => setStats(prev => ({ ...prev, [sf.key]: e.target.value }))}
                                placeholder={`Enter ${sf.label.toLowerCase()}`}
                                className="w-full rounded-md p-2"
                                style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Iconic Player — full width, conditional */}
            {tournamentId && (
                <div className="col-span-2 rounded-md p-4 space-y-3" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isIconic}
                            onChange={(e) => {
                                setIsIconic(e.target.checked);
                                if (!e.target.checked) setWinningTeamId('');
                            }}
                            className="w-4 h-4"
                            style={{ accentColor: 'var(--brand-primary)' }}
                        />
                        <span className="text-sm font-bold" style={{ color: isIconic ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                            Is Iconic Player?
                        </span>
                    </label>

                    {isIconic && (
                        <div className="pt-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--brand-primary)' }}>
                                Assign to Team
                            </label>
                            {loadingTeams ? (
                                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading teams...</div>
                            ) : teams.length === 0 ? (
                                <div className="text-sm" style={{ color: 'var(--status-warning)' }}>No teams available in this tournament.</div>
                            ) : (
                                <select
                                    value={winningTeamId}
                                    onChange={(e) => setWinningTeamId(e.target.value)}
                                    required={isIconic}
                                    className="w-full rounded-md p-2"
                                    style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--brand-primary)', color: 'var(--text-primary)' }}
                                >
                                    <option value="">Select Team</option>
                                    {teams.map(t => (
                                        <option key={t._id} value={t._id}>{t.name} ({t.shortCode})</option>
                                    ))}
                                </select>
                            )}
                            <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                                Iconic players are automatically marked as Sold with a final price of ₹0. They will appear in the team's summary without affecting the budget.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Player Photo | Secondary Image */}
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
            <ImageUpload
                value={secondaryImageURL}
                onChange={setSecondaryImageURL}
                folder="players"
                label="Secondary Image (optional)"
                placeholder="Secondary Image URL"
                previewClassName="w-16 h-9"
                previewShape="square"
                id="player-secondary-image-form"
                cropAspect={16 / 9}
            />

            {/* Buttons — full width */}
            <div className="col-span-2 pt-2 flex justify-end gap-3">
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
