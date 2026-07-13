'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ClearAllButton from './shared/ClearAllButton';
import { Player, Team, Tournament, AuctionState } from '@/types';
import { usePusherAuction } from '@/hooks/usePusherAuction';
import { imageOptimizers } from '@/lib/imageOptimization';
import ClassBadge from '@/components/shared/ClassBadge';
import { getFormattedBasePrice, getClassBasePrice, getMinClassBasePrice } from '@/lib/playerClassUtils';
import { getBidIncrement, getNextTeamBid, getPreviousSlabBid } from '@/lib/bidIncrementUtils';
import { getAuthHeaders } from '@/lib/api-client';
import { useTournamentContext } from '@/contexts/TournamentContext';
import { useAuth } from '@/contexts/AuthContext';
import TournamentSelector from './TournamentSelector';
import Modal from './Modal';
import QuickBidEditorModal from './QuickBidEditorModal';
import OverlayControlsPanel from './overlay-controls/OverlayControlsPanel';
import type { DisplayMode } from './overlay-controls/types';
import { normalizeOverlayControlSettings } from '@/lib/overlays/overlayControlSettings';
import { WHEEL_SPIN_DURATION_MS, WHEEL_WINNER_HOLD_MS } from '@/lib/wheelSpinTiming';
import AuctionWorkspaceLayout from '@/components/auction/AuctionWorkspaceLayout';
import AuctionHeaderBar from '@/components/auction/AuctionHeaderBar';
import { useAuctionLayoutMode, isTabLayoutMode } from '@/components/auction/useAuctionLayoutMode';
import {
    DEFAULT_SECTION_VISIBILITY,
    DEFAULT_LAYOUT_PREFERENCE,
    AUCTION_TAB_STORAGE_KEY,
    AUCTION_SECTIONS_STORAGE_KEY,
    AUCTION_LAYOUT_PREF_STORAGE_KEY,
    type AuctionWorkspaceTab,
    type AuctionSectionVisibility,
    type AuctionSectionKey,
    type AuctionWorkspaceLayoutPreference,
} from '@/components/auction/types';

const formatCurrency = (amount: number) => amount.toLocaleString();
const MemoOverlayControlsPanel = React.memo(OverlayControlsPanel);

export interface ClassStat {
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

export const ClassManagerPanel: React.FC<{
    classStats: ClassStat[];
    onSelectClass: (code: string) => void;
    onClearClass: () => void;
    selectingClass: boolean;
}> = ({ classStats, onSelectClass, onClearClass, selectingClass }) => {
    const activeClass = classStats.find(c => c.isActive);
    // Only show classes that still have available players
    const availableClasses = classStats.filter(c => !c.isCompleted && c.remaining > 0);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === '') onClearClass();
        else onSelectClass(val);
    };

    return (
        <div className="rounded-lg px-3 py-2 border border-[var(--border-primary)] shrink-0 flex items-center gap-2" style={{ backgroundColor: 'var(--surface-secondary)' }}>
            <label className="text-xs font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>
                Auction Class:
            </label>
            <select
                value={activeClass?.name ?? ''}
                onChange={handleChange}
                disabled={selectingClass}
                className="flex-1 text-xs rounded-md px-2 py-1.5 font-semibold transition-all disabled:opacity-50"
                style={{
                    backgroundColor: activeClass ? `${activeClass.color}22` : 'var(--surface-elevated)',
                    color: activeClass ? activeClass.color : 'var(--text-primary)',
                    border: activeClass ? `1.5px solid ${activeClass.color}` : '1px solid var(--border-primary)',
                    outline: 'none',
                    cursor: 'pointer',
                }}
            >
                <option value="">All Classes</option>
                {availableClasses.map(cls => (
                    <option key={cls.name} value={cls.name}>
                        {cls.icon ? `${cls.icon} ` : ''}{cls.name} ({cls.remaining} left)
                    </option>
                ))}
            </select>
        </div>
    );
};

const MemoClassManagerPanel = React.memo(ClassManagerPanel);

