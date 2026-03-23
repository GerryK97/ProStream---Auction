'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Player } from '@/types';
import { getAuthHeaders } from '@/lib/api-client';
import { useTournamentContext } from '@/contexts/TournamentContext';
import Modal from '@/components/Modal';
import PlayerForm from '@/components/PlayerForm';
import BulkAddTournamentPlayers from '@/components/BulkAddTournamentPlayers';
import DeleteButton from '@/components/shared/DeleteButton';
import { imageOptimizers } from '@/lib/imageOptimization';

function PlayersManagePage() {
    const router = useRouter();
    const { tournaments, selectedTournamentId, setSelectedTournamentId, loading: tournamentsLoading } = useTournamentContext();

    const [players, setPlayers] = useState<Player[]>([]);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isBulkModalOpen, setBulkModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [exportingPlayers, setExportingPlayers] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [noImageOnly, setNoImageOnly] = useState(false);
    const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());

    const fetchPlayers = useCallback(async () => {
        if (!selectedTournamentId) { setPlayers([]); return; }
        setLoadingPlayers(true);
        try {
            const res = await fetch(`/api/players?tournamentId=${selectedTournamentId}`, { headers: getAuthHeaders() });
            if (res.ok) setPlayers(await res.json());
        } catch (err) {
            console.error('Failed to fetch players:', err);
        } finally {
            setLoadingPlayers(false);
        }
    }, [selectedTournamentId, refreshTrigger]);

    // Clear selection and filters when tournament changes
    useEffect(() => { setSelectedIds(new Set()); setSearchQuery(''); setNoImageOnly(false); setStatusFilters(new Set()); }, [selectedTournamentId]);

    useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

    const handleDelete = async (playerId: string) => {
        try {
            const res = await fetch(`/api/players/${playerId}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (res.ok) setRefreshTrigger(p => p + 1);
        } catch (err) {
            console.error('Failed to delete player:', err);
        }
    };

    const handleExport = async () => {
        const selectedTournament = tournaments.find(t => t._id === selectedTournamentId);
        if (!selectedTournament || players.length === 0) { alert('No players to export'); return; }
        setExportingPlayers(true);
        try {
            const res = await fetch(`/api/players/tournament-export?tournamentId=${selectedTournamentId}`, { headers: getAuthHeaders() });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to export'); }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `players_${selectedTournament.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
            document.body.appendChild(a); a.click();
            window.URL.revokeObjectURL(url); document.body.removeChild(a);
        } catch (err: any) {
            alert(`Failed to export players: ${err.message}`);
        } finally {
            setExportingPlayers(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const filteredPlayers = players.filter(p => {
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            const nameMatch = p.name.toLowerCase().includes(q);
            const noMatch = (p.playerNo || '').toLowerCase().includes(q);
            if (!nameMatch && !noMatch) return false;
        }
        if (noImageOnly && p.photoURL && !p.photoURL.startsWith('data:')) return false;
        if (statusFilters.size > 0) {
            const status = p.isSold ? 'sold' : p.isUnsold ? 'unsold' : 'available';
            if (!statusFilters.has(status)) return false;
        }
        return true;
    });

    const isFiltered = searchQuery.trim() !== '' || noImageOnly || statusFilters.size > 0;

    const toggleStatusFilter = (status: string) => {
        setStatusFilters(prev => {
            const next = new Set(prev);
            next.has(status) ? next.delete(status) : next.add(status);
            return next;
        });
    };

    const toggleSelectAll = () => {
        const allVisibleSelected = filteredPlayers.length > 0 && filteredPlayers.every(p => selectedIds.has(p._id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                filteredPlayers.forEach(p => next.delete(p._id));
            } else {
                filteredPlayers.forEach(p => next.add(p._id));
            }
            return next;
        });
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} selected player(s)? This cannot be undone.`)) return;
        setBulkDeleting(true);
        try {
            const res = await fetch('/api/players/bulk-delete', {
                method: 'DELETE',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: selectedTournamentId, playerIds: Array.from(selectedIds) }),
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || 'Failed to delete players'); return; }
            setSelectedIds(new Set());
            setRefreshTrigger(p => p + 1);
        } catch (err) {
            console.error('Bulk delete failed:', err);
        } finally {
            setBulkDeleting(false);
        }
    };

    const selectedTournament = tournaments.find(t => t._id === selectedTournamentId) ?? null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Players</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Add and manage players for your tournament</p>
                </div>
                <button
                    onClick={() => router.push('/auction/setup')}
                    className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
                >
                    Continue to Auction Setup →
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

            {/* Players panel */}
            {selectedTournamentId && (
                <div className="rounded-lg p-6 setup-panel">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                            Players {!loadingPlayers && (
                                <span className="text-sm font-normal" style={{ color: 'var(--text-tertiary)' }}>
                                    ({isFiltered ? `${filteredPlayers.length} of ${players.length}` : players.length})
                                </span>
                            )}
                        </h2>
                        <div className="flex gap-2 flex-wrap items-center">
                            {selectedIds.size > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={bulkDeleting}
                                    className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--status-danger)', color: '#fff' }}
                                >
                                    {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
                                </button>
                            )}
                            <button
                                onClick={handleExport}
                                disabled={exportingPlayers || players.length === 0}
                                className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: 'var(--brand-secondary)', color: '#fff' }}
                            >
                                {exportingPlayers ? 'Exporting...' : '↓ Export'}
                            </button>
                            <button
                                onClick={() => setBulkModalOpen(true)}
                                className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:opacity-80"
                                style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
                            >
                                Bulk Import
                            </button>
                            <button
                                onClick={() => setAddModalOpen(true)}
                                className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:opacity-80"
                                style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
                            >
                                + Add Player
                            </button>
                        </div>
                    </div>

                    {loadingPlayers ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--brand-primary)' }} />
                        </div>
                    ) : players.length === 0 ? (
                        <div className="text-center py-12">
                            <p style={{ color: 'var(--text-secondary)' }}>No players yet. Click &ldquo;Add Player&rdquo; or use &ldquo;Bulk Import&rdquo; to get started.</p>
                        </div>
                    ) : (
                        <>
                            {/* Filter bar */}
                            <div className="space-y-2 mb-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative flex-1 min-w-48">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Search by name or player no..."
                                            className="w-full rounded-md pl-8 pr-8 py-2 text-sm"
                                            style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        />
                                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                                        </svg>
                                        {searchQuery && (
                                            <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm leading-none hover:opacity-70" style={{ color: 'var(--text-tertiary)' }}>×</button>
                                        )}
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md text-sm font-medium select-none" style={{ backgroundColor: noImageOnly ? 'color-mix(in oklab, var(--brand-primary) 15%, var(--surface-elevated))' : 'var(--surface-elevated)', border: `1px solid ${noImageOnly ? 'var(--brand-primary)' : 'var(--border-primary)'}`, color: noImageOnly ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
                                        <input type="checkbox" checked={noImageOnly} onChange={e => setNoImageOnly(e.target.checked)} className="w-3.5 h-3.5" style={{ accentColor: 'var(--brand-primary)' }} />
                                        No photo only
                                    </label>
                                    {isFiltered && (
                                        <button type="button" onClick={() => { setSearchQuery(''); setNoImageOnly(false); setStatusFilters(new Set()); }} className="px-3 py-2 rounded-md text-sm font-medium hover:opacity-70" style={{ color: 'var(--text-tertiary)', border: '1px solid var(--border-primary)' }}>
                                            Clear all
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-xs font-medium self-center" style={{ color: 'var(--text-tertiary)' }}>Status:</span>
                                    {([
                                        { key: 'available', label: 'Available', color: 'var(--status-success)' },
                                        { key: 'sold', label: 'Sold', color: 'var(--status-danger)' },
                                        { key: 'unsold', label: 'Unsold', color: 'var(--status-warning)' },
                                    ] as const).map(({ key, label, color }) => {
                                        const active = statusFilters.has(key);
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => toggleStatusFilter(key)}
                                                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all select-none"
                                                style={{
                                                    backgroundColor: active ? `color-mix(in oklab, ${color} 20%, var(--surface-elevated))` : 'var(--surface-elevated)',
                                                    border: `1px solid ${active ? color : 'var(--border-primary)'}`,
                                                    color: active ? color : 'var(--text-secondary)',
                                                }}
                                            >
                                                {active && <span className="mr-1">✓</span>}{label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Select All row */}
                            <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-md" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                                <input
                                    type="checkbox"
                                    checked={filteredPlayers.length > 0 && filteredPlayers.every(p => selectedIds.has(p._id))}
                                    ref={el => {
                                        if (el) {
                                            const visibleSelected = filteredPlayers.filter(p => selectedIds.has(p._id)).length;
                                            el.indeterminate = visibleSelected > 0 && visibleSelected < filteredPlayers.length;
                                        }
                                    }}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 cursor-pointer"
                                    aria-label="Select all players"
                                />
                                <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                                    {selectedIds.size > 0 ? `${selectedIds.size} of ${players.length} selected` : isFiltered ? `Showing ${filteredPlayers.length} of ${players.length}` : 'Select all'}
                                </span>
                            </div>
                            {filteredPlayers.length === 0 ? (
                                <p className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>No players match the current filters.</p>
                            ) : (
                            <ul className="space-y-3">
                                {filteredPlayers.map(player => (
                                    <li key={player._id} className="flex items-center justify-between p-3 rounded-md" style={{ backgroundColor: selectedIds.has(player._id) ? 'color-mix(in oklab, var(--status-danger) 8%, var(--surface-card))' : 'var(--surface-card)', border: selectedIds.has(player._id) ? '1px solid color-mix(in oklab, var(--status-danger) 30%, transparent)' : '1px solid transparent' }}>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(player._id)}
                                                onChange={() => toggleSelect(player._id)}
                                                className="w-4 h-4 cursor-pointer shrink-0"
                                                aria-label={`Select ${player.name}`}
                                            />
                                            <img src={imageOptimizers.playerThumbnail(player.photoURL)} alt={player.name} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                                            <div>
                                                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    #{player.playerNo || player._id.slice(-4)} {player.name}
                                                </p>
                                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {player.position}{player.currentClub ? ` | ${player.currentClub}` : ''}
                                                </p>
                                                {player.playerClass && (
                                                    <p className="text-xs font-medium" style={{ color: 'var(--brand-primary)' }}>{player.playerClass}</p>
                                                )}
                                                <p className="text-xs font-semibold" style={{ color: player.isSold ? 'var(--status-danger)' : player.isUnsold ? 'var(--status-warning)' : 'var(--status-success)' }}>
                                                    {player.isSold ? 'SOLD' : player.isUnsold ? 'UNSOLD' : 'AVAILABLE'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => setEditingPlayer(player)}
                                                className="p-1.5 rounded hover:opacity-70 transition-opacity"
                                                style={{ color: 'var(--text-secondary)' }}
                                                aria-label={`Edit ${player.name}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            <DeleteButton ariaLabel={`Remove ${player.name}`} onClick={() => handleDelete(player._id)} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            )}
                        </>
                    )}
                </div>
            )}

            {!selectedTournamentId && !tournamentsLoading && (
                <div className="text-center py-16 rounded-lg" style={{ border: '2px dashed var(--border-primary)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Select a tournament above to manage its players.</p>
                    {tournaments.length === 0 && (
                        <button onClick={() => router.push('/manage/tournaments')} className="mt-4 px-4 py-2 rounded-lg font-semibold" style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}>
                            Create a Tournament first
                        </button>
                    )}
                </div>
            )}

            {/* Add Player Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add Player" size="2xl">
                <PlayerForm
                    tournaments={tournaments}
                    defaultTournamentId={selectedTournamentId || ''}
                    onSuccess={() => { setRefreshTrigger(p => p + 1); setAddModalOpen(false); }}
                    onCancel={() => setAddModalOpen(false)}
                />
            </Modal>

            {/* Edit Player Modal */}
            <Modal isOpen={!!editingPlayer} onClose={() => setEditingPlayer(null)} title="Edit Player" size="2xl">
                {editingPlayer && (
                    <PlayerForm
                        tournaments={tournaments}
                        editPlayer={editingPlayer}
                        onSuccess={() => { setRefreshTrigger(p => p + 1); setEditingPlayer(null); }}
                        onCancel={() => setEditingPlayer(null)}
                    />
                )}
            </Modal>

            {/* Bulk Import Modal */}
            {selectedTournament && (
                <Modal isOpen={isBulkModalOpen} onClose={() => setBulkModalOpen(false)} title="Bulk Import Players" size="2xl">
                    <BulkAddTournamentPlayers
                        tournament={selectedTournament}
                        onSuccess={() => setRefreshTrigger(p => p + 1)}
                    />
                </Modal>
            )}
        </div>
    );
}

export default function PlayersPage() {
    return (
        <ProtectedRoute allowedRoles={['Admin', 'Tournament']}>
            <PlayersManagePage />
        </ProtectedRoute>
    );
}
