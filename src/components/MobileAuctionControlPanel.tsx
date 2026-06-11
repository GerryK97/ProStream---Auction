'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTournamentContext } from '@/contexts/TournamentContext';
import { usePusherAuction } from '@/hooks/usePusherAuction';
import { imageOptimizers } from '@/lib/imageOptimization';
import { getClassBasePrice, getFormattedBasePrice, getMinClassBasePrice } from '@/lib/playerClassUtils';
import { getBidIncrement, getNextTeamBid, getPreviousSlabBid } from '@/lib/bidIncrementUtils';
import ClassBadge from '@/components/shared/ClassBadge';
import Modal from '@/components/Modal';
import type { AuctionState, Player, Team, Tournament } from '@/types';

const formatCurrency = (amount: number) => amount.toLocaleString();

interface ClassStat {
    code: string;
    name: string;
    color: string;
    icon?: string;
    order: number;
    total: number;
    sold: number;
    unsold: number;
    remaining: number;
    isActive: boolean;
    isCompleted: boolean;
}

interface MobileAuctionControlPanelProps {
    initialData?: {
        tournament?: Tournament | null;
        auctionState?: AuctionState;
        players?: Player[];
        teams?: Team[];
    } | null;
    stats?: {
        totalTeams: number;
        totalPlayers: number;
        soldPlayers: number;
    };
}