export const AvailablePlayersPanel: React.FC<{
    players: Player[];
    tournament: Tournament | null;
    onSelectPlayer: (id: string) => void;
    isAuctioning: boolean;
    currentPlayerId?: string;
    onReAuction: () => void;
    reAuctioning: boolean;
    activeClass: string | null;
    classManager?: React.ReactNode;
}> = ({ players, tournament, onSelectPlayer, isAuctioning, currentPlayerId, onReAuction, reAuctioning, activeClass, classManager }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const unsoldCount = players.filter(p => p.isUnsold).length;
    const availablePlayers = players
        .filter(p => !p.isSold && !p.isUnsold && p._id !== currentPlayerId)
        .filter(p => !activeClass || p.playerClass === activeClass)
        .sort((a, b) => a._id.localeCompare(b._id))
        .filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.playerNo && p.playerNo.toLowerCase().includes(searchTerm.toLowerCase()))
        );

    return (
        <div className="rounded-lg p-4 flex flex-col h-full border border-[var(--border-primary)]" style={{ backgroundColor: 'var(--surface-secondary)' }}>
            {classManager && (
                <div className="mb-3 pb-3 border-b border-[var(--border-primary)] min-w-0">
                    {classManager}
                </div>
            )}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">Available Players</h3>
                    </div>
                    {activeClass && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Filtered by active class</p>
                    )}
                </div>
                {unsoldCount > 0 && (
                    <button
                        onClick={onReAuction}
                        disabled={isAuctioning || reAuctioning}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#D97706', color: '#fff' }}
                        title={`Move ${unsoldCount} unsold player(s) back to available`}
                    >
                        {reAuctioning ? 'Processing…' : `Re-Auction (${unsoldCount} Unsold)`}
                    </button>
                )}
            </div>
            {isAuctioning && (
                <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 text-xs rounded-md p-2 mb-3">
                    Please reset or complete the current auction to start a new one.
                </div>
            )}
            <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full border border-[var(--border-primary)] rounded-md px-3 py-2 mb-3 focus:ring-brand-primary focus:border-brand-primary"
                style={{ backgroundColor: 'var(--surface-elevated)' }}
            />
            <div className="flex-grow overflow-y-auto pr-2">
                <ul className="space-y-2">
                      {availablePlayers.map((player, index) => (
                          <li key={player._id} className="flex items-center justify-between p-2 rounded-md transition-colors hover:opacity-90 border border-[var(--border-primary)]" style={{ backgroundColor: 'var(--surface-card)' }}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-[var(--brand-primary)]">
                                        {player.playerNo && (
                                            <span className="text-xs font-mono text-[var(--text-tertiary)] mr-1">#{player.playerNo}</span>
                                        )}
                                        {player.name}
                                    </p>
                                    <ClassBadge tournament={tournament} player={player} variant="dot" />
                                </div>
                                <p className="text-xs text-[var(--text-tertiary)]">{player.position || 'Player'}</p>
                            </div>
                            <button
                                onClick={() => onSelectPlayer(player._id)}
                                disabled={isAuctioning}
                                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/80 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: isAuctioning ? undefined : 'var(--brand-primary)' }}>
                                Auction
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const MemoAvailablePlayersPanel = React.memo(AvailablePlayersPanel);

// ─── Team Bidding Panel ──────────────────────────────────────────────────────
const TeamBiddingPanel: React.FC<{
    teams: Team[];
    players: Player[];
    tournament: Tournament;
    auctionState: any;
    currentPlayer: Player | undefined;
    biddingTeamId: string;
    setBiddingTeamId: (id: string) => void;
    onBid: (amount: number, teamId: string) => void;
    isSold: boolean;
    isMobile?: boolean;
    isInFlight?: boolean;
}> = ({ teams, players, tournament, auctionState, currentPlayer, biddingTeamId, setBiddingTeamId, onBid, isSold, isMobile, isInFlight = false }) => {
    const { currentBid } = auctionState;
    const basePrice = getClassBasePrice(tournament, currentPlayer ?? null);
    const increments = tournament.bidIncrements ?? [];
    const nextBidAmount = getNextTeamBid(increments, currentBid, basePrice);
    const increment = currentBid === 0 ? basePrice : getBidIncrement(increments, currentBid);

    // Count actual players in squad (sold + iconic) — more accurate than playersPurchased
    const calcMaxBid = (team: Team): number => {
        if (!tournament || team.currentBalance == null) return 0;
        const squadSize = tournament.squadSize;
        const minBase = getMinClassBasePrice(tournament);
        const purchased = players.filter(p => p.isSold && p.winningTeamId === team._id).length;
        const remaining = squadSize - purchased;
        if (remaining <= 1) return team.currentBalance;
        const reserved = (remaining - 1) * minBase;
        return Math.max(0, team.currentBalance - reserved);
    };

    return (
        <div className="space-y-2 shrink-0">
            {/* Next bid summary bar */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg" style={{ background: 'var(--surface-elevated)' }}>
                <div>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">Next Bid</p>
                    <p className="text-xl font-black" style={{ color: 'var(--brand-secondary)' }}>{nextBidAmount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">Increment</p>
                    <p className="text-base font-bold" style={{ color: 'var(--brand-primary)' }}>+{increment.toLocaleString()}</p>
                </div>
            </div>

            {/* Compact team buttons */}
            <div className={`grid gap-1.5 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                {teams.map(team => {
                    const maxBid = calcMaxBid(team);
                    const canAfford = maxBid >= nextBidAmount;
                    const isLeading = biddingTeamId === team._id && currentBid > 0;
                    const blocked = isSold || isInFlight || !canAfford;

                    return (
                        <button
                            key={team._id}
                            disabled={blocked}
                            onClick={() => {
                                if (blocked) return;
                                setBiddingTeamId(team._id);
                                onBid(nextBidAmount, team._id);
                            }}
                            className={`flex flex-row items-center gap-1.5 rounded-lg transition-all ${isMobile ? 'py-3 px-3' : 'py-2 px-2'}`}
                            style={{
                                background: !canAfford
                                    ? 'rgba(239,68,68,0.08)'
                                    : isLeading
                                    ? 'rgba(var(--brand-primary-rgb, 99,102,241),0.18)'
                                    : 'var(--surface-elevated)',
                                border: !canAfford
                                    ? '2px solid rgba(239,68,68,0.45)'
                                    : isLeading
                                    ? '2px solid var(--brand-primary)'
                                    : '1.5px solid var(--border-primary)',
                                opacity: (isSold || isInFlight) ? 0.55 : 1,
                                cursor: blocked ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <img
                                src={imageOptimizers.teamThumbnail(team.logoURL)}
                                alt={team.name}
                                className={`rounded-full object-cover shrink-0 ${isMobile ? 'w-11 h-11' : 'w-9 h-9'}`}
                                loading="lazy"
                            />
                            <div className="flex flex-col items-start min-w-0">
                                <p className="font-black text-base leading-tight truncate w-full"
                                   style={{ color: isLeading ? 'var(--brand-primary)' : !canAfford ? '#f87171' : 'var(--text-primary)' }}>
                                    {team.shortCode || team.name}
                                </p>
                                <p className="text-sm leading-tight" style={{ color: !canAfford ? '#f87171' : 'var(--text-tertiary)' }}>
                                    {!canAfford ? 'Can\'t Bid' : isLeading ? '● LEADING' : maxBid.toLocaleString()}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const MemoTeamBiddingPanel = React.memo(TeamBiddingPanel);

export const CurrentAuctionPanel: React.FC<{
    currentPlayer: Player | undefined;
    tournament: Tournament | null;
    teams: Team[];
    players: Player[];
    biddingTeamId: string;
    setBiddingTeamId: (id: string) => void;
    auctionState: any;
    onBid: (amount: number, teamId?: string) => void;
    onCorrectBid: (amount: number, teamId?: string) => void;
    onSell: () => void;
    onReset: () => void;
    onMarkUnsold: () => void;
    onSpinWheel: () => void;
    isSpinning: boolean;
    isMobile?: boolean;
    isInFlight?: boolean;
    stickyPlayerHeader?: boolean;
}> = ({ currentPlayer, tournament, teams, players, biddingTeamId, setBiddingTeamId, auctionState, onBid, onCorrectBid, onSell, onReset, onMarkUnsold, onSpinWheel, isSpinning, isMobile, isInFlight = false, stickyPlayerHeader = false }) => {
    const [bidAmount, setBidAmount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showQuickBidEditor, setShowQuickBidEditor] = useState(false);
    const [localQuickBidAmounts, setLocalQuickBidAmounts] = useState<number[] | null>(null);

    useEffect(() => {
        const base = getClassBasePrice(tournament, currentPlayer ?? null);
        const nextBid = auctionState.currentBid > 0 ? auctionState.currentBid + 1000 : 0;
        setBidAmount(nextBid);
    }, [auctionState.currentBid, currentPlayer, tournament]);

    const handleQuickBid = async (increment: number) => {
        // If no bid yet, start from base price, otherwise add to current bid
        const basePrice = getClassBasePrice(tournament, currentPlayer ?? null);
        const newAmount = auctionState.currentBid > 0 ? auctionState.currentBid + increment : basePrice;

        setIsSubmitting(true);
        try {
            await onBid(newAmount);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentPlayer || !tournament) {
        return (
            <div className="rounded-lg p-4 flex flex-col items-center justify-center gap-4 min-h-[120px] border border-[var(--border-primary)]" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <p className="text-[var(--text-tertiary)] text-lg">{!tournament ? "No tournament data" : "Select a player to start the auction"}</p>
                {tournament && (
                    <button
                        onClick={onSpinWheel}
                        disabled={isSpinning}
                        className="px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                        style={{
                            background: isSpinning ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)',
                            color: isSpinning ? '#c4b5fd' : '#a78bfa',
                            border: `1.5px solid ${isSpinning ? 'rgba(124,58,237,0.6)' : 'rgba(124,58,237,0.35)'}`,
                        }}
                    >
                        {isSpinning ? 'Spinning…' : 'Spin Wheel'}
                        {isSpinning && <span className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-pulse" />}
                    </button>
                )}
            </div>
        );
    }

    const { currentBid, currentAuctionStatus } = auctionState;
    const isSold = currentAuctionStatus === 'Sold';
    const DEFAULT_QUICK_BIDS = [1000, 5000, 10000, 20000, 25000, 50000];
    const basePrice = getClassBasePrice(tournament, currentPlayer ?? null);
    const slabIncrements = tournament.bidIncrements ?? [];
    const directSlabEnabled = tournament.biddingMode === 'direct' && tournament.directBidSlabEnabled;
    const nextSlabBid = currentBid > 0 ? currentBid + getBidIncrement(slabIncrements, currentBid) : basePrice;
    const previousSlabBid = getPreviousSlabBid(slabIncrements, currentBid, basePrice);
    const currentSlabIncrement = currentBid > 0 ? getBidIncrement(slabIncrements, currentBid) : basePrice;
    const quickBidAmounts = localQuickBidAmounts
        ?? ((tournament.directQuickBidsEnabled && tournament.directQuickBids && tournament.directQuickBids.length > 0)
            ? tournament.directQuickBids.map(b => b.amount).filter(a => a > 0)
            : DEFAULT_QUICK_BIDS);
    const isCorrection = currentBid > 0 && bidAmount > 0 && bidAmount < currentBid;
    const statusText = currentAuctionStatus === 'Bidding' ? 'BIDDING ACTIVE' : (isSold ? 'PLAYER SOLD' : 'BIDDING PENDING');
    const statusColor = currentAuctionStatus === 'Bidding' ? 'text-yellow-400' : (isSold ? 'text-green-400' : 'text-[var(--text-tertiary)]');

    return (
        <div className={`rounded-lg border border-[var(--border-primary)] flex flex-col ${isMobile ? 'flex-1 min-h-0 overflow-hidden p-3 gap-2' : 'p-4 gap-3 shrink-0'}`} style={{ backgroundColor: 'var(--surface-secondary)' }}>
            {/* Player info bar */}
            <div className={`flex flex-wrap items-center gap-3 p-3 rounded-lg shrink-0 min-w-0 ${stickyPlayerHeader ? 'sticky top-0 z-10' : ''}`} style={{ backgroundColor: 'var(--surface-elevated)' }}>
                <img
                    src={imageOptimizers.playerCard(currentPlayer.photoURL)}
                    alt={currentPlayer.name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                    loading="lazy"
                />
                <div className="flex-1 min-w-0 basis-48">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[var(--brand-primary)] truncate min-w-0">#{currentPlayer.playerNo || ''} {currentPlayer.name}</p>
                        <ClassBadge tournament={tournament} player={currentPlayer} variant="inline" />
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">{currentPlayer.position || 'Player'} · Base: {getFormattedBasePrice(tournament, currentPlayer)}</p>
                </div>
                <div className="text-right shrink-0 ml-auto">
                    <p className="text-xs text-[var(--text-tertiary)]">Current Bid</p>
                    <p className="text-2xl xl:text-3xl font-bold text-[var(--brand-secondary)]">{formatCurrency(currentBid)}</p>
                </div>
            </div>

            {/* Quick Bid (Direct) or Team Bidding buttons */}
            {tournament.biddingMode === 'team' ? (
                <MemoTeamBiddingPanel
                    teams={teams}
                    players={players}
                    tournament={tournament}
                    auctionState={auctionState}
                    currentPlayer={currentPlayer}
                    biddingTeamId={biddingTeamId}
                    setBiddingTeamId={setBiddingTeamId}
                    onBid={(amount, teamId) => { setBiddingTeamId(teamId); return onBid(amount, teamId); }}
                    isSold={isSold}
                    isMobile={isMobile}
                    isInFlight={isInFlight}
                />
            ) : directSlabEnabled ? (
            <div className="shrink-0 rounded-lg p-3 border border-[var(--border-primary)]" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Bid Increase Slab</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Increment: +{formatCurrency(currentSlabIncrement)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Next Bid</p>
                        <p className="text-xl font-black" style={{ color: 'var(--brand-secondary)' }}>{formatCurrency(nextSlabBid)}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={async () => { setIsSubmitting(true); try { await onBid(nextSlabBid); } finally { setIsSubmitting(false); } }}
                        disabled={isSold || isSubmitting}
                        className="rounded-md py-3 text-sm font-bold transition-colors disabled:opacity-40"
                        style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1.5px solid rgba(34,197,94,0.45)' }}
                    >
                        Increase Bid
                    </button>
                    <button
                        onClick={async () => { setIsSubmitting(true); try { await onCorrectBid(previousSlabBid); } finally { setIsSubmitting(false); } }}
                        disabled={isSold || isSubmitting || currentBid <= basePrice}
                        className="rounded-md py-3 text-sm font-bold transition-colors disabled:opacity-40"
                        style={{ backgroundColor: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1.5px solid rgba(251,146,60,0.45)' }}
                    >
                        Decrease Bid
                    </button>
                </div>
            </div>
            ) : (
            <div className="shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Quick Bid</p>
                    <button
                        onClick={() => setShowQuickBidEditor(true)}
                        title="Customise quick bid amounts"
                        className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
                        style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                    </button>
                </div>
                <div className={`grid gap-1.5 ${isMobile ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'}`}>
                    {quickBidAmounts.map(inc => (
                        <button
                            key={inc}
                            onClick={() => handleQuickBid(inc)}
                            disabled={isSold || isSubmitting}
                            className={`rounded-md font-bold transition-colors disabled:opacity-40 ${isMobile ? 'py-2.5 text-sm' : 'py-3 text-sm'}`}
                            style={{
                                border: '1.5px solid var(--brand-primary)',
                                color: 'var(--brand-primary)',
                                backgroundColor: 'transparent',
                            }}
                            onMouseEnter={e => { if (!isSold && !isSubmitting) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--brand-primary)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; } }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--brand-primary)'; }}
                        >
                            +{inc >= 1000 ? `${inc / 1000}K` : inc}
                        </button>
                    ))}
                </div>
            </div>
            )}

            {showQuickBidEditor && tournament && (
                <QuickBidEditorModal
                    tournamentId={tournament._id}
                    currentAmounts={quickBidAmounts}
                    onSave={(amounts) => setLocalQuickBidAmounts(amounts)}
                    onClose={() => setShowQuickBidEditor(false)}
                />
            )}

            {/* Custom bid row — accepts any amount; auto-routes to correction if lower than current */}
            <div className="shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: isCorrection ? '#FB923C' : 'var(--text-tertiary)' }}>
                        {isCorrection ? 'Correct Bid' : 'Custom Bid'}
                    </p>
                    {isCorrection && (
                        <p className="text-xs font-semibold" style={{ color: '#FB923C' }}>
                            ↓ Lower than current bid
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={bidAmount}
                        onChange={e => setBidAmount(parseInt(e.target.value, 10) || 0)}
                        disabled={isSold || isSubmitting}
                        className={`input-field flex-1 disabled:opacity-50 ${isMobile ? 'text-sm py-2' : 'text-sm py-1.5'}`}
                        placeholder="Enter any amount"
                        style={isCorrection ? { borderColor: '#FB923C', color: '#000000' } : { color: '#000000' }}
                    />
                    <button
                        onClick={() => {
                            const teamId = tournament.biddingMode === 'team' ? biddingTeamId : undefined;
                            isCorrection ? onCorrectBid(bidAmount, teamId) : onBid(bidAmount, teamId);
                        }}
                        disabled={isSold || isSubmitting || bidAmount <= 0}
                        className={`shrink-0 rounded-md font-bold transition-colors disabled:opacity-50 ${isMobile ? 'text-sm px-4 py-2' : 'text-sm px-4 py-1.5'}`}
                        style={{
                            backgroundColor: isCorrection ? 'rgba(251,146,60,0.15)' : 'var(--surface-elevated)',
                            color: isCorrection ? '#FB923C' : 'var(--brand-primary)',
                            border: `1.5px solid ${isCorrection ? '#FB923C' : 'var(--brand-primary)'}`,
                        }}>
                        {isSubmitting ? '...' : isCorrection ? 'Correct' : 'Set'}
                    </button>
                </div>
                {tournament.biddingMode === 'team' && biddingTeamId && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        Team: {teams.find(t => t._id === biddingTeamId)?.name ?? '—'}
                    </p>
                )}
            </div>

            {/* Finalize section */}
            <div className={`border-t border-[var(--border-primary)] flex flex-col gap-2 shrink-0 ${isMobile ? 'pt-2' : 'pt-3'}`}>

                {/* Status */}
                <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold tracking-widest uppercase ${statusColor}`}>{statusText}</p>
                    {!isSold && currentBid === 0 && (
                        <p className="text-xs text-yellow-400">Place a bid to enable Sell</p>
                    )}
                </div>

                {/* Team selector */}
                <select
                    value={biddingTeamId}
                    onChange={e => setBiddingTeamId(e.target.value)}
                    disabled={isSold || currentBid === 0}
                    className={`w-full border rounded-md px-3 font-semibold focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed ${isMobile ? 'py-2 text-sm' : 'py-2 text-sm'}`}
                    style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}>
                    {teams.map(t => (
                        <option key={t._id} value={t._id} style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-primary)' }}>
                            {t.name}
                        </option>
                    ))}
                </select>

                {/* Action buttons */}
                {isMobile ? (
                    <div className="flex flex-col gap-2">
                        {/* Sell — full width, most prominent */}
                        <button
                            onClick={onSell}
                            disabled={isSold || currentBid === 0 || !biddingTeamId}
                            className="w-full py-2.5 rounded-lg text-sm font-black tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                background: isSold || currentBid === 0 || !biddingTeamId
                                    ? 'rgba(34,197,94,0.15)'
                                    : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                color: '#ffffff',
                                border: '2px solid #16a34a',
                                boxShadow: isSold || currentBid === 0 || !biddingTeamId ? 'none' : '0 0 16px rgba(22,163,74,0.35)',
                                letterSpacing: 2,
                            }}>
                            {isSold ? '✓ Sold' : 'Sell'}
                        </button>
                        {/* Reset | Unsold | Spin — secondary row */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={onReset}
                                disabled={isSold}
                                className="py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                    background: 'rgba(220,38,38,0.1)',
                                    color: '#f87171',
                                    border: '1.5px solid rgba(220,38,38,0.4)',
                                }}
                                onMouseEnter={e => { if (!isSold) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.25)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.1)'; }}>
                                Reset
                            </button>
                            <button
                                onClick={onMarkUnsold}
                                disabled={isSold}
                                className="py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                    background: 'rgba(251,146,60,0.1)',
                                    color: '#fb923c',
                                    border: '1.5px solid rgba(251,146,60,0.35)',
                                }}
                                onMouseEnter={e => { if (!isSold) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,146,60,0.25)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,146,60,0.1)'; }}>
                                Unsold
                            </button>
                            <button
                                onClick={onSpinWheel}
                                disabled={isSpinning || auctionState.currentAuctionStatus === 'Bidding'}
                                className="py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                style={{
                                    background: isSpinning ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)',
                                    color: isSpinning ? '#c4b5fd' : '#a78bfa',
                                    border: `1.5px solid ${isSpinning ? 'rgba(124,58,237,0.6)' : 'rgba(124,58,237,0.35)'}`,
                                }}
                                onMouseEnter={e => { if (!isSpinning && auctionState.currentAuctionStatus !== 'Bidding') (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.25)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isSpinning ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)'; }}>
                                {isSpinning ? '…' : 'Spin'}
                                {isSpinning && <span className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-pulse" />}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                            onClick={onSell}
                            disabled={isSold || currentBid === 0 || !biddingTeamId}
                            className="py-3 rounded-lg text-sm font-black tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                background: isSold || currentBid === 0 || !biddingTeamId
                                    ? 'rgba(34,197,94,0.15)'
                                    : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                color: '#ffffff',
                                border: '2px solid #16a34a',
                                boxShadow: isSold || currentBid === 0 || !biddingTeamId ? 'none' : '0 0 16px rgba(22,163,74,0.35)',
                                letterSpacing: 2,
                            }}>
                            {isSold ? '✓ Sold' : 'Sell'}
                        </button>
                        <button
                            onClick={onReset}
                            disabled={isSold}
                            className="py-3 rounded-lg text-sm font-bold tracking-wide uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                background: 'rgba(220,38,38,0.1)',
                                color: '#f87171',
                                border: '1.5px solid rgba(220,38,38,0.4)',
                            }}
                            onMouseEnter={e => { if (!isSold) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.25)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.1)'; }}>
                            Reset
                        </button>
                        <button
                            onClick={onMarkUnsold}
                            disabled={isSold}
                            className="py-3 rounded-lg text-sm font-bold tracking-wide uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                background: 'rgba(251,146,60,0.1)',
                                color: '#fb923c',
                                border: '1.5px solid rgba(251,146,60,0.35)',
                            }}
                            onMouseEnter={e => { if (!isSold) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,146,60,0.25)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,146,60,0.1)'; }}>
                            Unsold
                        </button>
                        <button
                            onClick={onSpinWheel}
                            disabled={isSpinning || auctionState.currentAuctionStatus === 'Bidding'}
                            className="py-3 rounded-lg text-sm font-bold tracking-wide uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                            style={{
                                background: isSpinning ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)',
                                color: isSpinning ? '#c4b5fd' : '#a78bfa',
                                border: `1.5px solid ${isSpinning ? 'rgba(124,58,237,0.6)' : 'rgba(124,58,237,0.35)'}`,
                            }}
                            onMouseEnter={e => { if (!isSpinning && auctionState.currentAuctionStatus !== 'Bidding') (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.25)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isSpinning ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)'; }}>
                            {isSpinning ? 'Spinning…' : 'Spin'}
                            {isSpinning && <span className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-pulse" />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const MemoCurrentAuctionPanel = React.memo(CurrentAuctionPanel);

export const TeamsAndSoldPlayersPanel: React.FC<{
    teams: Team[];
    soldPlayers: Player[];
    unsoldPlayers: Player[];
    tournament: Tournament | null;
    winningTeamId: string | null;
    currentBid: number;
    onUndo: () => void;
    undoPending?: boolean;
    onCleanup: () => void;
    onEditSaved: (player: Player, teams: Team[]) => void;
    showTeams?: boolean;
    showResults?: boolean;
}> = ({ teams, soldPlayers, unsoldPlayers, tournament, winningTeamId, currentBid, onUndo, undoPending = false, onCleanup, onEditSaved, showTeams = true, showResults = true }) => {
    const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
    const [editStatus, setEditStatus] = useState<'sold' | 'unsold' | 'available'>('sold');
    const [editPrice, setEditPrice] = useState('');
    const [editTeamId, setEditTeamId] = useState('');
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    const openEdit = (player: Player) => {
        setEditingPlayerId(player._id);
        setEditStatus(player.isSold ? 'sold' : 'unsold');
        setEditPrice(player.finalPrice ? String(player.finalPrice) : '');
        setEditTeamId(player.winningTeamId ?? '');
        setEditError(null);
    };

    const closeEdit = () => {
        setEditingPlayerId(null);
        setEditError(null);
    };

    const saveEdit = async (player: Player) => {
        if (!tournament) return;
        setSaving(true);
        setEditError(null);
        try {
            const res = await fetch('/api/auction/edit-player-result', {
                method: 'PATCH',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId: tournament._id,
                    playerId: player._id,
                    status: editStatus,
                    finalPrice: editStatus === 'sold' ? Number(editPrice) : undefined,
                    winningTeamId: editStatus === 'sold' ? editTeamId : undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setEditError(data.error || 'Failed to save'); return; }
            // Immediately update local state so UI reflects changes without waiting for Pusher
            if (data.player && data.teams) {
                onEditSaved(data.player as Player, data.teams as Team[]);
            }
            closeEdit();
        } catch {
            setEditError('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const calculateMaxBid = (team: Team) => {
        if (!tournament || team.currentBalance == null) return 0;
        const squadSize = tournament.squadSize;
        const basePrice = getMinClassBasePrice(tournament);
        // Count actual sold players (including iconics) rather than playersPurchased
        const purchased = soldPlayers.filter(p => p.winningTeamId === team._id).length;
        const remainingPlayers = squadSize - purchased;
        if (remainingPlayers <= 1) return team.currentBalance;
        const reservedAmount = (remainingPlayers - 1) * basePrice;
        return Math.max(0, team.currentBalance - reservedAmount);
    };

    const allPlayers = [...soldPlayers, ...unsoldPlayers];

    return (
        <div className="flex flex-col gap-3">
            {showTeams && (
            <div className="rounded-lg p-4 border border-[var(--border-primary)] flex flex-col" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                 <h3 className="font-bold text-base mb-2 shrink-0">Teams</h3>
                 <ul className="space-y-2">
                     {teams.map((team) => {
                         const maxBid = calculateMaxBid(team);
                         const playersPurchased = soldPlayers.filter(p => p.winningTeamId === team._id).length;
                         const squadSize = tournament?.squadSize || 0;
                         const remainingPlayers = squadSize - playersPurchased;
                         const hasInsufficientFunds = maxBid <= 0 && remainingPlayers > 0;
                         const isBidExceeded = currentBid > 0 && currentBid > maxBid;
                         return (
                             <li key={team._id} className={`p-2 rounded-md flex items-center gap-3 relative overflow-hidden transition-all duration-300 hover:opacity-90 border ${isBidExceeded ? 'border-red-500' : 'border-[var(--border-primary)]'}`} style={{
                                 backgroundColor: winningTeamId === team._id ? 'var(--surface-hover)' : isBidExceeded ? 'rgba(239,68,68,0.08)' : 'var(--surface-card)',
                                 boxShadow: isBidExceeded ? '0 0 0 1px rgba(239,68,68,0.4)' : 'none',
                             }}>
                                {winningTeamId === team._id && <div className="absolute left-0 top-0 h-full w-1.5 bg-[var(--accent-color)] animate-pulse"></div>}
                                <img src={imageOptimizers.teamThumbnail(team.logoURL)} alt={team.name} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{team.name}</p>
                                        {hasInsufficientFunds && <span className="text-red-500 text-xs" title="Insufficient funds">⚠️</span>}
                                        {isBidExceeded && <span className="text-red-400 text-xs font-semibold">Over limit</span>}
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)]">Budget: <span className="text-[var(--brand-secondary)]">{formatCurrency(team.currentBalance || 0)}</span></p>
                                    <p className="text-xs text-[var(--text-secondary)]">Max Bid: <span className={hasInsufficientFunds || isBidExceeded ? 'text-red-500 font-semibold' : 'text-[var(--brand-primary)]'}>{formatCurrency(maxBid)}</span></p>
                                    <p className="text-xs text-[var(--text-muted)]">{playersPurchased}/{squadSize} players</p>
                                </div>
                             </li>
                         );
                     })}
                 </ul>
            </div>
            )}
             {showResults && (
             <div className="rounded-lg p-4 border border-[var(--border-primary)] flex flex-col" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <div className="flex items-center justify-between mb-2 shrink-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base">Results</h3>
                    </div>
                    <div className="flex gap-1.5">
                        <button
                            onClick={onUndo}
                            disabled={allPlayers.length === 0 || undoPending}
                            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1.5px solid rgba(99,102,241,0.35)' }}
                            onMouseEnter={e => { if (allPlayers.length > 0) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.25)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.12)'; }}>
                            {undoPending ? 'Undoing…' : 'Undo'}
                        </button>
                        <ClearAllButton onClick={onCleanup} disabled={allPlayers.length === 0} label="Clear" size="sm" />
                    </div>
                </div>
                <div>
                    {allPlayers.length === 0 ? (
                        <p className="text-center text-[var(--text-tertiary)] py-8 text-sm">No sold or unsold players yet</p>
                    ) : (
                        <ul className="space-y-2">
                            {soldPlayers.map((player) => {
                                const playerTeam = teams.find(t => t._id === player.winningTeamId);
                                const isEditing = editingPlayerId === player._id;
                                return (
                                    <li key={player._id} className="rounded-md border border-[var(--border-primary)] overflow-hidden" style={{ backgroundColor: 'var(--surface-card)' }}>
                                        {/* Row */}
                                        <div className="flex items-center gap-2 p-2">
                                            <img src={imageOptimizers.playerThumbnail(player.photoURL)} alt={player.name} className="w-10 h-10 rounded-full object-cover shrink-0" loading="lazy" />
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <ClassBadge tournament={tournament} player={player} variant="dot" />
                                                    <p className="font-semibold text-sm truncate">{player.name}</p>
                                                </div>
                                                <p className="text-xs text-[var(--brand-secondary)]">{formatCurrency(player.finalPrice || 0)}</p>
                                                <p className="text-xs text-[var(--text-secondary)] truncate">{playerTeam ? playerTeam.name : 'Unknown Team'}</p>
                                            </div>
                                            <button
                                                onClick={() => isEditing ? closeEdit() : openEdit(player)}
                                                className="shrink-0 p-1.5 rounded-md transition-all"
                                                style={{ backgroundColor: isEditing ? 'var(--surface-elevated)' : 'transparent', color: 'var(--text-muted)' }}
                                                title="Edit result"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                        </div>
                                        {/* Inline edit form */}
                                        {isEditing && (
                                            <div className="px-3 pb-3 pt-1 border-t border-[var(--border-primary)] space-y-2" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Status</label>
                                                        <select
                                                            value={editStatus}
                                                            onChange={e => setEditStatus(e.target.value as any)}
                                                            className="w-full mt-0.5 text-xs rounded px-2 py-1.5"
                                                            style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', outline: 'none' }}
                                                        >
                                                            <option value="sold">Sold</option>
                                                            <option value="unsold">Unsold</option>
                                                            <option value="available">Available (Reset)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                {editStatus === 'sold' && (
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Amount</label>
                                                            <input
                                                                type="number"
                                                                value={editPrice}
                                                                onChange={e => setEditPrice(e.target.value)}
                                                                placeholder="Final price"
                                                                className="w-full mt-0.5 text-xs rounded px-2 py-1.5"
                                                                style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', outline: 'none' }}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Team</label>
                                                            <select
                                                                value={editTeamId}
                                                                onChange={e => setEditTeamId(e.target.value)}
                                                                className="w-full mt-0.5 text-xs rounded px-2 py-1.5"
                                                                style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', outline: 'none' }}
                                                            >
                                                                <option value="">Select team</option>
                                                                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                                {editError && <p className="text-[10px] text-red-400">{editError}</p>}
                                                <div className="flex gap-2 pt-1">
                                                    <button
                                                        onClick={() => saveEdit(player)}
                                                        disabled={saving || (editStatus === 'sold' && (!editPrice || !editTeamId))}
                                                        className="flex-1 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-50"
                                                        style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
                                                    >
                                                        {saving ? 'Saving…' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={closeEdit}
                                                        className="flex-1 py-1.5 rounded text-xs font-semibold transition-all"
                                                        style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                            {unsoldPlayers.map((player) => {
                                const isEditing = editingPlayerId === player._id;
                                return (
                                    <li key={player._id} className="rounded-md border border-red-900/40 overflow-hidden" style={{ backgroundColor: 'var(--surface-card)' }}>
                                        {/* Row */}
                                        <div className="flex items-center gap-2 p-2">
                                            <img src={imageOptimizers.playerThumbnail(player.photoURL)} alt={player.name} className="w-10 h-10 rounded-full object-cover opacity-60 grayscale shrink-0" loading="lazy" />
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <ClassBadge tournament={tournament} player={player} variant="dot" />
                                                    <p className="font-semibold text-sm truncate text-[var(--text-secondary)]">{player.name}</p>
                                                </div>
                                                <p className="text-xs font-bold text-red-400">UNSOLD</p>
                                            </div>
                                            <button
                                                onClick={() => isEditing ? closeEdit() : openEdit(player)}
                                                className="shrink-0 p-1.5 rounded-md transition-all"
                                                style={{ backgroundColor: isEditing ? 'var(--surface-elevated)' : 'transparent', color: 'var(--text-muted)' }}
                                                title="Edit result"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                        </div>
                                        {/* Inline edit form */}
                                        {isEditing && (
                                            <div className="px-3 pb-3 pt-1 border-t border-red-900/40 space-y-2" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Status</label>
                                                        <select
                                                            value={editStatus}
                                                            onChange={e => setEditStatus(e.target.value as any)}
                                                            className="w-full mt-0.5 text-xs rounded px-2 py-1.5"
                                                            style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', outline: 'none' }}
                                                        >
                                                            <option value="unsold">Unsold</option>
                                                            <option value="sold">Sold</option>
                                                            <option value="available">Available (Reset)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                {editStatus === 'sold' && (
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Amount</label>
                                                            <input
                                                                type="number"
                                                                value={editPrice}
                                                                onChange={e => setEditPrice(e.target.value)}
                                                                placeholder="Final price"
                                                                className="w-full mt-0.5 text-xs rounded px-2 py-1.5"
                                                                style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', outline: 'none' }}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Team</label>
                                                            <select
                                                                value={editTeamId}
                                                                onChange={e => setEditTeamId(e.target.value)}
                                                                className="w-full mt-0.5 text-xs rounded px-2 py-1.5"
                                                                style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', outline: 'none' }}
                                                            >
                                                                <option value="">Select team</option>
                                                                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                                {editError && <p className="text-[10px] text-red-400">{editError}</p>}
                                                <div className="flex gap-2 pt-1">
                                                    <button
                                                        onClick={() => saveEdit(player)}
                                                        disabled={saving || (editStatus === 'sold' && (!editPrice || !editTeamId))}
                                                        className="flex-1 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-50"
                                                        style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
                                                    >
                                                        {saving ? 'Saving…' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={closeEdit}
                                                        className="flex-1 py-1.5 rounded text-xs font-semibold transition-all"
                                                        style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
             </div>
             )}
        </div>
    );
};

const MemoTeamsAndSoldPlayersPanel = React.memo(TeamsAndSoldPlayersPanel);


interface AuctionControlPanelProps {
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

const AuctionControlPanel: React.FC<AuctionControlPanelProps> = ({ initialData, stats }) => {
    const [biddingTeamId, setBiddingTeamId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const initialTournamentId = initialData?.tournament?._id ?? null;
    const [liveTournamentId, setLiveTournamentId] = useState<string | null>(initialTournamentId);

    const { user } = useAuth();
    const {
        selectedTournamentId,
        setSelectedTournamentId,
        selectedTournament,
        tournaments,
        loading: tournamentsLoading,
        refreshTournaments,
    } = useTournamentContext();

    const [preAuctionStats, setPreAuctionStats] = useState({ players: 0, teams: 0, sold: 0 });
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
    const [completingTournament, setCompletingTournament] = useState(false);
    const [reactivatingTournament, setReactivatingTournament] = useState(false);
    const [showReAuctionConfirm, setShowReAuctionConfirm] = useState(false);
    const [reAuctioning, setReAuctioning] = useState(false);

    // Class-wise auction management
    const [selectingClass, setSelectingClass] = useState(false);
    const layoutMode = useAuctionLayoutMode();
    const [layoutPreference, setLayoutPreference] = useState<AuctionWorkspaceLayoutPreference>(() => {
        if (typeof window === 'undefined') return DEFAULT_LAYOUT_PREFERENCE;
        const saved = localStorage.getItem(AUCTION_LAYOUT_PREF_STORAGE_KEY);
        return saved === 'tabs' || saved === 'panels' ? saved : DEFAULT_LAYOUT_PREFERENCE;
    });
    const useTabs = isTabLayoutMode(layoutMode) && layoutPreference === 'tabs';

    const [activeTab, setActiveTab] = useState<AuctionWorkspaceTab>(() => {
        if (typeof window === 'undefined') return 'auction';
        const saved = localStorage.getItem(AUCTION_TAB_STORAGE_KEY);
        if (saved === 'overlay') return 'auction';
        if (saved === 'auction' || saved === 'available' || saved === 'teams' || saved === 'results') return saved;
        return 'auction';
    });

    const [sectionVisibility, setSectionVisibility] = useState<AuctionSectionVisibility>(() => {
        if (typeof window === 'undefined') return DEFAULT_SECTION_VISIBILITY;
        try {
            const saved = localStorage.getItem(AUCTION_SECTIONS_STORAGE_KEY);
            if (saved) return { ...DEFAULT_SECTION_VISIBILITY, ...JSON.parse(saved) };
        } catch { /* ignore invalid stored value */ }
        return DEFAULT_SECTION_VISIBILITY;
    });

    const toggleSection = useCallback((key: AuctionSectionKey) => {
        setSectionVisibility(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    useEffect(() => { localStorage.setItem(AUCTION_TAB_STORAGE_KEY, activeTab); }, [activeTab]);
    useEffect(() => { localStorage.setItem(AUCTION_SECTIONS_STORAGE_KEY, JSON.stringify(sectionVisibility)); }, [sectionVisibility]);
    useEffect(() => { localStorage.setItem(AUCTION_LAYOUT_PREF_STORAGE_KEY, layoutPreference); }, [layoutPreference]);

    // Overlay control panel settings
    const [overlaySize, setOverlaySize] = useState<'large' | 'small'>('large');
    const [tickerMode, setTickerMode] = useState<'all' | 'sold' | 'available'>('all');
    const [displayMode, setDisplayMode] = useState<DisplayMode>('standard');
    const [teamWiseTeamId, setTeamWiseTeamId] = useState<string | null>(null);
    const teamWiseTeamIdRef = useRef<string | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const spinInFlightRef = useRef(false);
    const spinTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const bidInFlightRef = useRef(false);
    const [bidInFlight, setBidInFlight] = useState(false);
    const bidSequenceRef = useRef(0);
    const sellInFlightRef = useRef(false);
    const undoInFlightRef = useRef(false);
    const selectPlayerInFlightRef = useRef(false);
    const [undoPending, setUndoPending] = useState(false);
    const [hidePremiumCard, setHidePremiumCard] = useState(false);
    const [autoSwitch, setAutoSwitch] = useState(false);
    const [autoSwitchDuration, setAutoSwitchDuration] = useState(5);
    const autoSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [customTickerLine1, setCustomTickerLine1] = useState(() =>
        typeof window !== 'undefined' ? (localStorage.getItem('customTickerLine1') ?? '') : ''
    );
    const [customTickerLine2, setCustomTickerLine2] = useState(() =>
        typeof window !== 'undefined' ? (localStorage.getItem('customTickerLine2') ?? '') : ''
    );
    const [showTickerModal, setShowTickerModal] = useState(false);
    const [soldMessagePosition, setSoldMessagePosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
    const [hideTickerCustom, setHideTickerCustom] = useState(false);
    const [hideTickerFullscreen, setHideTickerFullscreen] = useState(false);
    const [bidCardTop, setBidCardTop] = useState(160);
    const [bidCardLeft, setBidCardLeft] = useState(1576);
    const [hideTeamCards, setHideTeamCards] = useState(false);
    const hideTeamCardsRef = useRef(false);
    const [teamCardSize, setTeamCardSize] = useState<'small' | 'medium' | 'large'>('large');
    const teamCardSizeRef = useRef<'small' | 'medium' | 'large'>('large');
    const [teamCardPosition, setTeamCardPosition] = useState<'top-right' | 'bottom-right'>('top-right');
    const teamCardPositionRef = useRef<'top-right' | 'bottom-right'>('top-right');
    const [bidCardPosition, setBidCardPosition] = useState<'top' | 'right' | 'left'>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('bidCardPosition') : null;
        return (saved === 'left' || saved === 'right' || saved === 'top') ? saved : 'top';
    });
    const bidCardPositionRef = useRef<'top' | 'right' | 'left'>('top');
    const [showTeamSizeMenu, setShowTeamSizeMenu] = useState(false);
    const [showHideTickerMenu, setShowHideTickerMenu] = useState(false);
    const [showBidCardMenu, setShowBidCardMenu] = useState(false);
    const [showSoldMessageMenu, setShowSoldMessageMenu] = useState(false);

    // Refs to always read latest values inside the auto-switch effect without re-triggering it
    const tickerModeRef = useRef(tickerMode);
    const autoSwitchDurationRef = useRef(autoSwitchDuration);
    const displayModeRef = useRef(displayMode);
    const hidePremiumCardRef = useRef(hidePremiumCard);
    const customTickerLine1Ref = useRef(customTickerLine1);
    const customTickerLine2Ref = useRef(customTickerLine2);
    const soldMessagePositionRef = useRef(soldMessagePosition);
    const hideTickerCustomRef = useRef(hideTickerCustom);
    const hideTickerFullscreenRef = useRef(hideTickerFullscreen);
    const bidCardTopRef = useRef(bidCardTop);
    const bidCardLeftRef = useRef(bidCardLeft);
    tickerModeRef.current = tickerMode;
    autoSwitchDurationRef.current = autoSwitchDuration;
    displayModeRef.current = displayMode;
    hidePremiumCardRef.current = hidePremiumCard;
    teamWiseTeamIdRef.current = teamWiseTeamId;
    customTickerLine1Ref.current = customTickerLine1;
    customTickerLine2Ref.current = customTickerLine2;
    soldMessagePositionRef.current = soldMessagePosition;
    hideTeamCardsRef.current = hideTeamCards;
    teamCardSizeRef.current = teamCardSize;
    teamCardPositionRef.current = teamCardPosition;
    bidCardPositionRef.current = bidCardPosition;

    useEffect(() => { localStorage.setItem('customTickerLine1', customTickerLine1); }, [customTickerLine1]);
    useEffect(() => { localStorage.setItem('customTickerLine2', customTickerLine2); }, [customTickerLine2]);
    useEffect(() => { localStorage.setItem('bidCardPosition', bidCardPosition); }, [bidCardPosition]);
    bidCardTopRef.current = bidCardTop;
    bidCardLeftRef.current = bidCardLeft;
    bidCardPositionRef.current = bidCardPosition;
    hideTeamCardsRef.current = hideTeamCards;
    teamCardSizeRef.current = teamCardSize;
    teamCardPositionRef.current = teamCardPosition;
    hideTickerCustomRef.current = hideTickerCustom;
    hideTickerFullscreenRef.current = hideTickerFullscreen;

    const sendOverlaySettings = useCallback(async (
        size: 'large' | 'small',
        mode: 'all' | 'sold' | 'available',
        dm: DisplayMode = displayModeRef.current,
        hideCard: boolean = hidePremiumCardRef.current,
        line1: string = customTickerLine1Ref.current,
        line2: string = customTickerLine2Ref.current,
        soldMsgPos: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' = soldMessagePositionRef.current
    ) => {
        const tournamentId = liveTournamentId;
        if (!tournamentId) return;
        try {
            await fetch('/api/overlay/settings', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId, size, tickerMode: mode, displayMode: dm, hidePremiumCard: hideCard, customTickerLine1: line1, customTickerLine2: line2, soldMessagePosition: soldMsgPos, hideTickerCustom: hideTickerCustomRef.current, hideTickerFullscreen: hideTickerFullscreenRef.current, teamWiseTeamId: teamWiseTeamIdRef.current, bidCardTop: bidCardTopRef.current, bidCardLeft: bidCardLeftRef.current, hideTeamCards: hideTeamCardsRef.current, teamCardSize: teamCardSizeRef.current, teamCardPosition: teamCardPositionRef.current, bidCardPosition: bidCardPositionRef.current }),
            });
        } catch { /* non-critical */ }
    }, [liveTournamentId]);

    const sendOverlaySettingsRef = useRef(sendOverlaySettings);
    sendOverlaySettingsRef.current = sendOverlaySettings;

    // Debounced wrapper — batches rapid control-panel changes into a single HTTP request
    // (prevents flooding Neon PG when operator drags sliders or toggles settings quickly)
    const _pendingSettingsArgs = useRef<Parameters<typeof sendOverlaySettings> | null>(null);
    const _settingsDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debouncedSendOverlaySettings = useCallback((...args: Parameters<typeof sendOverlaySettings>) => {
      _pendingSettingsArgs.current = args;
      if (_settingsDebounceTimer.current) clearTimeout(_settingsDebounceTimer.current);
      _settingsDebounceTimer.current = setTimeout(() => {
        if (_pendingSettingsArgs.current) {
          sendOverlaySettingsRef.current(..._pendingSettingsArgs.current);
          _pendingSettingsArgs.current = null;
        }
      }, 150);
    }, []);

    // Handle tournament selection - sync liveTournamentId with selectedTournamentId from context
    // Real-time updates are handled by Pusher, no need to refresh after every action
    useEffect(() => {
        // If initialTournamentId is provided, use it
        if (initialTournamentId) {
            setLiveTournamentId(initialTournamentId);
            return;
        }

        // Use manually selected tournament from context
        if (selectedTournamentId) {
            setLiveTournamentId(selectedTournamentId);
        } else {
            // Fall back to active tournament detection
            const loadActiveTournament = async () => {
                try {
                    const response = await fetch('/api/tournaments/active', { headers: getAuthHeaders() });

                    if (response.ok) {
                        const tournament = await response.json();
                        if (tournament) {
                            setLiveTournamentId(tournament._id);
                            setSelectedTournamentId(tournament._id); // Auto-select
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch active tournament:', error);
                    setLiveTournamentId(null);
                }
            };

            loadActiveTournament();
        }
    }, [initialTournamentId, selectedTournamentId, setSelectedTournamentId]);

    // Use Pusher hook to get real-time auction updates
    const {
        tournament: liveTournament,
        auctionState,
        players,
        teams,
        isConnected,
        error: pusherError,
        setPlayerUnsold,
        setPlayerAvailable,
        updatePlayerAndTeams,
        applyPlayerSelected,
        optimisticPlayerSelection,
        applyAuctionReset,
        applyClassCleared,
        applyStateUpdate,
        optimisticBid,
        restoreAuctionState,
        optimisticSell,
        restoreSell,
        refreshData,
    } = usePusherAuction(liveTournamentId, initialData || undefined);

    // Detect loading state: tournamentId is set but tournament data hasn't loaded yet
    const isLoading = liveTournamentId && !liveTournament && !pusherError;

    // Auto-switch: when a new player is selected, show Large then shrink to Small after N seconds.
    const hydratedOverlaySettingsRef = useRef<string | null>(null);
    useEffect(() => {
        if (!liveTournament?._id) return;
        if (hydratedOverlaySettingsRef.current === liveTournament._id) return;

        const hydrate = async () => {
            let saved = liveTournament.overlayControlSettings;
            if (!saved) {
                try {
                    const res = await fetch(
                        `/api/overlay/settings?tournamentId=${encodeURIComponent(liveTournament._id)}`,
                        { headers: getAuthHeaders() },
                    );
                    if (res.ok) {
                        const data = await res.json();
                        saved = data.settings;
                    }
                } catch {
                    // Non-critical — fall back to defaults until user adjusts controls
                }
            }
            if (!saved) return;

            hydratedOverlaySettingsRef.current = liveTournament._id;
            const s = normalizeOverlayControlSettings(saved);

            setOverlaySize(s.size);
            setTickerMode(s.tickerMode);
            setDisplayMode(s.displayMode as DisplayMode);
            setHidePremiumCard(s.hidePremiumCard);
            setCustomTickerLine1(s.customTickerLine1);
            setCustomTickerLine2(s.customTickerLine2);
            setSoldMessagePosition(s.soldMessagePosition);
            setHideTickerCustom(s.hideTickerCustom);
            setHideTickerFullscreen(s.hideTickerFullscreen);
            setTeamWiseTeamId(s.teamWiseTeamId);
            setBidCardTop(s.bidCardTop);
            setBidCardLeft(s.bidCardLeft);
            setHideTeamCards(s.hideTeamCards);
            setTeamCardSize(s.teamCardSize);
            setTeamCardPosition(s.teamCardPosition);
            setBidCardPosition(s.bidCardPosition);

            displayModeRef.current = s.displayMode as DisplayMode;
            hidePremiumCardRef.current = s.hidePremiumCard;
            customTickerLine1Ref.current = s.customTickerLine1;
            customTickerLine2Ref.current = s.customTickerLine2;
            soldMessagePositionRef.current = s.soldMessagePosition;
            hideTickerCustomRef.current = s.hideTickerCustom;
            hideTickerFullscreenRef.current = s.hideTickerFullscreen;
            teamWiseTeamIdRef.current = s.teamWiseTeamId;
            bidCardTopRef.current = s.bidCardTop;
            bidCardLeftRef.current = s.bidCardLeft;
            hideTeamCardsRef.current = s.hideTeamCards;
            teamCardSizeRef.current = s.teamCardSize;
            teamCardPositionRef.current = s.teamCardPosition;
            bidCardPositionRef.current = s.bidCardPosition;

            if (typeof window !== 'undefined') {
                localStorage.setItem('customTickerLine1', s.customTickerLine1);
                localStorage.setItem('customTickerLine2', s.customTickerLine2);
                localStorage.setItem('bidCardPosition', s.bidCardPosition);
            }

            sendOverlaySettingsRef.current(
                s.size,
                s.tickerMode,
                s.displayMode as DisplayMode,
                s.hidePremiumCard,
                s.customTickerLine1,
                s.customTickerLine2,
                s.soldMessagePosition,
            );
        };

        void hydrate();
    }, [liveTournament?._id, liveTournament?.overlayControlSettings]);

    // Auto-switch: when a new player is selected, show Large then shrink to Small after N seconds.
    // Only active in standard mode — other display modes hide the player card, so the timer would
    // silently flip overlaySize underneath a non-visible card.
    useEffect(() => {
        if (autoSwitchTimerRef.current) {
            clearTimeout(autoSwitchTimerRef.current);
            autoSwitchTimerRef.current = null;
        }
        if (!autoSwitch || !auctionState.currentPlayerId || displayMode !== 'standard' || hidePremiumCard) return;

        setOverlaySize('large');
        sendOverlaySettingsRef.current('large', tickerModeRef.current);

        autoSwitchTimerRef.current = setTimeout(() => {
            setOverlaySize('small');
            sendOverlaySettingsRef.current('small', tickerModeRef.current);
            autoSwitchTimerRef.current = null;
        }, autoSwitchDurationRef.current * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionState.currentPlayerId, autoSwitch, displayMode, hidePremiumCard]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (autoSwitchTimerRef.current) clearTimeout(autoSwitchTimerRef.current);
            if (spinTimerRef.current)       clearTimeout(spinTimerRef.current);
            if (resetTimerRef.current)      clearTimeout(resetTimerRef.current);
        };
    }, []);

    // Display Pusher errors
    useEffect(() => {
        if (pusherError && !error) {
            setError(pusherError);
        }
    }, [pusherError, error]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if(!biddingTeamId && teams.length > 0) {
            setBiddingTeamId(teams[0]._id);
        }
    }, [teams, biddingTeamId]);

    // Memoize computed values to prevent expensive operations on every render
    const currentPlayer = useMemo(
        () => players.find(p => p._id === auctionState.currentPlayerId),
        [players, auctionState.currentPlayerId]
    );

    const soldPlayers = useMemo(
        () => players.filter(p => p.isSold),
        [players]
    );

    const unsoldPlayers = useMemo(
        () => players.filter(p => !p.isSold && p.isUnsold),
        [players]
    );

    const availableCount = useMemo(
        () => players.length - soldPlayers.length - unsoldPlayers.length,
        [players.length, soldPlayers.length, unsoldPlayers.length]
    );

    const isAuctioning = useMemo(
        () => !!currentPlayer && auctionState.currentAuctionStatus !== 'Sold',
        [currentPlayer, auctionState.currentAuctionStatus]
    );

    // Per-class statistics derived from local players + auctionState
    // NOTE: player.playerClass stores the class NAME (e.g. "Platinum"), not the code ("PT")
    const classStats = useMemo((): ClassStat[] => {
        if (!liveTournament?.usePlayerClasses || !liveTournament.playerClasses) return [];
        return liveTournament.playerClasses
            .map(cls => {
                const classPlayers = players.filter(p => p.playerClass === cls.name);
                const sold = classPlayers.filter(p => p.isSold).length;
                const unsold = classPlayers.filter(p => p.isUnsold).length;
                return {
                    ...cls,
                    total: classPlayers.length,
                    sold,
                    unsold,
                    remaining: classPlayers.length - sold - unsold,
                    isActive: auctionState.currentAuctionClass === cls.name,
                    isCompleted: (auctionState.completedClasses ?? []).includes(cls.name),
                };
            })
            .sort((a, b) => a.order - b.order);
    }, [liveTournament, players, auctionState.currentAuctionClass, auctionState.completedClasses]);

    const openReAuctionConfirm = useCallback(() => setShowReAuctionConfirm(true), []);

    // Fetch stats when auction is not live (pre/post-auction state)
    useEffect(() => {
        if (!selectedTournamentId || liveTournament) return;
        let cancelled = false;
        const headers = getAuthHeaders();
        Promise.all([
            fetch(`/api/players?tournamentId=${selectedTournamentId}`, { headers }),
            fetch(`/api/teams?tournamentId=${selectedTournamentId}`, { headers }),
        ]).then(async ([pRes, tRes]) => {
            if (cancelled) return;
            const pl = pRes.ok ? await pRes.json() : [];
            const tm = tRes.ok ? await tRes.json() : [];
            setPreAuctionStats({ players: pl.length, teams: tm.length, sold: pl.filter((p: any) => p.isSold).length });
        }).catch(() => {});
        return () => { cancelled = true; };
    }, [selectedTournamentId, liveTournament]);

    // Keep Team Balance and Max Bid in sync when tournament config changes
    // (e.g. budgetPerTeam/squadSize edited in Tournament form).
    useEffect(() => {
        if (!liveTournamentId || !selectedTournament) return;
        if (selectedTournament._id !== liveTournamentId) return;
        refreshData();
    }, [liveTournamentId, selectedTournament, refreshData]);

    const handleStartAuction = async () => {
        if (!selectedTournament) return;
        if (preAuctionStats.teams < 2 || preAuctionStats.players < 1) { setError('Need at least 2 teams and 1 player to start.'); return; }
        try {
            const res = await fetch('/api/auction/start', { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ tournamentId: selectedTournament._id }) });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to start auction'); return; }
            // Refresh both the tournament list (context) and the Pusher hook's local state
            // so the control panel transitions to the live view without requiring a hard refresh.
            await Promise.all([refreshTournaments(), refreshData()]);
        } catch { setError('Failed to start auction.'); }
    };

    const handleStopAuction = async () => {
        if (!liveTournament) return;
        try {
            const res = await fetch('/api/auction/stop', { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ tournamentId: liveTournament._id }) });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to stop auction'); return; }
            refreshTournaments();
        } catch { setError('Failed to stop auction.'); }
    };

    const handleCompleteTournament = async () => {
        const t = liveTournament || selectedTournament;
        if (!t) return;
        setCompletingTournament(true);
        try {
            const res = await fetch(`/api/tournaments/${t._id}/complete`, { method: 'POST', headers: getAuthHeaders() });
            if (res.ok) { refreshTournaments(); }
            else { const e = await res.json(); setError(e.error || 'Failed to complete'); }
        } catch { setError('Failed to complete tournament.'); }
        finally { setCompletingTournament(false); setShowCompleteConfirm(false); }
    };

    const handleReactivateTournament = async () => {
        if (!selectedTournament || user?.role !== 'Admin') return;
        setReactivatingTournament(true);
        try {
            const res = await fetch(`/api/tournaments/${selectedTournament._id}/reactivate`, { method: 'POST', headers: getAuthHeaders() });
            if (res.ok) { refreshTournaments(); }
            else { const e = await res.json(); setError(e.error || 'Failed to reactivate'); }
        } catch { setError('Failed to reactivate.'); }
        finally { setReactivatingTournament(false); }
    };

    const handleArchiveTournament = async () => {
        if (!selectedTournament) return;
        try {
            const res = await fetch(`/api/tournaments/${selectedTournament._id}/archive`, { method: 'POST', headers: getAuthHeaders() });
            if (res.ok) { refreshTournaments(); }
            else { const e = await res.json(); setError(e.error || 'Failed to archive'); }
        } catch { setError('Failed to archive.'); }
    };

    // Check if tournament is live
    if (!liveTournament || (liveTournament.status !== 'Live' && liveTournament.status !== 'Stopped')) {
        const status = selectedTournament?.status;
        const canStart = ['Draft', 'Setup', 'Pending'].includes(status ?? '');
        const isStopped = status === 'Stopped';
        const isCompleted = status === 'Completed';
        const isArchived = status === 'Archived';
        const allSold = preAuctionStats.players > 0 && preAuctionStats.sold === preAuctionStats.players;

        return (
            <div className="animate-fade-in space-y-6 min-w-0">
                {/* Tournament Selector */}
                <div className="mb-2">
                    <TournamentSelector label="Select Tournament" className="max-w-2xl" />
                </div>

                {error && (
                    <div className="p-3 rounded-lg border border-red-500 bg-red-900/20 text-red-400">{error}</div>
                )}
                {pusherError && (
                    <div className="p-3 rounded-lg border border-red-500 bg-red-900/20 text-red-400">{pusherError}</div>
                )}

                {isLoading || tournamentsLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--brand-primary)' }} />
                    </div>
                ) : !selectedTournament ? (
                    <div className="flex items-center justify-center h-64 rounded-lg border border-dashed" style={{ borderColor: 'var(--border-primary)' }}>
                        <p style={{ color: 'var(--text-tertiary)' }}>Select a tournament above to manage the auction.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Tournament info + status */}
                        <div className="rounded-lg p-5 border border-[var(--border-primary)]" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 min-w-0">
                                <div className="min-w-0">
                                    <p className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{selectedTournament.name}</p>
                                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Budget: {selectedTournament.budgetPerTeam.toLocaleString()} | Squad: {selectedTournament.squadSize}</p>
                                </div>
                                <span className="px-3 py-1 rounded-full text-sm font-semibold shrink-0 self-start" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>
                                    {status}
                                </span>
                            </div>

                            {/* Stats bar */}
                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[var(--border-primary)]">
                                <div className="text-center">
                                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{preAuctionStats.players}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Players</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{preAuctionStats.teams}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Teams</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold" style={{ color: 'var(--status-success)' }}>{preAuctionStats.players - preAuctionStats.sold}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Available</p>
                                </div>
                            </div>
                        </div>

                        {/* Lifecycle controls */}
                        <div className="rounded-lg p-5 border border-[var(--border-primary)]" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Auction Controls</h3>
                            <div className="flex flex-wrap gap-3">
                                {canStart && (
                                    <button onClick={handleStartAuction} className="text-white font-bold py-2 px-6 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--brand-primary)' }}>
                                        ▶ Start Auction
                                    </button>
                                )}
                                {isCompleted && allSold && (
                                    <button onClick={handleArchiveTournament} className="text-white font-bold py-2 px-6 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' }}>
                                        Archive Tournament
                                    </button>
                                )}
                                {isCompleted && user?.role === 'Admin' && (
                                    <button onClick={handleReactivateTournament} disabled={reactivatingTournament} className="text-white font-bold py-2 px-6 rounded-lg transition-colors hover:opacity-80 disabled:opacity-60" style={{ backgroundColor: 'var(--status-warning)' }}>
                                        {reactivatingTournament ? 'Reactivating...' : '↺ Reactivate (Admin)'}
                                    </button>
                                )}
                                {isStopped && (
                                    <button onClick={async () => {
                                        try {
                                            const res = await fetch('/api/auction/restart', { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ tournamentId: selectedTournament._id }) });
                                            const data = await res.json();
                                            if (res.ok) { refreshTournaments(); }
                                            else setError(data.error || 'Failed to restart auction');
                                        } catch { setError('Failed to restart auction.'); }
                                    }} className="text-white font-bold py-2 px-6 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--brand-primary)' }}>
                                        ↺ Restart Auction
                                    </button>
                                )}
                                {isArchived && (
                                    <p className="italic" style={{ color: 'var(--text-secondary)' }}>This tournament is archived (read-only).</p>
                                )}
                                {!canStart && !isStopped && !isCompleted && !isArchived && (
                                    <p style={{ color: 'var(--text-secondary)' }}>No actions available for status: <span className="font-semibold">{status}</span></p>
                                )}
                            </div>
                            {canStart && (preAuctionStats.teams < 2 || preAuctionStats.players < 1) && (
                                <p className="mt-3 text-sm" style={{ color: 'var(--status-warning)' }}>
                                    ⚠ Need at least 2 teams and 1 player to start.{' '}
                                    <a href="/manage/teams" style={{ color: 'var(--brand-primary)' }}>Add teams</a> or <a href="/manage/players" style={{ color: 'var(--brand-primary)' }}>add players</a>.
                                </p>
                            )}
                        </div>

                        {/* Quick nav */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <a href="/manage/teams" className="flex items-center justify-between p-4 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
                                <div>
                                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Manage Teams</p>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{preAuctionStats.teams} registered</p>
                                </div>
                                <svg className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </a>
                            <a href="/manage/players" className="flex items-center justify-between p-4 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-primary)' }}>
                                <div>
                                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Manage Players</p>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{preAuctionStats.players} registered</p>
                                </div>
                                <svg className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </a>
                        </div>
                    </div>
                )}

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
    }

    const handleSelectPlayer = async (playerId: string) => {
        if (!liveTournament || selectPlayerInFlightRef.current) return;
        selectPlayerInFlightRef.current = true;
        if (useTabs) setActiveTab('auction');
        const previousState = optimisticPlayerSelection(playerId);
        try {
            const response = await fetch('/api/auction/select-player', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id, playerId }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                restoreAuctionState(previousState);
                setError(data.error || 'Failed to select player');
                return;
            }
            // Apply the authoritative response immediately. The Pusher event is
            // still required to update overlays and other connected panels.
            applyPlayerSelected(data);
        } catch (error) {
            console.error('Failed to select player:', error);
            setError('An error occurred while selecting the player');
            // The server may have committed despite a network error. Re-fetch
            // instead of blindly rolling back to potentially stale local state.
            await refreshData();
        } finally {
            selectPlayerInFlightRef.current = false;
        }
    };

    const handleSpinWheel = async () => {
        if (spinInFlightRef.current || selectPlayerInFlightRef.current || !liveTournament) return;
        const tournamentId = liveTournament._id;
        spinInFlightRef.current = true;
        selectPlayerInFlightRef.current = true;
        setIsSpinning(true);
        setDisplayMode('wheel-spin');
        displayModeRef.current = 'wheel-spin';
        if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

        const resetSpinUi = () => {
            setDisplayMode('standard');
            displayModeRef.current = 'standard';
            setIsSpinning(false);
            spinInFlightRef.current = false;
            void sendOverlaySettings(overlaySize, tickerMode, 'standard').catch(() => {
                setError('Player selected, but the overlay reset failed');
            });
        };

        try {
            // Fire overlay settings update in parallel — don't block the spin call.
            void sendOverlaySettings(overlaySize, tickerMode, 'wheel-spin').catch(() => {});

            const res = await fetch('/api/overlay/spin', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId }),
            });
            if (!res.ok) {
                const { error } = await res.json().catch(() => ({}));
                throw new Error(error || 'Spin failed');
            }
            const { winnerId } = await res.json();

            // Fire select-player immediately while the wheel is spinning so the
            // Pusher event (auction:player-selected) reaches all overlays and
            // connected panels before the animation finishes. Optimistically apply
            // the winner to the local panel at the same time.
            const previousState = optimisticPlayerSelection(winnerId);
            const selectPromise = fetch('/api/auction/select-player', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId, playerId: winnerId }),
            }).then(async (selectRes) => {
                const selected = await selectRes.json().catch(() => ({}));
                if (!selectRes.ok) throw new Error(selected.error || 'Failed to select wheel winner');
                applyPlayerSelected(selected);
            }).catch(async (error) => {
                if (error instanceof TypeError) {
                    await refreshData().catch(() => {});
                } else {
                    restoreAuctionState(previousState);
                }
                setError(error instanceof Error ? error.message : 'Failed to select wheel winner');
            });

            // After the wheel animation completes, clear the spinning UI and await
            // any still-pending select-player request.
            spinTimerRef.current = setTimeout(async () => {
                spinTimerRef.current = null;

                // Wait for the in-flight selection to settle before resetting UI.
                await selectPromise.catch(() => {});

                // Keep winner reveal visible briefly, then reset overlay to standard.
                resetTimerRef.current = setTimeout(() => {
                    resetTimerRef.current = null;
                    resetSpinUi();
                }, WHEEL_WINNER_HOLD_MS);

                selectPlayerInFlightRef.current = false;
            }, WHEEL_SPIN_DURATION_MS);
        } catch (error) {
            selectPlayerInFlightRef.current = false;
            spinInFlightRef.current = false;
            setIsSpinning(false);
            setDisplayMode('standard');
            displayModeRef.current = 'standard';
            setError(error instanceof Error ? error.message : 'Spin failed');
            void sendOverlaySettings(overlaySize, tickerMode, 'standard').catch(() => {});
        }
    };

    const handleSelectClass = async (className: string) => {
        if (!liveTournament || selectingClass) return;
        setSelectingClass(true);
        try {
            const res = await fetch('/api/auction/select-class', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id, className }),
            });
            const data = await res.json();
            if (!res.ok) setError(data.error || 'Failed to select class');
        } catch {
            setError('Failed to select class');
        } finally {
            setSelectingClass(false);
        }
    };

    const handleClearClass = async () => {
        if (!liveTournament || selectingClass) return;
        setSelectingClass(true);
        try {
            const res = await fetch('/api/auction/select-class', {
                method: 'DELETE',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || 'Failed to clear class');
            } else if (data.auctionState) {
                // Apply immediately — no need to wait for Pusher echo.
                applyClassCleared({
                    ...data,
                    classCode: '',
                    className: '',
                    playerCount: 0,
                    tournamentId: liveTournament._id,
                    timestamp: Date.now(),
                    message: 'Class filter cleared',
                });
            }
        } catch {
            setError('Failed to clear class');
        } finally {
            setSelectingClass(false);
        }
    };

    const handleReAuction = async () => {
        if (!liveTournament) return;
        setReAuctioning(true);
        try {
            const response = await fetch('/api/auction/re-auction', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id }),
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.error || 'Failed to re-auction players');
            } else {
                // Immediately update local state — don't wait for Pusher
                (data.reAuctionedPlayerIds as string[])?.forEach(id => setPlayerAvailable(id));
            }
        } catch {
            setError('An error occurred during re-auction');
        } finally {
            setReAuctioning(false);
            setShowReAuctionConfirm(false);
        }
    };

    const handleBid = async (amount: number, teamId?: string) => {
        if (!liveTournament) return;
        if (bidInFlightRef.current) return;

        // Client-side validation
        const currentBid = auctionState.currentBid || 0;
        const basePrice = liveTournament.basePricePerPlayer || 0;

        if (currentBid > 0 && amount <= currentBid) {
            setError(`Bid must be greater than current bid of ${formatCurrency(currentBid)}`);
            return;
        }

        if (currentBid === 0 && amount < basePrice) {
            setError(`First bid must be at least base price of ${formatCurrency(basePrice)}`);
            return;
        }

        bidInFlightRef.current = true;
        setBidInFlight(true);
        const bidSequence = ++bidSequenceRef.current;
        // Prevent accidental double-clicks, but do not wait for the HTTP/Pusher
        // response before enabling the next bid. The local optimistic state is
        // authoritative for operator controls until the server confirms/rejects.
        window.setTimeout(() => {
            if (bidSequenceRef.current === bidSequence) {
                bidInFlightRef.current = false;
                setBidInFlight(false);
            }
        }, 120);

        // Optimistic update: snapshot the previous auctionState, apply new bid
        // immediately so the UI feels instant, then revert if the server rejects.
        // The auction:bid-placed Pusher event will replace this with the
        // authoritative value once it arrives.
        const snapshot = auctionState;
        optimisticBid(amount);

        try {
            const response = await fetch('/api/auction/bid', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId: liveTournament._id,
                    teamId,
                    amount,
                }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                if (bidSequenceRef.current === bidSequence) {
                    restoreAuctionState(snapshot);
                    setError(data.error || 'Failed to place bid');
                    // Server rejected because our local currentBid was stale
                    // (another client bid between our last Pusher event and now).
                    // Re-fetch authoritative state so the next quick-bid uses
                    // the real current value.
                    if (response.status === 400 || response.status === 409) {
                        refreshData().catch(() => {});
                    }
                }
            }
        } catch (error) {
            if (bidSequenceRef.current === bidSequence) {
                restoreAuctionState(snapshot);
                setError('An error occurred while placing the bid');
            }
            console.error('Failed to place bid:', error);
        }
    };

    const handleCorrectBid = async (amount: number, teamId?: string) => {
        if (!liveTournament) return;
        try {
            const response = await fetch('/api/auction/bid/correct', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id, amount, teamId }),
            });
            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Failed to correct bid');
            }
        } catch (error) {
            console.error('Failed to correct bid:', error);
            setError('An error occurred while correcting the bid');
        }
    };

    const handleSell = async () => {
        if (!liveTournament) return;
        if (sellInFlightRef.current || undoInFlightRef.current) return;
        if (!biddingTeamId) {
            setError('Please select a winning team before selling');
            return;
        }

        const playerId = auctionState.currentPlayerId;
        const bid = auctionState.currentBid;
        if (!playerId || !bid) {
            setError('No active bid to sell');
            return;
        }

        // Optimistic update: mark sold + deduct balance immediately. The
        // PLAYER_SOLD Pusher event will replace this with the authoritative
        // server state. On failure we restore from the snapshot.
        sellInFlightRef.current = true;
        const snapshot = optimisticSell({ teamId: biddingTeamId, playerId, bid });

        try {
            const response = await fetch('/api/auction/sell', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId: liveTournament._id,
                    teamId: biddingTeamId,
                }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                restoreSell(snapshot);
                setError(data.error || 'Failed to sell player');
            }
        } catch (error) {
            restoreSell(snapshot);
            console.error('Failed to sell player:', error);
            setError('An error occurred while selling the player');
        } finally {
            sellInFlightRef.current = false;
        }
    };

    const handleReset = async () => {
        if (!liveTournament) return;
        try {
            const response = await fetch('/api/auction/reset', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.error || 'Failed to reset auction');
                return;
            }
            // Apply immediately so the board clears without waiting for the Pusher echo.
            if (data.auctionState) applyAuctionReset(data.auctionState);
        } catch (error) {
            console.error('Failed to reset auction:', error);
            setError('An error occurred while resetting the auction');
        }
    };

    const handleMarkUnsold = async () => {
        if (!liveTournament) return;
        const currentPlayerId = auctionState.currentPlayerId;
        try {
            const response = await fetch('/api/auction/mark-unsold', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setError(data.error || 'Failed to mark player as unsold');
            } else if (currentPlayerId) {
                // Immediately update local state — don't rely solely on Pusher delivery
                setPlayerUnsold(currentPlayerId);
            }
        } catch (error) {
            console.error('Failed to mark player as unsold:', error);
            setError('An error occurred while marking player as unsold');
        }
    };

    const handleUndo = async () => {
        if (!liveTournament) return;
        if (undoInFlightRef.current || sellInFlightRef.current) return;
        undoInFlightRef.current = true;
        setUndoPending(true);
        try {
            const response = await fetch('/api/auction/undo', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id }),
            });
            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Failed to undo sale');
                return;
            }
            const data = await response.json();
            // Unsold undo: no refundedAmount — restore player to available immediately
            if (data.player && data.refundedAmount === undefined) {
                setPlayerAvailable(data.player._id);
            }
            // Sale undo is handled by the Pusher AUCTION_UNDO event (includes team refund)
        } catch (error) {
            console.error('Failed to undo sale:', error);
            setError('An error occurred while undoing the sale');
        } finally {
            undoInFlightRef.current = false;
            setUndoPending(false);
        }
    };

    const handleCleanupAll = async () => {
        if (!liveTournament) return;
        if (!window.confirm("Are you sure you want to reset all sales? This cannot be undone.")) {
            return;
        }
        try {
            const response = await fetch('/api/auction/reset-all', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.error || 'Failed to reset all sales');
                return;
            }
            // Apply auction state reset immediately; player/team lists
            // are fully refreshed via a background bootstrap fetch.
            if (data.auctionState) applyAuctionReset(data.auctionState);
            refreshData().catch(() => {});
        } catch (error) {
            console.error('Failed to reset all sales:', error);
            setError('An error occurred while resetting all sales');
        }
    }

    const handleRestartAuction = async () => {
        if (!liveTournament) return;
        try {
            const response = await fetch('/api/auction/restart', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id }),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to restart auction');
            } else {
                setError(null);
            }
            // Pusher will handle real-time updates, no need to refresh
        } catch (error) {
            console.error('Failed to restart auction:', error);
            setError('An error occurred while restarting the auction');
        }
    }

    const isAuctionStopped = liveTournament?.status === 'Stopped';

    const classManagerNode = liveTournament?.usePlayerClasses && classStats.length > 0 ? (
        <MemoClassManagerPanel
            classStats={classStats}
            onSelectClass={handleSelectClass}
            onClearClass={handleClearClass}
            selectingClass={selectingClass}
        />
    ) : null;

    const overlayControlsNode = (
        <MemoOverlayControlsPanel
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            overlayTheme={liveTournament?.overlayTheme ?? 'standard'}
            overlaySize={overlaySize}
            setOverlaySize={setOverlaySize}
            hidePremiumCard={hidePremiumCard}
            setHidePremiumCard={setHidePremiumCard}
            autoSwitch={autoSwitch}
            setAutoSwitch={setAutoSwitch}
            autoSwitchDuration={autoSwitchDuration}
            setAutoSwitchDuration={setAutoSwitchDuration}
            autoSwitchTimerRef={autoSwitchTimerRef}
            hideTeamCards={hideTeamCards}
            setHideTeamCards={setHideTeamCards}
            hideTeamCardsRef={hideTeamCardsRef}
            teamCardSize={teamCardSize}
            setTeamCardSize={setTeamCardSize}
            teamCardSizeRef={teamCardSizeRef}
            teamCardPosition={teamCardPosition}
            setTeamCardPosition={setTeamCardPosition}
            teamCardPositionRef={teamCardPositionRef}
            bidCardPosition={bidCardPosition}
            setBidCardPosition={setBidCardPosition}
            bidCardPositionRef={bidCardPositionRef}
            tickerMode={tickerMode}
            setTickerMode={setTickerMode}
            hideTickerCustom={hideTickerCustom}
            setHideTickerCustom={setHideTickerCustom}
            hideTickerCustomRef={hideTickerCustomRef}
            hideTickerFullscreen={hideTickerFullscreen}
            setHideTickerFullscreen={setHideTickerFullscreen}
            hideTickerFullscreenRef={hideTickerFullscreenRef}
            customTickerLine1={customTickerLine1}
            setCustomTickerLine1={setCustomTickerLine1}
            customTickerLine2={customTickerLine2}
            setCustomTickerLine2={setCustomTickerLine2}
            teamWiseTeamId={teamWiseTeamId}
            setTeamWiseTeamId={setTeamWiseTeamId}
            teamWiseTeamIdRef={teamWiseTeamIdRef}
            teams={teams}
            soldMessagePosition={soldMessagePosition}
            setSoldMessagePosition={setSoldMessagePosition}
            soldMessagePositionRef={soldMessagePositionRef}
            bidCardTop={bidCardTop}
            setBidCardTop={setBidCardTop}
            bidCardTopRef={bidCardTopRef}
            bidCardLeft={bidCardLeft}
            setBidCardLeft={setBidCardLeft}
            bidCardLeftRef={bidCardLeftRef}
            sendOverlaySettings={sendOverlaySettings}
        />
    );

    const teamsPanelProps = {
        teams,
        soldPlayers,
        unsoldPlayers,
        tournament: liveTournament,
        winningTeamId: auctionState.winningTeamId,
        currentBid: auctionState.currentBid ?? 0,
        onUndo: handleUndo,
        undoPending,
        onCleanup: handleCleanupAll,
        onEditSaved: updatePlayerAndTeams,
    };

    return (
        <div className="animate-fade-in space-y-4 min-w-0">
            {/* Tournament Selector */}
            <div className="mb-4">
                <TournamentSelector
                    label="Select Tournament"
                    className="max-w-2xl"
                />
            </div>

            {error && (
                <div className="alert alert-danger mb-4 p-3 rounded-lg border border-red-500 bg-red-900/20 text-red-400">{error}</div>
            )}

            <AuctionHeaderBar
                layoutMode={layoutMode}
                isAuctionStopped={isAuctionStopped}
                isConnected={isConnected}
                tournamentName={liveTournament.name}
                budgetPerTeam={liveTournament.budgetPerTeam}
                squadSize={liveTournament.squadSize}
                basePricePerPlayer={liveTournament.basePricePerPlayer}
                availableCount={availableCount}
                soldCount={soldPlayers.length}
                unsoldCount={unsoldPlayers.length}
                onStop={handleStopAuction}
                onRestart={handleRestartAuction}
                onComplete={() => setShowCompleteConfirm(true)}
                sectionVisibility={sectionVisibility}
                onToggleSection={toggleSection}
                layoutPreference={layoutPreference}
                onLayoutPreferenceChange={setLayoutPreference}
            />

            <AuctionWorkspaceLayout
                layoutMode={layoutMode}
                layoutPreference={layoutPreference}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                sectionVisibility={sectionVisibility}
                classManager={useTabs ? undefined : classManagerNode}
                availablePlayers={
                    <MemoAvailablePlayersPanel
                        players={players}
                        tournament={liveTournament}
                        onSelectPlayer={handleSelectPlayer}
                        isAuctioning={isAuctioning}
                        currentPlayerId={currentPlayer?._id}
                        onReAuction={openReAuctionConfirm}
                        reAuctioning={reAuctioning}
                        activeClass={auctionState.currentAuctionClass ?? null}
                        classManager={useTabs ? classManagerNode : undefined}
                    />
                }
                auctionPanel={
                    <MemoCurrentAuctionPanel
                        currentPlayer={currentPlayer}
                        tournament={liveTournament}
                        teams={teams}
                        players={players}
                        biddingTeamId={biddingTeamId}
                        setBiddingTeamId={setBiddingTeamId}
                        auctionState={auctionState}
                        onBid={handleBid}
                        onCorrectBid={handleCorrectBid}
                        onSell={handleSell}
                        onReset={handleReset}
                        onMarkUnsold={handleMarkUnsold}
                        onSpinWheel={handleSpinWheel}
                        isSpinning={isSpinning}
                        isInFlight={bidInFlight}
                        stickyPlayerHeader={useTabs}
                    />
                }
                overlayPanel={overlayControlsNode}
                teamsPanel={
                    <MemoTeamsAndSoldPlayersPanel
                        {...teamsPanelProps}
                        showTeams
                        showResults={false}
                    />
                }
                resultsPanel={
                    <MemoTeamsAndSoldPlayersPanel
                        {...teamsPanelProps}
                        showTeams={false}
                        showResults
                    />
                }
                errorOverlay={
                    error ? (
                        <div className="absolute bottom-4 right-4 text-center text-red-400 bg-red-900/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-red-700 animate-fade-in">
                            {error}
                        </div>
                    ) : undefined
                }
            />
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
            {/* Re-Auction Confirmation Modal */}
            <Modal isOpen={showReAuctionConfirm} onClose={() => setShowReAuctionConfirm(false)} title="Re-Auction Unsold Players?" size="sm">
                <div className="space-y-4">
                    <p style={{ color: 'var(--text-secondary)' }}>
                        All unsold players will be moved back to the available pool and can be auctioned again.
                        Sold players and team budgets are not affected.
                    </p>
                    <div className="flex gap-3 justify-end pt-2">
                        <button onClick={() => setShowReAuctionConfirm(false)} className="font-bold py-2 px-4 rounded-lg hover:opacity-80" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' }}>
                            Cancel
                        </button>
                        <button onClick={handleReAuction} disabled={reAuctioning} className="text-white font-bold py-2 px-4 rounded-lg hover:opacity-80 disabled:opacity-60" style={{ backgroundColor: '#D97706' }}>
                            {reAuctioning ? 'Processing…' : 'Re-Auction'}
                        </button>
                    </div>
                </div>
            </Modal>
             <style jsx>{`
                .btn-primary { @apply text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed; background-color: var(--brand-primary); }
                .btn-primary:hover:not(:disabled) { background-color: var(--brand-primary); opacity: 0.8; }
                .btn-secondary { @apply font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed; background-color: var(--surface-hover); color: var(--text-primary); }
                .btn-secondary:hover:not(:disabled) { background-color: var(--surface-elevated); }
                .btn-danger { @apply bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed; }
                .input-field { @apply rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary p-2; background-color: var(--surface-card); border: 1px solid var(--border-primary); }
            `}</style>
        </div>
    );
};

export default AuctionControlPanel;
