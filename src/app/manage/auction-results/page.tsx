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
    const [teamFilter, setTeamFilter] = useState<string>('');
    const [nameFilter, setNameFilter] = useState('');
    const [showNameFilter, setShowNameFilter] = useState(false);
    const [playerNoFilter, setPlayerNoFilter] = useState('');
    const [showPlayerNoFilter, setShowPlayerNoFilter] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportError, setExportError] = useState('');

    // Edit modal
    const [editState, setEditState] = useState<EditModalState | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const fetchData = useCallback(async () => {
        if (!selectedTournamentId) { setPlayers([]); setTeams([]); return; }
        setTeamFilter('');
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
    }, [selectedTournamentId]);

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
            fetchData();
        } catch {
            setSaveError('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleExportTeamwisePdf = async () => {
        if (!selectedTournamentId) return;
        setExportError('');
        try {
            setExportingPdf(true);
            const selectedTournament = tournaments.find(t => t._id === selectedTournamentId);
            const res = await fetch(`/api/reports/tournaments/${selectedTournamentId}/auction-teamwise-pdf`, {
                headers: getAuthHeaders(),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setExportError(data.error || 'Failed to export PDF');
                return;
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const fallbackName = `teamwise_auction_report_${selectedTournamentId}.pdf`;
            const suggestedName = selectedTournament
                ? `${selectedTournament.name}_${selectedTournament.year}_teamwise_auction_report.pdf`.replace(/[^a-z0-9-_\.]+/gi, '_')
                : fallbackName;
            link.href = url;
            link.download = suggestedName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            setExportError('Network error while exporting PDF.');
        } finally {
            setExportingPdf(false);
        }
    };

    // Derived stats
    const soldPlayers = players.filter(p => p.isSold);
    const unsoldPlayers = players.filter(p => (p as any).isUnsold && !p.isSold);
    const availablePlayers = players.filter(p => !p.isSold && !(p as any).isUnsold);
    const totalSpent = soldPlayers.reduce((sum, p) => sum + (p.finalPrice || 0), 0);
    const teamMap = Object.fromEntries(teams.map(t => [t._id, t]));

    // Filtered list
    const filteredPlayers = players
        .filter(p => String((p as any).playerNo ?? '').toLowerCase().includes(playerNoFilter.trim().toLowerCase()))
        .filter(p => statusFilter === 'All' || getPlayerStatus(p) === statusFilter)
        .filter(p => p.name.toLowerCase().includes(nameFilter.trim().toLowerCase()))
        .filter(p => teamFilter === '' || p.winningTeamId === teamFilter)
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
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-2">
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Select Tournament</label>
                    <button
                        onClick={handleExportTeamwisePdf}
                        disabled={!selectedTournamentId || exportingPdf}
                        className="px-3 py-2 rounded-md text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
                    >
                        {exportingPdf ? 'Generating PDF...' : 'Export Team-wise PDF'}
                    </button>
                </div>
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
                {exportError && (
                    <p className="text-sm mt-2 text-red-400">{exportError}</p>
                )}
            </div>

            {selectedTournamentId && (
                <div className="rounded-lg p-3 sm:p-6 setup-panel">
                    {/* Summary stats */}
                    {!loadingPlayers && (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                            {[
                                { label: 'Total Players', value: players.length, color: 'var(--text-primary)' },
                                { label: 'Sold', value: soldPlayers.length, color: '#4ade80' },
                                { label: 'Unsold', value: unsoldPlayers.length, color: '#f87171' },
                                { label: 'Available', value: availablePlayers.length, color: 'var(--text-tertiary)' },
                                { label: 'Total Spent', value: formatCurrency(totalSpent), color: 'var(--brand-secondary)' },
                            ].map(stat => (
                                <div key={stat.label} className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}>
                                    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
                                    <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Mobile filters */}
                    <div className="md:hidden flex flex-col gap-2 mb-4">
                        <input
                            type="text"
                            value={playerNoFilter}
                            onChange={e => setPlayerNoFilter(e.target.value)}
                            placeholder="Filter by Player No"
                            className="w-full rounded-md px-3 py-2 text-sm"
                            style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        />
                        <input
                            type="text"
                            value={nameFilter}
                            onChange={e => setNameFilter(e.target.value)}
                            placeholder="Filter by Name"
                            className="w-full rounded-md px-3 py-2 text-sm"
                            style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        />
                        <div className="grid grid-cols-2 gap-2">
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
                            <select
                                value={teamFilter}
                                onChange={e => setTeamFilter(e.target.value)}
                                className="rounded-md px-3 py-2 text-sm"
                                style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                            >
                                <option value="">All Teams</option>
                                {teams.map(t => (
                                    <option key={t._id} value={t._id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
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
                            <table className="w-full min-w-[980px] text-sm">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                        <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                                            #
                                        </th>
                                        <th className="text-left py-2 px-3">
                                            {showPlayerNoFilter ? (
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={playerNoFilter}
                                                    onChange={e => setPlayerNoFilter(e.target.value)}
                                                    onBlur={() => {
                                                        if (window.innerWidth >= 768) setShowPlayerNoFilter(false);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Escape') setShowPlayerNoFilter(false);
                                                        if (e.key === 'Enter') setShowPlayerNoFilter(false);
                                                    }}
                                                    placeholder="Type player no..."
                                                    className="w-full text-xs rounded px-2 py-1 font-semibold uppercase tracking-wide"
                                                    style={{
                                                        backgroundColor: 'var(--surface-elevated)',
                                                        border: '1px solid var(--border-primary)',
                                                        color: 'var(--text-primary)'
                                                    }}
                                                />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPlayerNoFilter(true)}
                                                    className="hidden md:inline text-left font-semibold text-xs uppercase tracking-wide hover:opacity-80"
                                                    style={{ color: 'var(--text-tertiary)' }}
                                                    title="Filter by player number"
                                                >
                                                    Player No
                                                </button>
                                            )}
                                            <span className="md:hidden font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                                                Player No
                                            </span>
                                        </th>
                                        <th className="text-left py-2 px-3">
                                            {showNameFilter ? (
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={nameFilter}
                                                    onChange={e => setNameFilter(e.target.value)}
                                                    onBlur={() => {
                                                        if (window.innerWidth >= 768) setShowNameFilter(false);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Escape') setShowNameFilter(false);
                                                        if (e.key === 'Enter') setShowNameFilter(false);
                                                    }}
                                                    placeholder="Type player name..."
                                                    className="w-full text-xs rounded px-2 py-1 font-semibold uppercase tracking-wide"
                                                    style={{
                                                        backgroundColor: 'var(--surface-elevated)',
                                                        border: '1px solid var(--border-primary)',
                                                        color: 'var(--text-primary)'
                                                    }}
                                                />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNameFilter(true)}
                                                    className="hidden md:inline text-left font-semibold text-xs uppercase tracking-wide hover:opacity-80"
                                                    style={{ color: 'var(--text-tertiary)' }}
                                                    title="Filter by player name"
                                                >
                                                    Name
                                                </button>
                                            )}
                                            <span className="md:hidden font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                                                Name
                                            </span>
                                        </th>
                                        <th className="text-left py-2 px-3">
                                            <select
                                                value={statusFilter}
                                                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                                                className="hidden md:inline text-xs font-semibold uppercase tracking-wide rounded px-2 py-1 cursor-pointer"
                                                style={{ backgroundColor: statusFilter !== 'All' ? 'var(--brand-primary)' : 'transparent', color: statusFilter !== 'All' ? '#fff' : 'var(--text-tertiary)', border: '1px solid ' + (statusFilter !== 'All' ? 'var(--brand-primary)' : 'var(--border-primary)') }}
                                            >
                                                <option value="All">All Statuses</option>
                                                <option value="Sold">Sold</option>
                                                <option value="Unsold">Unsold</option>
                                                <option value="Available">Available</option>
                                            </select>
                                            <span className="md:hidden font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                                                Status
                                            </span>
                                        </th>
                                        <th className="text-left py-2 px-3">
                                            <select
                                                value={teamFilter}
                                                onChange={e => setTeamFilter(e.target.value)}
                                                className="hidden md:inline text-xs font-semibold uppercase tracking-wide rounded px-2 py-1 cursor-pointer"
                                                style={{ backgroundColor: teamFilter ? 'var(--brand-primary)' : 'transparent', color: teamFilter ? '#fff' : 'var(--text-tertiary)', border: '1px solid ' + (teamFilter ? 'var(--brand-primary)' : 'var(--border-primary)') }}
                                            >
                                                <option value="">All Teams</option>
                                                {teams.map(t => (
                                                    <option key={t._id} value={t._id}>{t.name}</option>
                                                ))}
                                            </select>
                                            <span className="md:hidden font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                                                Team
                                            </span>
                                        </th>
                                        {['Sold Amount', ''].map(col => (
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
                                                <td className="py-3 px-3 font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>{(player as any).playerNo ?? '—'}</td>
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
                                                    {player.isSold && player.finalPrice ? formatCurrency(player.finalPrice) : '—'}
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

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full sm:flex-1 py-2 rounded-md font-semibold text-sm transition-colors hover:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => { setEditState(null); setSaveError(''); }}
                                disabled={saving}
                                className="w-full sm:flex-1 py-2 rounded-md font-semibold text-sm transition-colors hover:opacity-80 disabled:opacity-50"
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