export default function MobileAuctionControlPanel({ initialData, stats }: MobileAuctionControlPanelProps) {
    const [biddingTeamId, setBiddingTeamId] = useState('');
    const [bidAmount, setBidAmount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'auction' | 'available' | 'teams'>('auction');
    const [isSpinning, setIsSpinning] = useState(false);
    const [showReAuctionConfirm, setShowReAuctionConfirm] = useState(false);
    const [reAuctioning, setReAuctioning] = useState(false);
    const [selectingClass, setSelectingClass] = useState(false);
    const [classCompletionAlert, setClassCompletionAlert] = useState<string | null>(null);
    const [playerSearch, setPlayerSearch] = useState('');
    const undoInFlightRef = useRef(false);
    const sellInFlightRef = useRef(false);
    const [undoPending, setUndoPending] = useState(false);
    const prevCompletedClassesRef = useRef<string[]>([]);

    const initialTournamentId = initialData?.tournament?._id ?? null;
    const [liveTournamentId, setLiveTournamentId] = useState<string | null>(initialTournamentId);

    const { token } = useAuth();
    const {
        selectedTournamentId,
        setSelectedTournamentId,
        tournaments,
        loading: tournamentsLoading,
        refreshTournaments,
    } = useTournamentContext();

    const getAuthHeaders = (): Record<string, string> =>
        token ? { 'Authorization': `Bearer ${token}` } : {};

    useEffect(() => {
        if (initialTournamentId) { setLiveTournamentId(initialTournamentId); return; }
        if (selectedTournamentId) {
            setLiveTournamentId(selectedTournamentId);
        } else {
            (async () => {
                try {
                    const res = await fetch('/api/tournaments/active', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
                    if (res.ok) {
                        const t = await res.json();
                        if (t) setLiveTournamentId(t._id);
                    }
                } catch { /* silent */ }
            })();
        }
    }, [selectedTournamentId, initialTournamentId, token]);

    const {
        tournament: liveTournament,
        auctionState,
        players,
        teams,
        updatePlayerAndTeams,
        setPlayerAvailable,
    } = usePusherAuction(liveTournamentId, initialData ?? undefined);

    const currentPlayer = useMemo(
        () => players.find((p: Player) => p._id === auctionState.currentPlayerId),
        [players, auctionState.currentPlayerId]
    );
    const soldPlayers = useMemo(() => players.filter((p: Player) => p.isSold), [players]);
    const unsoldPlayers = useMemo(() => players.filter((p: Player) => !p.isSold && p.isUnsold), [players]);
    const availablePlayers = useMemo(() => players.filter((p: Player) => !p.isSold && !p.isUnsold), [players]);

    const isAuctioning = useMemo(
        () => !!currentPlayer && auctionState.currentAuctionStatus !== 'Sold',
        [currentPlayer, auctionState.currentAuctionStatus]
    );
    const isAuctionStopped = liveTournament?.status === 'Stopped';
    const isSold = auctionState.currentAuctionStatus === 'Sold';
    const currentBid = auctionState.currentBid ?? 0;

    const classStats = useMemo((): ClassStat[] => {
        if (!liveTournament?.usePlayerClasses || !liveTournament.playerClasses) return [];
        return liveTournament.playerClasses
            .map((cls: any) => {
                const cp = players.filter((p: Player) => p.playerClass === cls.name);
                const sold = cp.filter((p: Player) => p.isSold).length;
                const unsold = cp.filter((p: Player) => p.isUnsold).length;
                return {
                    ...cls,
                    total: cp.length,
                    sold,
                    unsold,
                    remaining: cp.length - sold - unsold,
                    isActive: auctionState.currentAuctionClass === cls.name,
                    isCompleted: (auctionState.completedClasses ?? []).includes(cls.name),
                };
            })
            .sort((a: any, b: any) => a.order - b.order);
    }, [liveTournament, players, auctionState.currentAuctionClass, auctionState.completedClasses]);

    // Sync bid amount when current bid changes
    useEffect(() => {
        const base = getClassBasePrice(liveTournament ?? null, currentPlayer ?? null);
        const nextBid = currentBid > 0 ? currentBid + 1000 : base;
        setBidAmount(nextBid);
    }, [currentBid, currentPlayer, liveTournament]);

    useEffect(() => {
        if (auctionState.completedClasses) {
            const prev = prevCompletedClassesRef.current;
            const current = auctionState.completedClasses;
            if (prev.length < current.length) {
                const newClasses = current.filter(c => !prev.includes(c));
                if (newClasses.length > 0) {
                    setClassCompletionAlert(`Class ${newClasses.join(', ')} fully auctioned!`);
                    setTimeout(() => setClassCompletionAlert(null), 8000);
                }
            }
            prevCompletedClassesRef.current = current;
        }
    }, [auctionState.completedClasses]);

    useEffect(() => {
        if (error) {
            const t = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(t);
        }
    }, [error]);

    // ── Handlers ────────────────────────────────────────────────────────────
    const post = async (url: string, body: object) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            throw new Error(d.error || `Request failed`);
        }
        return res.json().catch(() => ({}));
    };

    const handle = (fn: () => Promise<void>) => async () => {
        try { await fn(); } catch (e: any) { setError(e.message); }
    };

    const handleSelectPlayer = async (playerId: string) => {
        try {
            await post('/api/auction/select-player', { tournamentId: liveTournament!._id, playerId });
            setActiveTab('auction');
        } catch (e: any) { setError(e.message); }
    };

    const handleStopAuction = handle(async () => {
        await post('/api/auction/stop', { tournamentId: liveTournament!._id });
    });

    const handleRestartAuction = handle(async () => {
        await post('/api/auction/restart', { tournamentId: liveTournament!._id });
    });

    const handleUndo = async () => {
        if (!liveTournament || undoInFlightRef.current || sellInFlightRef.current) return;
        undoInFlightRef.current = true;
        setUndoPending(true);
        try {
            await post('/api/auction/undo', { tournamentId: liveTournament._id });
        } catch (e: any) {
            setError(e.message);
        } finally {
            undoInFlightRef.current = false;
            setUndoPending(false);
        }
    };

    const handleCleanupAll = handle(async () => {
        await post('/api/auction/cleanup-all', { tournamentId: liveTournament!._id });
    });

    const handleSelectClass = async (className: string) => {
        if (selectingClass) return;
        setSelectingClass(true);
        try { await post('/api/auction/select-class', { tournamentId: liveTournament!._id, className }); }
        catch (e: any) { setError(e.message); }
        finally { setSelectingClass(false); }
    };

    const handleClearClass = async () => {
        if (selectingClass) return;
        setSelectingClass(true);
        try {
            const res = await fetch('/api/auction/select-class', {
                method: 'DELETE',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament!._id }),
            });
            if (!res.ok) throw new Error('Failed to clear class');
        } catch (e: any) { setError(e.message); }
        finally { setSelectingClass(false); }
    };

    const handleReAuction = async () => {
        setReAuctioning(true);
        try {
            const data = await post('/api/auction/re-auction', { tournamentId: liveTournament!._id });
            (data.reAuctionedPlayerIds as string[])?.forEach(id => setPlayerAvailable(id));
        } catch (e: any) { setError(e.message); }
        finally { setReAuctioning(false); setShowReAuctionConfirm(false); }
    };

    const handleBid = async (amount: number, teamId?: string) => {
        if (!liveTournament) return;
        const basePrice = liveTournament.basePricePerPlayer || 0;
        if (currentBid > 0 && amount <= currentBid) {
            setError(`Bid must be greater than ${formatCurrency(currentBid)}`);
            return;
        }
        if (currentBid === 0 && amount < basePrice) {
            setError(`First bid must be at least ${formatCurrency(basePrice)}`);
            return;
        }
        setIsSubmitting(true);
        try { await post('/api/auction/bid', { tournamentId: liveTournament._id, teamId, amount }); }
        catch (e: any) { setError(e.message); }
        finally { setIsSubmitting(false); }
    };

    const handleCorrectBid = async (amount: number, teamId?: string) => {
        setIsSubmitting(true);
        try { await post('/api/auction/bid/correct', { tournamentId: liveTournament!._id, amount, teamId }); }
        catch (e: any) { setError(e.message); }
        finally { setIsSubmitting(false); }
    };

    const handleSell = handle(async () => {
        if (sellInFlightRef.current || undoInFlightRef.current) return;
        if (!biddingTeamId) throw new Error('Select a winning team first');
        sellInFlightRef.current = true;
        try {
            await post('/api/auction/sell', { tournamentId: liveTournament!._id, teamId: biddingTeamId });
        } finally {
            sellInFlightRef.current = false;
        }
    });

    const handleReset = handle(async () => {
        await post('/api/auction/reset', { tournamentId: liveTournament!._id });
    });

    const handleMarkUnsold = handle(async () => {
        if (!auctionState.currentPlayerId) return;
        await post('/api/auction/unsold', {
            tournamentId: liveTournament!._id,
            playerId: auctionState.currentPlayerId,
        });
    });

    const handleSpinWheel = async () => {
        if (isSpinning || !liveTournament) return;
        setIsSpinning(true);
        try {
            const data = await post('/api/overlay/spin', { tournamentId: liveTournament._id });
            if (data.winnerId) {
                await post('/api/auction/select-player', { tournamentId: liveTournament._id, playerId: data.winnerId });
            }
        } catch (e: any) { setError(e.message); }
        finally { setIsSpinning(false); }
    };

    const handleQuickBid = async (increment: number) => {
        const basePrice = getClassBasePrice(liveTournament ?? null, currentPlayer ?? null);
        const newAmount = currentBid > 0 ? currentBid + increment : basePrice;
        await handleBid(newAmount, liveTournament?.biddingMode === 'team' ? biddingTeamId || undefined : undefined);
    };

    const handleTeamBid = async (teamId: string) => {
        if (!liveTournament) return;
        const basePrice = getClassBasePrice(liveTournament, currentPlayer ?? null);
        const increments = liveTournament.bidIncrements ?? [];
        const nextBid = getNextTeamBid(increments, currentBid, basePrice);
        setBiddingTeamId(teamId);
        await handleBid(nextBid, teamId);
    };

    // ── No tournament selected ───────────────────────────────────────────────
    if (!liveTournament) {
        return (
            <div className="w-full h-full flex items-center justify-center p-6">
                <div className="w-full max-w-sm rounded-xl p-6 border border-[var(--border-primary)]"
                    style={{ backgroundColor: 'var(--surface-secondary)' }}>
                    <p className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Select Tournament</p>
                    <select
                        value={selectedTournamentId || ''}
                        onChange={e => setSelectedTournamentId(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg text-base"
                        style={{ backgroundColor: 'var(--surface-dropdown)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        disabled={tournamentsLoading}
                    >
                        <option value="">Select a tournament…</option>
                        {tournaments.map((t: Tournament) => (
                            <option key={t._id} value={t._id}>{t.name} ({t.status})</option>
                        ))}
                    </select>
                </div>
            </div>
        );
    }

    const isCorrection = currentBid > 0 && bidAmount > 0 && bidAmount < currentBid;

    // Team bid panel helpers
    const calcMaxBid = (team: Team): number => {
        if (!liveTournament || team.currentBalance == null) return 0;
        const purchased = players.filter(p => p.isSold && p.winningTeamId === team._id).length;
        const remaining = liveTournament.squadSize - purchased;
        if (remaining <= 1) return team.currentBalance;
        const minBase = getMinClassBasePrice(liveTournament);
        return Math.max(0, team.currentBalance - (remaining - 1) * minBase);
    };

    const teamBidIncrement = liveTournament.biddingMode === 'team'
        ? (currentBid === 0
            ? getClassBasePrice(liveTournament, currentPlayer ?? null)
            : getBidIncrement(liveTournament.bidIncrements ?? [], currentBid))
        : 0;
    const teamNextBid = liveTournament.biddingMode === 'team'
        ? getNextTeamBid(liveTournament.bidIncrements ?? [], currentBid, getClassBasePrice(liveTournament, currentPlayer ?? null))
        : 0;

    const DEFAULT_QUICK_BIDS_MOBILE = [1000, 5000, 10000, 25000, 50000, 100000];
    const quickBidIncrements = (liveTournament.directQuickBidsEnabled && liveTournament.directQuickBids && liveTournament.directQuickBids.length > 0)
        ? liveTournament.directQuickBids.map(b => b.amount).filter(a => a > 0)
        : DEFAULT_QUICK_BIDS_MOBILE;
    const basePrice = getClassBasePrice(liveTournament, currentPlayer ?? null);
    const slabIncrements = liveTournament.bidIncrements ?? [];
    const directSlabEnabled = liveTournament.biddingMode === 'direct' && liveTournament.directBidSlabEnabled;
    const nextSlabBid = currentBid > 0 ? currentBid + getBidIncrement(slabIncrements, currentBid) : basePrice;
    const previousSlabBid = getPreviousSlabBid(slabIncrements, currentBid, basePrice);
    const currentSlabIncrement = currentBid > 0 ? getBidIncrement(slabIncrements, currentBid) : basePrice;
    const filteredPlayers = availablePlayers.filter(p =>
        !playerSearch || p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
        String(p.playerNo || '').includes(playerSearch)
    );
    const activeClassFilter = auctionState.currentAuctionClass;
    const displayedPlayers = activeClassFilter
        ? filteredPlayers.filter(p => p.playerClass === activeClassFilter)
        : filteredPlayers;

    return (
        <div className="w-full flex flex-col" style={{ height: 'calc(100dvh - 5.5rem)' }}>

            {/* ── Top Status Bar ───────────────────────────────────────────── */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 z-10"
                style={{ backgroundColor: 'var(--surface-secondary)', borderBottom: '1px solid var(--border-primary)' }}>

                {/* Left: status + counts */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isAuctionStopped ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`} />
                        <span className={`text-xs font-bold tracking-widest uppercase ${isAuctionStopped ? 'text-yellow-400' : 'text-green-400'}`}>
                            {isAuctionStopped ? 'Stopped' : 'Live'}
                        </span>
                    </div>
                    <div className="flex gap-2 text-xs font-semibold">
                        <span style={{ color: 'var(--text-secondary)' }}>{availablePlayers.length} <span style={{ color: 'var(--text-muted)' }}>avail</span></span>
                        <span className="text-green-400">{soldPlayers.length} <span style={{ color: 'var(--text-muted)' }}>sold</span></span>
                        <span className="text-red-400">{unsoldPlayers.length} <span style={{ color: 'var(--text-muted)' }}>unsold</span></span>
                    </div>
                </div>

                {/* Right: stop/restart */}
                <div className="flex gap-2">
                    {!isAuctionStopped ? (
                        <button onClick={handleStopAuction}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                            style={{ backgroundColor: 'var(--status-danger)' }}>
                            Stop
                        </button>
                    ) : (
                        <button onClick={handleRestartAuction}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--brand-primary)]">
                            Restart
                        </button>
                    )}
                </div>
            </div>

            {/* ── Error Banner ────────────────────────────────────────────── */}
            {error && (
                <div className="shrink-0 mx-3 mt-2 p-3 rounded-lg border border-red-500 bg-red-950/80 text-red-200 text-sm z-50">
                    {error}
                </div>
            )}

            {/* ── Class Completion Alert ───────────────────────────────────── */}
            {classCompletionAlert && (
                <div className="shrink-0 mx-3 mt-2 p-3 rounded-lg border border-green-500 bg-green-950/80 text-green-200 text-sm">
                    ✓ {classCompletionAlert}
                </div>
            )}

            {/* ── Main scrollable content ──────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-y-auto" style={{ backgroundColor: 'var(--surface-primary)' }}>

                {/* ══ AUCTION TAB ══════════════════════════════════════════ */}
                {activeTab === 'auction' && (
                    <div className="p-3 flex flex-col gap-3">

                        {/* Class selector */}
                        {liveTournament.usePlayerClasses && classStats.length > 0 && (
                            <div className="rounded-xl p-3 border border-[var(--border-primary)]"
                                style={{ backgroundColor: 'var(--surface-secondary)' }}>
                                <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                                    style={{ color: 'var(--text-muted)' }}>Auction Class</p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={handleClearClass}
                                        disabled={selectingClass || !auctionState.currentAuctionClass}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold border disabled:opacity-40"
                                        style={{
                                            backgroundColor: !auctionState.currentAuctionClass ? 'var(--brand-primary)' : 'var(--surface-elevated)',
                                            color: !auctionState.currentAuctionClass ? '#fff' : 'var(--text-secondary)',
                                            borderColor: 'var(--border-primary)',
                                        }}>
                                        All
                                    </button>
                                    {classStats.map(cls => (
                                        <button
                                            key={cls.code}
                                            onClick={() => handleSelectClass(cls.name)}
                                            disabled={selectingClass || cls.isCompleted}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold border disabled:opacity-40 flex items-center gap-1"
                                            style={{
                                                backgroundColor: cls.isActive ? cls.color + '33' : 'var(--surface-elevated)',
                                                color: cls.isActive ? cls.color : 'var(--text-secondary)',
                                                borderColor: cls.isActive ? cls.color : 'var(--border-primary)',
                                            }}>
                                            {cls.icon && <span>{cls.icon}</span>}
                                            {cls.name}
                                            {!cls.isCompleted && (
                                                <span className="ml-1 opacity-70">({cls.remaining})</span>
                                            )}
                                            {cls.isCompleted && <span className="ml-1 text-green-400">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No player selected */}
                        {!currentPlayer && (
                            <div className="rounded-xl p-8 border border-[var(--border-primary)] flex flex-col items-center gap-4"
                                style={{ backgroundColor: 'var(--surface-secondary)' }}>
                                <p className="text-base" style={{ color: 'var(--text-tertiary)' }}>
                                    No player selected
                                </p>
                                <button
                                    onClick={handleSpinWheel}
                                    disabled={isSpinning}
                                    className="px-8 py-4 rounded-xl text-base font-black uppercase tracking-widest disabled:opacity-40 flex items-center gap-2"
                                    style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '2px solid rgba(124,58,237,0.5)' }}>
                                    {isSpinning ? 'Spinning…' : 'Spin'}
                                </button>
                            </div>
                        )}

                        {/* Current player card */}
                        {currentPlayer && (
                            <>
                                {/* Player info */}
                                <div className="rounded-xl border border-[var(--border-primary)] overflow-hidden"
                                    style={{ backgroundColor: 'var(--surface-secondary)' }}>
                                    <div className="flex items-center gap-3 p-3">
                                        <img
                                            src={imageOptimizers.playerCard(currentPlayer.photoURL)}
                                            alt={currentPlayer.name}
                                            className="w-16 h-16 rounded-xl object-cover shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-base truncate" style={{ color: 'var(--brand-primary)' }}>
                                                    {currentPlayer.playerNo ? `#${currentPlayer.playerNo} ` : ''}{currentPlayer.name}
                                                </p>
                                                <ClassBadge tournament={liveTournament} player={currentPlayer} variant="inline" />
                                            </div>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                                {currentPlayer.position || 'Player'} · Base: {getFormattedBasePrice(liveTournament, currentPlayer)}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Bid</p>
                                            <p className="text-3xl font-black" style={{ color: 'var(--brand-secondary)' }}>
                                                {formatCurrency(currentBid)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status strip */}
                                    <div className="px-3 py-2 flex items-center justify-between border-t border-[var(--border-primary)]"
                                        style={{ backgroundColor: 'var(--surface-elevated)' }}>
                                        <span className={`text-xs font-bold tracking-widest uppercase ${
                                            isSold ? 'text-green-400' :
                                            auctionState.currentAuctionStatus === 'Bidding' ? 'text-yellow-400' :
                                            'text-[var(--text-tertiary)]'
                                        }`}>
                                            {isSold ? '✓ Sold' :
                                             auctionState.currentAuctionStatus === 'Bidding' ? 'Bidding Active' :
                                             'Pending'}
                                        </span>
                                        {!isSold && currentBid === 0 && (
                                            <span className="text-xs text-yellow-400">Place a bid to sell</span>
                                        )}
                                        {auctionState.winningTeamId && !isSold && (
                                            <span className="text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>
                                                {teams.find(t => t._id === auctionState.winningTeamId)?.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* ── Team bid buttons (team mode) ─────────── */}
                                {liveTournament.biddingMode === 'team' && (
                                    <div className="rounded-xl border border-[var(--border-primary)] p-3"
                                        style={{ backgroundColor: 'var(--surface-secondary)' }}>
                                        <div className="flex items-center justify-between mb-2.5">
                                            <p className="text-xs font-semibold uppercase tracking-widest"
                                                style={{ color: 'var(--text-muted)' }}>Bid by Team</p>
                                            <div className="text-right">
                                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Next: </span>
                                                <span className="text-sm font-black" style={{ color: 'var(--brand-secondary)' }}>
                                                    {formatCurrency(teamNextBid)}
                                                </span>
                                                <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                                                    +{formatCurrency(teamBidIncrement)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {teams.map(team => {
                                                const maxBid = calcMaxBid(team);
                                                const canAfford = maxBid >= teamNextBid;
                                                const isLeading = biddingTeamId === team._id && currentBid > 0;
                                                const blocked = isSold || isSubmitting || !canAfford;
                                                return (
                                                    <button
                                                        key={team._id}
                                                        disabled={blocked}
                                                        onClick={() => handleTeamBid(team._id)}
                                                        className="flex items-center gap-2.5 p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        style={{
                                                            background: !canAfford ? 'rgba(239,68,68,0.08)' :
                                                                isLeading ? 'rgba(99,102,241,0.18)' : 'var(--surface-elevated)',
                                                            border: !canAfford ? '2px solid rgba(239,68,68,0.45)' :
                                                                isLeading ? '2px solid var(--brand-primary)' : '1.5px solid var(--border-primary)',
                                                        }}>
                                                        <img
                                                            src={imageOptimizers.teamThumbnail(team.logoURL)}
                                                            alt={team.name}
                                                            className="w-10 h-10 rounded-full object-cover shrink-0"
                                                        />
                                                        <div className="flex flex-col items-start min-w-0">
                                                            <p className="font-black text-sm leading-tight truncate w-full"
                                                                style={{ color: isLeading ? 'var(--brand-primary)' : !canAfford ? '#f87171' : 'var(--text-primary)' }}>
                                                                {team.shortCode || team.name}
                                                            </p>
                                                            <p className="text-xs leading-tight"
                                                                style={{ color: !canAfford ? '#f87171' : 'var(--text-tertiary)' }}>
                                                                {!canAfford ? "Can't Bid" : isLeading ? '● Leading' : formatCurrency(maxBid)}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ── Quick Bid (direct mode) ──────────────── */}
                                {liveTournament.biddingMode !== 'team' && directSlabEnabled && (
                                    <div className="rounded-xl border border-[var(--border-primary)] p-3"
                                        style={{ backgroundColor: 'var(--surface-secondary)' }}>
                                        <div className="flex items-center justify-between mb-2.5">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Bid Increase Slab</p>
                                                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Increment: +{formatCurrency(currentSlabIncrement)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Next Bid</p>
                                                <p className="text-xl font-black" style={{ color: 'var(--brand-secondary)' }}>{formatCurrency(nextSlabBid)}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handleBid(nextSlabBid)}
                                                disabled={isSold || isSubmitting}
                                                className="py-4 rounded-xl text-base font-bold transition-all active:scale-95 disabled:opacity-40"
                                                style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1.5px solid rgba(34,197,94,0.45)' }}>
                                                Increase Bid
                                            </button>
                                            <button
                                                onClick={() => handleCorrectBid(previousSlabBid)}
                                                disabled={isSold || isSubmitting || currentBid <= basePrice}
                                                className="py-4 rounded-xl text-base font-bold transition-all active:scale-95 disabled:opacity-40"
                                                style={{ backgroundColor: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1.5px solid rgba(251,146,60,0.45)' }}>
                                                Decrease Bid
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {liveTournament.biddingMode !== 'team' && !directSlabEnabled && (
                                    <div className="rounded-xl border border-[var(--border-primary)] p-3"
                                        style={{ backgroundColor: 'var(--surface-secondary)' }}>
                                        <p className="text-xs font-semibold uppercase tracking-widest mb-2.5"
                                            style={{ color: 'var(--text-muted)' }}>Quick Bid</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {quickBidIncrements.map(inc => (
                                                <button
                                                    key={inc}
                                                    onClick={() => handleQuickBid(inc)}
                                                    disabled={isSold || isSubmitting}
                                                    className="py-4 rounded-xl text-base font-bold transition-all active:scale-95 disabled:opacity-40"
                                                    style={{
                                                        border: '1.5px solid var(--brand-primary)',
                                                        color: 'var(--brand-primary)',
                                                        backgroundColor: 'transparent',
                                                    }}>
                                                    +{inc >= 1000 ? `${inc / 1000}K` : inc}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── Custom Bid ──────────────────────────── */}
                                <div className="rounded-xl border border-[var(--border-primary)] p-3"
                                    style={{ backgroundColor: 'var(--surface-secondary)' }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold uppercase tracking-widest"
                                            style={{ color: isCorrection ? '#fb923c' : 'var(--text-muted)' }}>
                                            {isCorrection ? 'Correct Bid' : 'Custom Bid'}
                                        </p>
                                        {isCorrection && (
                                            <p className="text-xs font-semibold text-orange-400">↓ Lower than current</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="number"
                                            value={bidAmount || ''}
                                            onChange={e => setBidAmount(parseInt(e.target.value, 10) || 0)}
                                            disabled={isSold || isSubmitting}
                                            placeholder="Enter amount"
                                            className="w-full rounded-xl px-4 py-3 text-base font-semibold outline-none disabled:opacity-50"
                                            style={{
                                                backgroundColor: 'var(--surface-elevated)',
                                                color: 'var(--text-primary)',
                                                border: `1.5px solid ${isCorrection ? '#fb923c' : 'var(--border-primary)'}`,
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                const teamId = liveTournament.biddingMode === 'team' ? biddingTeamId || undefined : undefined;
                                                if (isCorrection) handleCorrectBid(bidAmount, teamId);
                                                else handleBid(bidAmount, teamId);
                                            }}
                                            disabled={isSold || isSubmitting || bidAmount <= 0}
                                            className="w-full py-3 rounded-xl font-bold text-base disabled:opacity-50"
                                            style={{
                                                backgroundColor: isCorrection ? 'rgba(251,146,60,0.15)' : 'var(--surface-elevated)',
                                                color: isCorrection ? '#fb923c' : 'var(--brand-primary)',
                                                border: `1.5px solid ${isCorrection ? '#fb923c' : 'var(--brand-primary)'}`,
                                            }}>
                                            {isSubmitting ? '…' : isCorrection ? 'Fix Bid' : 'Set Bid'}
                                        </button>
                                    </div>
                                    {liveTournament.biddingMode === 'team' && biddingTeamId && (
                                        <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                                            Team: {teams.find(t => t._id === biddingTeamId)?.name ?? '—'}
                                        </p>
                                    )}
                                </div>

                                {/* ── Finalize ────────────────────────────── */}
                                <div className="rounded-xl border border-[var(--border-primary)] p-3 flex flex-col gap-2.5"
                                    style={{ backgroundColor: 'var(--surface-secondary)' }}>
                                    <p className="text-xs font-semibold uppercase tracking-widest"
                                        style={{ color: 'var(--text-muted)' }}>Finalize</p>

                                    {/* Winning team selector */}
                                    <select
                                        value={biddingTeamId}
                                        onChange={e => setBiddingTeamId(e.target.value)}
                                        disabled={isSold || currentBid === 0}
                                        className="w-full border rounded-xl px-4 py-3 text-base font-semibold disabled:opacity-40"
                                        style={{
                                            backgroundColor: 'var(--surface-card)',
                                            color: 'var(--text-primary)',
                                            borderColor: 'var(--border-primary)',
                                        }}>
                                        <option value="">— Select Winning Team —</option>
                                        {teams.map(t => (
                                            <option key={t._id} value={t._id}
                                                style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-primary)' }}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Sell — full width primary action */}
                                    <button
                                        onClick={handleSell}
                                        disabled={isSold || currentBid === 0 || !biddingTeamId || isSubmitting || undoPending}
                                        className="w-full py-4 rounded-xl text-base font-black tracking-widest uppercase transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{
                                            background: isSold || currentBid === 0 || !biddingTeamId
                                                ? 'rgba(34,197,94,0.15)'
                                                : 'linear-gradient(135deg,#16a34a,#15803d)',
                                            color: '#fff',
                                            border: '2px solid #16a34a',
                                            boxShadow: isSold || currentBid === 0 || !biddingTeamId ? 'none' : '0 0 20px rgba(22,163,74,0.35)',
                                        }}>
                                        {isSold ? '✓ Sold' : 'SELL'}
                                    </button>

                                    {/* Secondary actions */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={handleReset}
                                            disabled={isSold}
                                            className="py-3.5 rounded-xl text-sm font-bold uppercase disabled:opacity-40"
                                            style={{ background: 'rgba(220,38,38,0.1)', color: '#f87171', border: '1.5px solid rgba(220,38,38,0.4)' }}>
                                            Reset
                                        </button>
                                        <button
                                            onClick={handleMarkUnsold}
                                            disabled={isSold}
                                            className="py-3.5 rounded-xl text-sm font-bold uppercase disabled:opacity-40"
                                            style={{ background: 'rgba(251,146,60,0.1)', color: '#fb923c', border: '1.5px solid rgba(251,146,60,0.35)' }}>
                                            Unsold
                                        </button>
                                        <button
                                            onClick={handleSpinWheel}
                                            disabled={isSpinning || isAuctioning}
                                            className="py-3.5 rounded-xl text-sm font-bold uppercase disabled:opacity-40"
                                            style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1.5px solid rgba(124,58,237,0.35)' }}>
                                            {isSpinning ? '…' : 'Spin'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ══ AVAILABLE TAB ════════════════════════════════════════ */}
                {activeTab === 'available' && (
                    <div className="p-3 flex flex-col gap-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                                Available Players
                                <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                                    ({displayedPlayers.length})
                                </span>
                            </p>
                            {unsoldPlayers.length > 0 && (
                                <button
                                    onClick={() => setShowReAuctionConfirm(true)}
                                    disabled={isAuctioning || reAuctioning}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                                    style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1.5px solid rgba(251,146,60,0.4)' }}>
                                    Re-Auction ({unsoldPlayers.length})
                                </button>
                            )}
                        </div>

                        {/* Search */}
                        <input
                            type="text"
                            value={playerSearch}
                            onChange={e => setPlayerSearch(e.target.value)}
                            placeholder="Search players…"
                            className="w-full rounded-xl px-4 py-3 text-base outline-none"
                            style={{
                                backgroundColor: 'var(--surface-elevated)',
                                color: 'var(--text-primary)',
                                border: '1.5px solid var(--border-primary)',
                            }}
                        />

                        {/* Active auction warning */}
                        {isAuctioning && (
                            <div className="p-3 rounded-xl text-xs font-semibold text-yellow-300 border border-yellow-600/40"
                                style={{ backgroundColor: 'rgba(234,179,8,0.08)' }}>
                                Reset or complete the current auction before selecting a new player.
                            </div>
                        )}

                        {/* Player list */}
                        {displayedPlayers.length === 0 ? (
                            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                                {playerSearch ? 'No players match your search' : 'No available players'}
                            </p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {displayedPlayers.map((player: Player) => (
                                    <div key={player._id}
                                        className="flex items-center gap-3 p-3 rounded-xl border"
                                        style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-primary)' }}>
                                        <img
                                            src={imageOptimizers.playerThumbnail(player.photoURL)}
                                            alt={player.name}
                                            className="w-12 h-12 rounded-full object-cover shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {player.playerNo && (
                                                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                                                        #{player.playerNo}
                                                    </span>
                                                )}
                                                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                                    {player.name}
                                                </p>
                                                <ClassBadge tournament={liveTournament} player={player} variant="dot" />
                                            </div>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                                {player.position || '—'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleSelectPlayer(player._id)}
                                            disabled={isAuctioning || player._id === currentPlayer?._id}
                                            className="px-4 py-2.5 rounded-xl text-sm font-bold shrink-0 disabled:opacity-40"
                                            style={{
                                                backgroundColor: player._id === currentPlayer?._id ? 'rgba(99,102,241,0.12)' : 'var(--brand-primary)',
                                                color: '#fff',
                                            }}>
                                            {player._id === currentPlayer?._id ? 'Live' : 'Auction'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ══ TEAMS TAB ════════════════════════════════════════════ */}
                {activeTab === 'teams' && (
                    <div className="p-3 flex flex-col gap-3">
                        {/* Teams */}
                        <div className="rounded-xl border border-[var(--border-primary)]"
                            style={{ backgroundColor: 'var(--surface-secondary)' }}>
                            <div className="px-4 py-3 border-b border-[var(--border-primary)]">
                                <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Teams</p>
                            </div>
                            {teams.length === 0 ? (
                                <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>No teams</p>
                            ) : (
                                <div className="divide-y divide-[var(--border-primary)]">
                                    {teams.map(team => {
                                        const isWinning = auctionState.winningTeamId === team._id && currentBid > 0;
                                        const maxBid = calcMaxBid(team);
                                        const purchasedCount = players.filter(p => p.isSold && p.winningTeamId === team._id).length;
                                        return (
                                            <div key={team._id} className="flex items-center gap-3 px-4 py-3"
                                                style={{ borderLeft: isWinning ? '3px solid var(--brand-primary)' : '3px solid transparent' }}>
                                                <img
                                                    src={imageOptimizers.teamThumbnail(team.logoURL)}
                                                    alt={team.name}
                                                    className="w-10 h-10 rounded-full object-cover shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{team.name}</p>
                                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                                        Budget: {formatCurrency(team.currentBalance ?? 0)} · {purchasedCount}/{liveTournament.squadSize} players
                                                    </p>
                                                </div>
                                                {isWinning && (
                                                    <span className="text-xs font-bold text-[var(--brand-primary)] shrink-0">● LEADING</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Results */}
                        <div className="rounded-xl border border-[var(--border-primary)]"
                            style={{ backgroundColor: 'var(--surface-secondary)' }}>
                            <div className="px-4 py-3 border-b border-[var(--border-primary)] flex items-center justify-between">
                                <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                                    Results <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                                        ({soldPlayers.length + unsoldPlayers.length})
                                    </span>
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUndo}
                                        disabled={soldPlayers.length + unsoldPlayers.length === 0 || undoPending || isSubmitting}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                                        style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1.5px solid rgba(99,102,241,0.35)' }}>
                                        {undoPending ? 'Undoing…' : 'Undo'}
                                    </button>
                                    <button
                                        onClick={handleCleanupAll}
                                        disabled={soldPlayers.length + unsoldPlayers.length === 0}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                                        style={{ background: 'rgba(220,38,38,0.08)', color: '#f87171', border: '1.5px solid rgba(220,38,38,0.35)' }}>
                                        Clear
                                    </button>
                                </div>
                            </div>
                            {soldPlayers.length + unsoldPlayers.length === 0 ? (
                                <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>No results yet</p>
                            ) : (
                                <div className="divide-y divide-[var(--border-primary)]">
                                    {soldPlayers.map((player: Player) => {
                                        const team = teams.find(t => t._id === player.winningTeamId);
                                        return (
                                            <div key={player._id} className="flex items-center gap-3 px-4 py-3">
                                                <img
                                                    src={imageOptimizers.playerThumbnail(player.photoURL)}
                                                    alt={player.name}
                                                    className="w-10 h-10 rounded-full object-cover shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{player.name}</p>
                                                        <ClassBadge tournament={liveTournament} player={player} variant="dot" />
                                                    </div>
                                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                                        {team?.name ?? '—'}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-black shrink-0" style={{ color: 'var(--brand-secondary)' }}>
                                                    {formatCurrency(player.finalPrice ?? 0)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                    {unsoldPlayers.map((player: Player) => (
                                        <div key={player._id} className="flex items-center gap-3 px-4 py-3 opacity-60">
                                            <img
                                                src={imageOptimizers.playerThumbnail(player.photoURL)}
                                                alt={player.name}
                                                className="w-10 h-10 rounded-full object-cover shrink-0 grayscale"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{player.name}</p>
                                                <p className="text-xs mt-0.5 text-red-400">Unsold</p>
                                            </div>
                                            <span className="text-xs font-bold text-red-400 shrink-0">UNSOLD</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Bottom Tab Navigation ────────────────────────────────────── */}
            <div className="shrink-0 grid grid-cols-3 z-10"
                style={{ backgroundColor: 'var(--surface-secondary)', borderTop: '1px solid var(--border-primary)' }}>
                {([
                    {
                        key: 'auction', label: 'Live Auction',
                        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M14.5 2.5l7 7-10 10H5v-6.5l9.5-10.5z" /><path d="M14 7l3 3" />
                        </svg>,
                    },
                    {
                        key: 'available', label: 'Players',
                        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 10-16 0" />
                        </svg>,
                    },
                    {
                        key: 'teams', label: 'Teams',
                        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                        </svg>,
                    },
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className="flex flex-col items-center gap-1 pt-3 pb-2.5 transition-colors"
                        style={{
                            color: activeTab === tab.key ? 'var(--brand-primary)' : 'var(--text-secondary)',
                            borderTop: activeTab === tab.key ? '2px solid var(--brand-primary)' : '2px solid transparent',
                        }}>
                        {tab.icon}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Re-auction Modal ─────────────────────────────────────────── */}
            <Modal isOpen={showReAuctionConfirm} onClose={() => setShowReAuctionConfirm(false)} title="Re-auction Unsold Players?" size="sm">
                <p className="text-sm mt-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
                    This will move all {unsoldPlayers.length} unsold player{unsoldPlayers.length !== 1 ? 's' : ''} back to Available.
                </p>
                <div className="flex gap-3">
                    <button onClick={handleReAuction} disabled={reAuctioning}
                        className="flex-1 py-3 rounded-xl text-white font-bold disabled:opacity-50"
                        style={{ backgroundColor: 'var(--brand-primary)' }}>
                        {reAuctioning ? 'Processing…' : 'Yes, Re-auction'}
                    </button>
                    <button onClick={() => setShowReAuctionConfirm(false)}
                        className="flex-1 py-3 rounded-xl border font-bold"
                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                        Cancel
                    </button>
                </div>
            </Modal>
        </div>
    );
}
