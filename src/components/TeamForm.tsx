'use client';

import React, { useState } from 'react';
import { Team, Tournament, TeamOfficial, TeamOfficialRole } from '@/types';
import { getAuthHeaders } from '@/lib/api-client';
import { resolveTeamOfficialsConfig, getTeamOfficials } from '@/lib/teamOfficials';
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
    const [logoURL, setLogoURL] = useState(editTeam?.logoURL ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const selectedTournament = tournaments.find(t => t._id === tournamentId);
    const { enabledRoles, requiredRoles } = resolveTeamOfficialsConfig(selectedTournament);

    // Officials keyed by role for the currently selected tournament
    const [officialsByRole, setOfficialsByRole] = useState<Record<string, TeamOfficial>>(() => {
        const existing = getTeamOfficials(editTeam);
        const map: Record<string, TeamOfficial> = {};
        for (const o of existing) map[o.role] = o;
        return map;
    });

    const setOfficial = (role: TeamOfficialRole, patch: Partial<TeamOfficial>) => {
        setOfficialsByRole(prev => ({
            ...prev,
            [role]: { role, name: prev[role]?.name ?? '', photoURL: prev[role]?.photoURL, ...patch },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !shortCode || !tournamentId) return;

        // Build officials payload from enabled roles only
        const officials: TeamOfficial[] = enabledRoles
            .map(role => officialsByRole[role])
            .filter((o): o is TeamOfficial => !!o && !!o.name?.trim())
            .map(o => ({ role: o.role, name: o.name.trim(), photoURL: o.photoURL?.trim() || undefined }));

        // Client-side required check
        for (const role of requiredRoles) {
            if (!officials.some(o => o.role === role)) {
                setError(`${role} name is required.`);
                return;
            }
        }

        setSaving(true);
        setError('');
        try {
            const res = await fetch(
                isEditMode ? `/api/teams/${editTeam!._id}` : '/api/teams',
                {
                    method: isEditMode ? 'PUT' : 'POST',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, shortCode, officials, logoURL: logoURL || undefined, tournamentId }),
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

            {/* Team Officials — dynamic by tournament config */}
            <div className="space-y-3 rounded-md p-3" style={{ border: '1px solid var(--border-primary)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Team Officials</p>
                {enabledRoles.map((role) => {
                    const isRequired = requiredRoles.includes(role);
                    const official = officialsByRole[role];
                    return (
                        <div key={role} className="grid grid-cols-1 gap-2">
                            <label className="block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                                {role} Name{isRequired && ' *'}
                            </label>
                            <input
                                type="text"
                                value={official?.name ?? ''}
                                onChange={(e) => setOfficial(role, { name: e.target.value })}
                                required={isRequired}
                                className="w-full rounded-md p-2"
                                style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                            />
                            <ImageUpload
                                value={official?.photoURL ?? ''}
                                onChange={(url) => setOfficial(role, { photoURL: url })}
                                folder="teams"
                                label={`${role} Photo (optional)`}
                                placeholder="Photo URL"
                                previewClassName="w-14 h-14"
                                previewShape="circle"
                                id={`team-official-${role.toLowerCase()}`}
                            />
                        </div>
                    );
                })}
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
