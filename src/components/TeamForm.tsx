'use client';

import React, { useState } from 'react';
import { Team, Tournament } from '@/types';
import { getAuthHeaders } from '@/lib/api-client';
import ImageUpload from './ImageUpload';
import { PlusIcon } from './icons';

interface TeamFormProps {
    tournaments: Tournament[];
    defaultTournamentId?: string;
    editTeam?: Team;
    onSuccess: () => void;
    onCancel: () => void;
}

const TeamForm: React.FC<TeamFormProps> = ({ tournaments, defaultTournamentId = '', editTeam, onSuccess, onCancel }) => {
    const isEditMode = !!editTeam;

    const [tournamentId, setTournamentId] = useState(editTeam?.tournamentId ?? defaultTournamentId);
    const [name, setName] = useState(editTeam?.name ?? '');
    const [shortCode, setShortCode] = useState(editTeam?.shortCode ?? '');
    const [ownerName, setOwnerName] = useState(editTeam?.ownerName ?? '');
    const [logoURL, setLogoURL] = useState(editTeam?.logoURL ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const selectedTournament = tournaments.find(t => t._id === tournamentId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !shortCode || !ownerName || !tournamentId) return;
        setSaving(true);
        setError('');
        try {
            const res = await fetch(
                isEditMode ? `/api/teams/${editTeam!._id}` : '/api/teams',
                {
                    method: isEditMode ? 'PUT' : 'POST',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, shortCode, ownerName, logoURL: logoURL || undefined, tournamentId }),
                }
            );
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || (isEditMode ? 'Failed to update team' : 'Failed to create team'));
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || (isEditMode ? 'Failed to update team' : 'Failed to create team'));
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

            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tournament</label>
                <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} required disabled={isEditMode} className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', opacity: isEditMode ? 0.6 : 1, cursor: isEditMode ? 'not-allowed' : 'auto' }}>
                    <option value="">Select Tournament</option>
                    {tournaments.map(t => (
                        <option key={t._id} value={t._id}>{t.name} ({t.year})</option>
                    ))}
                </select>
                {selectedTournament && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        Budget per team: {selectedTournament.budgetPerTeam.toLocaleString()}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Team Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Short Code (e.g., MI)</label>
                <input type="text" value={shortCode} onChange={(e) => setShortCode(e.target.value)} required maxLength={6} className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Owner Name</label>
                <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required className="w-full rounded-md p-2" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>

            <ImageUpload
                value={logoURL}
                onChange={setLogoURL}
                folder="teams"
                label="Team Logo (optional)"
                placeholder="Logo URL"
                previewClassName="w-16 h-16"
                previewShape="square"
                id="team-logo-form"
            />

            <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="font-bold py-2 px-4 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 text-white font-bold py-2 px-4 rounded-lg transition-colors hover:opacity-80 disabled:opacity-60" style={{ backgroundColor: 'var(--brand-primary)' }}>
                    {!isEditMode && <PlusIcon className="h-4 w-4" />}
                    {saving ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Team')}
                </button>
            </div>
        </form>
    );
};

export default TeamForm;
