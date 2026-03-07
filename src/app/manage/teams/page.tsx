'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Team, Tournament } from '@/types';
import { getAuthHeaders } from '@/lib/api-client';
import { useTournamentContext } from '@/contexts/TournamentContext';
import Modal from '@/components/Modal';
import TeamForm from '@/components/TeamForm';
import DeleteButton from '@/components/shared/DeleteButton';
import EditButton from '@/components/shared/EditButton';
import { imageOptimizers } from '@/lib/imageOptimization';

function TeamsManagePage() {
    const router = useRouter();
    const { tournaments, selectedTournamentId, setSelectedTournamentId, loading: tournamentsLoading } = useTournamentContext();

    const [teams, setTeams] = useState<Team[]>([]);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchTeams = useCallback(async () => {
        if (!selectedTournamentId) { setTeams([]); return; }
        setLoadingTeams(true);
        try {
            const res = await fetch(`/api/teams?tournamentId=${selectedTournamentId}`, { headers: getAuthHeaders() });
            if (res.ok) setTeams(await res.json());
        } catch (err) {
            console.error('Failed to fetch teams:', err);
        } finally {
            setLoadingTeams(false);
        }
    }, [selectedTournamentId, refreshTrigger]);

    useEffect(() => { fetchTeams(); }, [fetchTeams]);

    const handleDelete = async (teamId: string) => {
        try {
            const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (res.ok) setRefreshTrigger(p => p + 1);
        } catch (err) {
            console.error('Failed to delete team:', err);
        }
    };

    const selectedTournament = tournaments.find(t => t._id === selectedTournamentId) ?? null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Teams</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Add and manage teams for your tournament</p>
                </div>
                <button
                    onClick={() => router.push('/manage/players')}
                    className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
                >
                    Continue to Players →
                </button>
            </div>

            {/* Tournament selector */}
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Select Tournament</label>
                {tournamentsLoading ? (
                    <div className="h-10 rounded-md animate-pulse" style={{ backgroundColor: 'var(--surface-elevated)' }} />
                ) : (
                    <select
                        value={selectedTournamentId || ''}
                        onChange={(e) => setSelectedTournamentId(e.target.value || null)}
                        className="w-full rounded-md p-2"
                        style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    >
                        <option value="">— Select a tournament —</option>
                        {tournaments.map(t => (
                            <option key={t._id} value={t._id}>{t.name} ({t.year}) — {t.status}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Teams panel */}
            {selectedTournamentId && (
                <div className="rounded-lg p-6 setup-panel">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                            Teams {!loadingTeams && <span className="text-sm font-normal" style={{ color: 'var(--text-tertiary)' }}>({teams.length})</span>}
                        </h2>
                        <button
                            onClick={() => setAddModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors hover:opacity-80"
                            style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
                        >
                            + Add Team
                        </button>
                    </div>

                    {loadingTeams ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--brand-primary)' }} />
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="text-center py-12">
                            <p style={{ color: 'var(--text-secondary)' }}>No teams yet. Click &ldquo;Add Team&rdquo; to get started.</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {teams.map(team => (
                                <li key={team._id} className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: 'var(--surface-card)' }}>
                                    <div className="flex items-center gap-3">
                                        <img src={imageOptimizers.teamThumbnail(team.logoURL)} alt={team.name} className="w-12 h-12 rounded-md object-cover" loading="lazy" />
                                        <div>
                                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                {team.name} <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>({team.shortCode})</span>
                                            </p>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Owner: {team.ownerName}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                Budget: {team.initialBudget?.toLocaleString() ?? 'N/A'} | Balance: {team.currentBalance?.toLocaleString() ?? 'N/A'} | Players: {team.playersPurchased?.length ?? 0}
                                            </p>
                                        </div>
                                    </div>
                                    <EditButton ariaLabel={`Edit ${team.name}`} onClick={() => setEditingTeam(team)} className="shrink-0" />
                                    <DeleteButton ariaLabel={`Remove ${team.name}`} onClick={() => handleDelete(team._id)} className="shrink-0" />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {!selectedTournamentId && !tournamentsLoading && (
                <div className="text-center py-16 rounded-lg" style={{ border: '2px dashed var(--border-primary)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Select a tournament above to manage its teams.</p>
                    {tournaments.length === 0 && (
                        <button onClick={() => router.push('/manage/tournaments')} className="mt-4 px-4 py-2 rounded-lg font-semibold" style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}>
                            Create a Tournament first
                        </button>
                    )}
                </div>
            )}

            {/* Add Team Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add Team" size="md">
                <TeamForm
                    tournaments={tournaments}
                    defaultTournamentId={selectedTournamentId || ''}
                    onSuccess={() => { setRefreshTrigger(p => p + 1); setAddModalOpen(false); }}
                    onCancel={() => setAddModalOpen(false)}
                />
            </Modal>

            {/* Edit Team Modal */}
            <Modal isOpen={!!editingTeam} onClose={() => setEditingTeam(null)} title="Edit Team" size="md">
                {editingTeam && (
                    <TeamForm
                        tournaments={tournaments}
                        editTeam={editingTeam}
                        onSuccess={() => { setRefreshTrigger(p => p + 1); setEditingTeam(null); }}
                        onCancel={() => setEditingTeam(null)}
                    />
                )}
            </Modal>
        </div>
    );
}

export default function TeamsPage() {
    return (
        <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
            <TeamsManagePage />
        </ProtectedRoute>
    );
}
