'use client';

import React, { useState } from 'react';
import { useAuction } from '@/hooks/useAuction';
import { useAuth } from '@/contexts/AuthContext';
import { useTournamentContext } from '@/contexts/TournamentContext';
import { Tournament } from '@/types';
import { getAuthHeaders } from '@/lib/api-client';
import Modal from './Modal';
import Link from 'next/link';

const AuctionSetupPanel: React.FC = () => {
    const { tournament } = useAuction();
    const { user } = useAuth();
    const { refreshTournaments } = useTournamentContext();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedTournamentId, setSelectedTournamentId] = useState(tournament?._id || '');
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
    const [completingTournament, setCompletingTournament] = useState(false);
    const [reactivatingTournament, setReactivatingTournament] = useState(false);

    const [totalPlayers, setTotalPlayers] = useState(0);
    const [totalTeams, setTotalTeams] = useState(0);
    const [soldPlayers, setSoldPlayers] = useState(0);

    const handleCompleteTournament = async () => {
        if (!selectedTournament) return;
        setCompletingTournament(true);
        try {
            const res = await fetch(`/api/tournaments/${selectedTournament._id}/complete`, { method: 'POST', headers: getAuthHeaders() });
            if (res.ok) { alert('Tournament marked as completed!'); setRefreshTrigger(p => p + 1); }
            else { const e = await res.json(); alert(`Failed: ${e.error}`); }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setCompletingTournament(false);
            setShowCompleteConfirm(false);
        }
    };

    const handleReactivateTournament = async () => {
        if (!selectedTournament || user?.role !== 'Admin') return;
        setReactivatingTournament(true);
        try {
            const res = await fetch(`/api/tournaments/${selectedTournament._id}/reactivate`, { method: 'POST', headers: getAuthHeaders() });
            if (res.ok) { alert('Tournament reactivated!'); setRefreshTrigger(p => p + 1); }
            else { const e = await res.json(); alert(`Failed: ${e.error}`); }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setReactivatingTournament(false);
        }
    };

    React.useEffect(() => {
        let cancelled = false;
        fetch('/api/tournaments', { headers: getAuthHeaders() })
            .then(res => res.ok ? res.json() : [])
            .then(data => { if (!cancelled) setTournaments(data); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [refreshTrigger]);

    React.useEffect(() => {
        if (!selectedTournamentId && tournaments.length > 0) {
            setSelectedTournamentId(tournament?._id || tournaments[0]._id);
        }
    }, [tournaments, selectedTournamentId, tournament]);

    React.useEffect(() => {
        if (!selectedTournamentId) { setTotalPlayers(0); setTotalTeams(0); setSoldPlayers(0); return; }
        let cancelled = false;
        const headers = getAuthHeaders();
        Promise.all([
            fetch(`/api/players?tournamentId=${selectedTournamentId}`, { headers }),
            fetch(`/api/teams?tournamentId=${selectedTournamentId}`, { headers }),
        ]).then(async ([playersRes, teamsRes]) => {
            if (cancelled) return;
            if (playersRes.ok) {
                const players = await playersRes.json();
                setTotalPlayers(players.length);
                setSoldPlayers(players.filter((p: any) => p.isSold).length);
            }
            if (teamsRes.ok) {
                const teams = await teamsRes.json();
                setTotalTeams(teams.length);
            }
        }).catch(() => {});
        return () => { cancelled = true; };
    }, [selectedTournamentId, refreshTrigger]);

    if (tournaments.length === 0) {
        return (
            <div className="text-center p-12">
                <div className="rounded-lg p-8 max-w-2xl mx-auto setup-panel">
                    <h2 className="text-2xl font-bold mb-2">No Tournaments Found</h2>
                    <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Create a tournament first to get started.</p>
                    <Link href="/manage/tournaments" className="inline-block font-bold py-3 px-6 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}>
                        Go to Tournaments
                    </Link>
                </div>
            </div>
        );
    }

    const selectedTournament = tournaments.find(t => t._id === selectedTournamentId);
    if (!selectedTournament) return <div className="text-center p-8" style={{ color: 'var(--text-secondary)' }}>Loading...</div>;

    const availablePlayers = totalPlayers - soldPlayers;
    const isLive = selectedTournament.status === 'Live';
    const isStopped = selectedTournament.status === 'Stopped';
    const isCompleted = selectedTournament.status === 'Completed';
    const isArchived = selectedTournament.status === 'Archived';
    const canStart = ['Draft', 'Setup'].includes(selectedTournament.status);
    const canArchive = isCompleted && soldPlayers === totalPlayers;

    return (
        <div className="space-y-6 animate-fade-in">

            {/* Tournament Selector */}
            <div className="rounded-lg p-6 setup-panel">
                <div className="flex justify-between items-start gap-4">
                    <div className="relative flex-1 max-w-xl">
                        <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Select Tournament</label>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center justify-between gap-4 w-full p-3 rounded-md transition-colors border"
                            style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--surface-subtle)' }}
                        >
                            <p className="text-lg font-semibold">
                                {selectedTournament.name} — Budget: {selectedTournament.budgetPerTeam.toLocaleString()} | Squad: {selectedTournament.squadSize}
                            </p>
                            <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
                                {tournaments.map((t) => {
                                    const statusColor: Record<string, string> = { Live: 'var(--status-success)', Stopped: 'var(--status-warning)', Completed: 'var(--status-info)', Archived: 'var(--text-tertiary)' };
                                    return (
                                        <button key={t._id} onClick={() => { setSelectedTournamentId(t._id); setIsDropdownOpen(false); }}
                                            className="w-full text-left p-3 transition-colors"
                                            style={{ backgroundColor: t._id === selectedTournamentId ? 'var(--surface-hover)' : 'transparent', color: t._id === selectedTournamentId ? 'var(--brand-primary)' : 'var(--text-primary)' }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold">{t.name}</p>
                                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: statusColor[t.status] || 'var(--text-secondary)' }}>
                                                    {t.status === 'Live' && '🔴 '}{t.status}
                                                </span>
                                            </div>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Budget: {t.budgetPerTeam.toLocaleString()} | Squad: {t.squadSize}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {isLive && <div className="text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2 animate-pulse" style={{ color: 'var(--status-success)', border: '1px solid color-mix(in oklab, var(--status-success) 40%, transparent)', background: 'color-mix(in oklab, var(--status-success) 12%, transparent)' }}>🔴 LIVE</div>}
                    {isStopped && <div className="text-sm font-semibold px-3 py-1 rounded-full" style={{ color: 'var(--status-warning)', border: '1px solid color-mix(in oklab, var(--status-warning) 40%, transparent)', background: 'color-mix(in oklab, var(--status-warning) 12%, transparent)' }}>Stopped</div>}
                    {isCompleted && <div className="bg-purple-600/50 text-purple-200 border border-purple-500 text-sm font-semibold px-3 py-1 rounded-full">Completed</div>}
                    {isArchived && <div className="text-sm font-semibold px-3 py-1 rounded-full" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-primary)', background: 'var(--surface-subtle)' }}>Archived</div>}
                </div>

                <div className="p-3 rounded-md text-xs font-mono space-y-1 mt-4" style={{ backgroundColor: 'var(--surface-subtle)', color: 'var(--text-secondary)' }}>
                    <p>Status: <span style={{ color: 'var(--status-warning)' }}>{selectedTournament.status.toUpperCase()}</span></p>
                    <p>Tournament ID: <span className="text-cyan-400">{selectedTournament._id}</span></p>
                </div>
            </div>

            {/* Auction Controls + Stats */}
            <div className="rounded-lg p-6 setup-panel">
                <div className="flex items-center justify-between flex-wrap gap-6">
                    <div className="flex items-center gap-3 flex-wrap">
                        {canStart && (
                            <button onClick={async () => {
                                if (totalTeams < 2 || totalPlayers < 1) { alert('You need at least 2 teams and 1 player to start the auction.'); return; }
                                try {
                                    const res = await fetch('/api/auction/start', { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ tournamentId: selectedTournament._id }) });
                                    const data = await res.json();
                                    if (res.ok) { setRefreshTrigger(p => p + 1); await refreshTournaments(); }
                                    else alert(`Failed to start auction: ${data.error || 'Unknown error'}`);
                                } catch { alert('Failed to start auction.'); }
                            }} className="text-white font-bold py-2 px-6 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--brand-primary)' }}>
                                ▶ Start Auction
                            </button>
                        )}
                        {isLive && (
                            <button onClick={async () => {
                                try {
                                    const res = await fetch('/api/auction/stop', { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ tournamentId: selectedTournament._id }) });
                                    const data = await res.json();
                                    if (res.ok) { setRefreshTrigger(p => p + 1); await refreshTournaments(); }
                                    else alert(`Failed to stop auction: ${data.error}`);
                                } catch { alert('Failed to stop auction.'); }
                            }} className="text-white font-bold py-2 px-6 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--status-danger)' }}>
                                ⏹ Stop Auction
                            </button>
                        )}
                        {isStopped && (
                            <button onClick={async () => {
                                try {
                                    const res = await fetch('/api/auction/restart', { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ tournamentId: selectedTournament._id }) });
                                    const data = await res.json();
                                    if (res.ok) { setRefreshTrigger(p => p + 1); await refreshTournaments(); }
                                    else alert(`Failed to restart: ${data.error}`);
                                } catch { alert('Failed to restart.'); }
                            }} className="text-white font-bold py-2 px-6 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--brand-primary)' }}>
                                ↺ Restart Auction
                            </button>
                        )}
                        {(isLive || isStopped) && (
                            <button onClick={() => setShowCompleteConfirm(true)} className="text-white font-bold py-2 px-6 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--status-info)' }}>
                                ✓ Complete Auction
                            </button>
                        )}
                        {isCompleted && user?.role === 'Admin' && (
                            <button onClick={handleReactivateTournament} disabled={reactivatingTournament} className="text-white font-bold py-2 px-6 rounded-lg transition-colors hover:opacity-80 disabled:opacity-60" style={{ backgroundColor: 'var(--status-warning)' }}>
                                {reactivatingTournament ? 'Reactivating...' : '↺ Reactivate (Admin)'}
                            </button>
                        )}
                        {canArchive && (
                            <button onClick={async () => {
                                try {
                                    await fetch(`/api/tournaments/${selectedTournament._id}/archive`, { method: 'POST', headers: getAuthHeaders() });
                                    setRefreshTrigger(p => p + 1);
                                } catch { console.error('Failed to archive'); }
                            }} className="text-white font-bold py-2 px-6 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' }}>
                                Archive Tournament
                            </button>
                        )}
                        {isArchived && <div className="italic" style={{ color: 'var(--text-secondary)' }}>This tournament is archived (read-only)</div>}
                    </div>

                    <div className="flex gap-8 text-center">
                        <div><p className="text-2xl font-bold">{totalPlayers}</p><p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Players</p></div>
                        <div><p className="text-2xl font-bold">{totalTeams}</p><p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Teams</p></div>
                        <div><p className="text-2xl font-bold" style={{ color: 'var(--status-success)' }}>{availablePlayers}</p><p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Available</p></div>
                        <div><p className="text-2xl font-bold" style={{ color: 'var(--status-danger)' }}>{soldPlayers}</p><p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Sold</p></div>
                    </div>
                </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/manage/teams" className="flex items-center justify-between p-4 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
                    <div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Manage Teams</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{totalTeams} team{totalTeams !== 1 ? 's' : ''} registered</p>
                    </div>
                    <svg className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
                <Link href="/manage/players" className="flex items-center justify-between p-4 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
                    <div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Manage Players</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{totalPlayers} player{totalPlayers !== 1 ? 's' : ''} registered</p>
                    </div>
                    <svg className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
            </div>

            {/* Complete Confirmation Modal */}
            <Modal isOpen={showCompleteConfirm} onClose={() => setShowCompleteConfirm(false)} title="Complete Tournament?" size="sm">
                <div className="space-y-4">
                    <div className="rounded-lg p-4" style={{ color: 'var(--status-warning)', border: '1px solid color-mix(in oklab, var(--status-warning) 40%, transparent)', background: 'color-mix(in oklab, var(--status-warning) 12%, transparent)' }}>
                        <p className="font-semibold mb-1">Completing the Tournament</p>
                        <p className="text-sm">This will deactivate the tournament and prevent further auction operations.</p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Only admins can reactivate a completed tournament.</p>
                    <div className="flex gap-3 justify-end pt-2">
                        <button onClick={() => setShowCompleteConfirm(false)} className="font-bold py-2 px-4 rounded-lg hover:opacity-80" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' }}>Cancel</button>
                        <button onClick={handleCompleteTournament} disabled={completingTournament} className="text-white font-bold py-2 px-4 rounded-lg hover:opacity-80 disabled:opacity-60" style={{ backgroundColor: 'var(--status-info)' }}>
                            {completingTournament ? 'Completing...' : 'Yes, Complete'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AuctionSetupPanel;
