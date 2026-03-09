'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Player, Team } from '@/types';
import { getAuthHeaders } from '@/lib/api-client';
import { useTournamentContext } from '@/contexts/TournamentContext';
import Modal from '@/components/Modal';

const formatCurrency = (amount: number) => amount.toLocaleString('en-IN');

type StatusFilter = 'All' | 'Sold' | 'Unsold' | 'Available';

function getPlayerStatus(player: Player): 'Sold' | 'Unsold' | 'Available' {
    if (player.isSold) return 'Sold';
    if ((player as any).isUnsold) return 'Unsold';
    return 'Available';
}

function StatusBadge({ status }: { status: 'Sold' | 'Unsold' | 'Available' }) {
    const styles: Record<string, string> = {
        Sold: 'bg-green-500/20 text-green-400 border border-green-500/30',
        Unsold: 'bg-red-500/20 text-red-400 border border-red-500/30',
        Available: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${styles[status]}`}>
            {status}
        </span>
    );
}

interface EditModalState {
    player: Player;
    status: 'Sold' | 'Unsold' | 'Available';
    winningTeamId: string;
    finalPrice: number;
}

function AuctionResultsPage() {
    const { tournaments, selectedTournamentId, setSelectedTournamentId, loading: tournamentsLoading } = useTournamentContext();

    const [players, setPlayers] = useState<Player[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Edit modal
    const [editState, setEditState] = useState<EditModalState | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const fetchData = useCallback(async () => {
        if (!selectedTournamentId) { setPlayers([]); setTeams([]); return; }
        setLoadingPlayers(true);
        try {
            const [playersRes, teamsRes] = await Promise.all([
                fetch(`/api/players?tournamentId=${selectedTournamentId}`, { headers: getAuthHeaders() }),
                fetch(`/api/teams?tournamentId=${selectedTournamentId}`, { headers: getAuthHeaders() }),
            ]);
            if (playersRes.ok) setPlayers(await playersRes.json());
            if (teamsRes.ok) setTeams(await teamsRes.json());
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoadingPlayers(false);
        }
    }, [selectedTournamentId, refreshTrigger]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openEdit = (player: Player) => {
        setSaveError('');
        setEditState({
            player,
            status: getPlayerStatus(player),
            winningTeamId: player.winningTeamId || '',
            finalPrice: player.finalPrice || 0,
        });
    };

    const handleSave = async () => {
        if (!editState) return;
        if (editState.status === 'Sold' && (!editState.winningTeamId || editState.finalPrice <= 0)) {
            setSaveError('Please select a team and enter a valid sold amount.');
            return;
        }
        setSaving(true);
        setSaveError('');
        try {
            const res = await fetch(`/api/players/${editState.player._id}/auction-status`, {
                method: 'PATCH',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: editState.status,
                    winningTeamId: editState.status === 'Sold' ? editState.winningTeamId : undefined,
                    finalPrice: editState.status === 'Sold' ? editState.finalPrice : undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setSaveError(data.error || 'Failed to save'); return; }
            setEditState(null);
            setRefreshTrigger(p => p + 1);
        } catch {
            setSaveError('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Derived stats
    const soldPlayers = players.filter(p => p.isSold);
    const unsoldPlayers = players.filter(p => (p as any).isUnsold && !p.isSold);
    const availablePlayers = players.filter(p => !p.isSold && !(p as any).isUnsold);
    const totalSpent = soldPlayers.reduce((sum, p) => sum + (p.finalPrice || 0), 0);
    const teamMap = Object.fromEntries(teams.map(t => [t._id, t]));

    // Filtered + searched list
    const filteredPlayers = players
        .filter(p => statusFilter === 'All' || getPlayerStatus(p) === statusFilter)
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p._id.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a._id.localeCompare(b._id));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Auction Results</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>View and manage player auction status, team assignments, and sold prices</p>
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

            {selectedTournamentId && (
                <div className="rounded-lg p-6 setup-panel">
                    {/* Summary stats */}
                    {!loadingPlayers && (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                            {[
                                { label: 'Total Players', value: players.length, color: 'var(--text-primary)' },
                                { label: 'Sold', value: soldPlayers.length, color: '#4ade80' },
                                { label: 'Unsold', value: unsoldPlayers.length, color: '#f87171' },
                                { label: 'Available', value: availablePlayers.length, color: 'var(--text-tertiary)' },
                                { label: 'Total Spent', value: `₹${formatCurrency(totalSpent)}`, color: 'var(--brand-secondary)' },
                            ].map(stat => (
                                <div key={stat.label} className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}>
                                    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
                                    <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-4">
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="flex-1 min-w-[180px] rounded-md px-3 py-2 text-sm"
                            style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                            className="rounded-md px-3 py-2 text-sm"
                            style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Sold">Sold</option>
                            <option value="Unsold">Unsold</option>
                            <option value="Available">Available</option>
                        </select>
                    </div>

                    {/* Table */}
                    {loadingPlayers ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--brand-primary)' }} />
                        </div>
                    ) : filteredPlayers.length === 0 ? (
                        <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                            No players found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                        {['#', 'Player ID', 'Name', 'Status', 'Team', 'Sold Amount', ''].map(col => (
                                            <th key={col} className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPlayers.map((player, index) => {
                                        const status = getPlayerStatus(player);
                                        const team = player.winningTeamId ? teamMap[player.winningTeamId] : null;
                                        return (
                                            <tr
                                                key={player._id}
                                                style={{ borderBottom: '1px solid var(--border-primary)' }}
                                                className="hover:bg-white/5 transition-colors"
                                            >
                                                <td className="py-3 px-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{index + 1}</td>
                                                <td className="py-3 px-3 font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>{player._id}</td>
                                                <td className="py-3 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{player.name}</td>
                                                <td className="py-3 px-3"><StatusBadge status={status} /></td>
                                                <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>
                                                    {team ? (
                                                        <span className="flex items-center gap-2">
                                                            {team.logoURL && (
                                                                <img src={team.logoURL} alt={team.name} className="w-5 h-5 rounded-full object-cover" />
                                                            )}
                                                            {team.name}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td className="py-3 px-3 font-semibold" style={{ color: player.isSold ? 'var(--brand-secondary)' : 'var(--text-tertiary)' }}>
                                                    {player.isSold && player.finalPrice ? `₹${formatCurrency(player.finalPrice)}` : '—'}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <button
                                                        onClick={() => openEdit(player)}
                                                        className="p-1.5 rounded-md transition-colors hover:opacity-80"
                                                        style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--brand-primary)', border: '1px solid var(--border-primary)' }}
                                                        title="Edit auction status"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            <Modal
                isOpen={!!editState}
                onClose={() => { setEditState(null); setSaveError(''); }}
                title={editState ? `Edit — ${editState.player.name}` : 'Edit Player'}
                size="md"
            >
                {editState && (
                    <div className="space-y-4">
                        {/* Player info */}
                        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}>
                            <p className="font-mono text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>ID: {editState.player._id}</p>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{editState.player.name}</p>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
                            <select
                                value={editState.status}
                                onChange={e => setEditState(prev => prev ? { ...prev, status: e.target.value as any, winningTeamId: '', finalPrice: 0 } : null)}
                                className="w-full rounded-md p-2 text-sm"
                                style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                            >
                                <option value="Available">Available</option>
                                <option value="Unsold">Unsold</option>
                                <option value="Sold">Sold</option>
                            </select>
                        </div>

                        {/* Team & Price — only when Sold */}
                        {editState.status === 'Sold' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Winning Team</label>
                                    <select
                                        value={editState.winningTeamId}
                                        onChange={e => setEditState(prev => prev ? { ...prev, winningTeamId: e.target.value } : null)}
                                        className="w-full rounded-md p-2 text-sm"
                                        style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="">— Select a team —</option>
                                        {teams.map(t => (
                                            <option key={t._id} value={t._id}>{t.name} ({t.shortCode})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Sold Amount</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={editState.finalPrice || ''}
                                        onChange={e => setEditState(prev => prev ? { ...prev, finalPrice: parseInt(e.target.value) || 0 } : null)}
                                        className="w-full rounded-md p-2 text-sm"
                                        style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        placeholder="e.g. 50000"
                                    />
                                </div>
                            </>
                        )}

                        {saveError && (
                            <p className="text-sm text-red-400">{saveError}</p>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2 rounded-md font-semibold text-sm transition-colors hover:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => { setEditState(null); setSaveError(''); }}
                                disabled={saving}
                                className="flex-1 py-2 rounded-md font-semibold text-sm transition-colors hover:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default function AuctionResultsPageWrapper() {
    return (
        <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
            <AuctionResultsPage />
        </ProtectedRoute>
    );
}
