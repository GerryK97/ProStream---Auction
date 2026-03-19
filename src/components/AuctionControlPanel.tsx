'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ClearAllButton from './shared/ClearAllButton';
import { Player, Team, Tournament, AuctionState } from '@/types';
import { usePusherAuction } from '@/hooks/usePusherAuction';
import { imageOptimizers } from '@/lib/imageOptimization';
import ClassBadge from '@/components/shared/ClassBadge';
import { getFormattedBasePrice, getClassBasePrice, getMinClassBasePrice } from '@/lib/playerClassUtils';
import { getBidIncrement, getNextTeamBid } from '@/lib/bidIncrementUtils';
import { getAuthHeaders } from '@/lib/api-client';
import { useTournamentContext } from '@/contexts/TournamentContext';
import { useAuth } from '@/contexts/AuthContext';
import TournamentSelector from './TournamentSelector';
import Modal from './Modal';

const formatCurrency = (amount: number) => amount.toLocaleString();

const AvailablePlayersPanel: React.FC<{
    players: Player[];
    tournament: Tournament | null;
    onSelectPlayer: (id: string) => void;
    isAuctioning: boolean;
    currentPlayerId?: string;
    onReAuction: () => void;
    reAuctioning: boolean;
}> = ({ players, tournament, onSelectPlayer, isAuctioning, currentPlayerId, onReAuction, reAuctioning }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const unsoldCount = players.filter(p => p.isUnsold).length;
    const availablePlayers = players
        .filter(p => !p.isSold && !p.isUnsold && p._id !== currentPlayerId)
        .sort((a, b) => a._id.localeCompare(b._id))
        .filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.playerNo && p.playerNo.toLowerCase().includes(searchTerm.toLowerCase()))
        );

    return (
        <div className="rounded-lg p-4 flex flex-col h-full border border-[var(--border-primary)]" style={{ backgroundColor: 'var(--surface-secondary)' }}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Available Players</h3>
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
                                    <ClassBadge tournament={tournament} player={player} variant="inline" />
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

// ─── Team Bidding Panel ──────────────────────────────────────────────────────
const TeamBiddingPanel: React.FC<{
    teams: Team[];
    tournament: Tournament;
    auctionState: any;
    currentPlayer: Player | undefined;
    biddingTeamId: string;
    setBiddingTeamId: (id: string) => void;
    onBid: (amount: number, teamId: string) => void;
    isSold: boolean;
}> = ({ teams, tournament, auctionState, currentPlayer, biddingTeamId, setBiddingTeamId, onBid, isSold }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { currentBid } = auctionState;
    const basePrice = getClassBasePrice(tournament, currentPlayer ?? null);
    const increments = tournament.bidIncrements ?? [];
    const nextBidAmount = getNextTeamBid(increments, currentBid, basePrice);
    const increment = currentBid === 0 ? basePrice : getBidIncrement(increments, currentBid);

    // Mirrors the same max-bid calculation used in TeamsAndSoldPlayersPanel
    const calcMaxBid = (team: Team): number => {
        if (!tournament || !team.currentBalance) return 0;
        const squadSize = tournament.squadSize;
        const minBase = getMinClassBasePrice(tournament);
        const purchased = team.playersPurchased?.length || 0;
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

            {/* Compact team buttons — 3-column, no scroll */}
            <div className="grid grid-cols-3 gap-1.5">
                {teams.map(team => {
                    const maxBid = calcMaxBid(team);
                    const canAfford = maxBid >= nextBidAmount;
                    const isLeading = biddingTeamId === team._id && currentBid > 0;
                    const blocked = isSold || isSubmitting || !canAfford;

                    return (
                        <button
                            key={team._id}
                            disabled={blocked}
                            onClick={async () => {
                                if (blocked) return;
                                setBiddingTeamId(team._id);
                                setIsSubmitting(true);
                                try { await onBid(nextBidAmount, team._id); }
                                finally { setIsSubmitting(false); }
                            }}
                            className="flex flex-row items-center gap-1.5 py-2 px-2 rounded-lg transition-all"
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
                                opacity: (isSold || isSubmitting) ? 0.55 : 1,
                                cursor: blocked ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <img
                                src={imageOptimizers.teamThumbnail(team.logoURL)}
                                alt={team.name}
                                className="w-9 h-9 rounded-full object-cover shrink-0"
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

const CurrentAuctionPanel: React.FC<{
    currentPlayer: Player | undefined;
    tournament: Tournament | null;
    teams: Team[];
    biddingTeamId: string;
    setBiddingTeamId: (id: string) => void;
    auctionState: any;
    onBid: (amount: number, teamId?: string) => void;
    onCorrectBid: (amount: number) => void;
    onSell: () => void;
    onReset: () => void;
    onMarkUnsold: () => void;
    onSpinWheel: () => void;
    isSpinning: boolean;
}> = ({ currentPlayer, tournament, teams, biddingTeamId, setBiddingTeamId, auctionState, onBid, onCorrectBid, onSell, onReset, onMarkUnsold, onSpinWheel, isSpinning }) => {
    const [bidAmount, setBidAmount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            <div className="rounded-lg p-4 flex items-center justify-center min-h-[80px] border border-[var(--border-primary)]" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <p className="text-[var(--text-tertiary)] text-lg">{!tournament ? "No tournament data" : "Select a player to start the auction"}</p>
            </div>
        );
    }

    const { currentBid, currentAuctionStatus } = auctionState;
    const isSold = currentAuctionStatus === 'Sold';
    const bidIncrements = [1000, 5000, 10000, 20000, 25000, 50000];
    const isCorrection = currentBid > 0 && bidAmount > 0 && bidAmount < currentBid;
    const statusText = currentAuctionStatus === 'Bidding' ? 'BIDDING ACTIVE' : (isSold ? 'PLAYER SOLD' : 'BIDDING PENDING');
    const statusColor = currentAuctionStatus === 'Bidding' ? 'text-yellow-400' : (isSold ? 'text-green-400' : 'text-[var(--text-tertiary)]');

    return (
        <div className="rounded-lg p-4 border border-[var(--border-primary)] flex flex-col gap-3 shrink-0" style={{ backgroundColor: 'var(--surface-secondary)' }}>
            {/* Player info bar */}
            <div className="flex items-center gap-3 p-3 rounded-lg shrink-0" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                <img
                    src={imageOptimizers.playerCard(currentPlayer.photoURL)}
                    alt={currentPlayer.name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                    loading="lazy"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[var(--brand-primary)] truncate">#{currentPlayer.playerNo || ''} {currentPlayer.name}</p>
                        <ClassBadge tournament={tournament} player={currentPlayer} variant="inline" />
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">{currentPlayer.position || 'Player'} · Base: {getFormattedBasePrice(tournament, currentPlayer)}</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-xs text-[var(--text-tertiary)]">Current Bid</p>
                    <p className="text-3xl font-bold text-[var(--brand-secondary)]">{formatCurrency(currentBid)}</p>
                </div>
            </div>

            {/* Quick Bid (Direct) or Team Bidding buttons */}
            {tournament.biddingMode === 'team' ? (
                <TeamBiddingPanel
                    teams={teams}
                    tournament={tournament}
                    auctionState={auctionState}
                    currentPlayer={currentPlayer}
                    biddingTeamId={biddingTeamId}
                    setBiddingTeamId={setBiddingTeamId}
                    onBid={(amount, teamId) => { setBiddingTeamId(teamId); return onBid(amount, teamId); }}
                    isSold={isSold}
                />
            ) : (
            <div className="shrink-0">
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>Quick Bid</p>
                <div className="grid grid-cols-6 gap-1.5">
                    {bidIncrements.map(inc => (
                        <button
                            key={inc}
                            onClick={() => handleQuickBid(inc)}
                            disabled={isSold || isSubmitting}
                            className="py-3 rounded-md text-sm font-bold transition-colors disabled:opacity-40"
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
                        className="input-field flex-1 text-sm py-1.5 disabled:opacity-50"
                        placeholder="Enter any amount"
                        style={isCorrection ? { borderColor: '#FB923C', color: '#000000' } : { color: '#000000' }}
                    />
                    <button
                        onClick={() => isCorrection ? onCorrectBid(bidAmount) : onBid(bidAmount)}
                        disabled={isSold || isSubmitting || bidAmount <= 0}
                        className="text-sm px-4 py-1.5 shrink-0 rounded-md font-bold transition-colors disabled:opacity-50"
                        style={{
                            backgroundColor: isCorrection ? 'rgba(251,146,60,0.15)' : 'var(--surface-elevated)',
                            color: isCorrection ? '#FB923C' : 'var(--brand-primary)',
                            border: `1.5px solid ${isCorrection ? '#FB923C' : 'var(--brand-primary)'}`,
                        }}>
                        {isSubmitting ? '...' : isCorrection ? 'Correct' : 'Set'}
                    </button>
                </div>
            </div>

            {/* Finalize section */}
            <div className="border-t border-[var(--border-primary)] pt-3 flex flex-col gap-2 shrink-0">

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
                    className="w-full border rounded-md px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}>
                    {teams.map(t => (
                        <option key={t._id} value={t._id} style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-primary)' }}>
                            {t.name}
                        </option>
                    ))}
                </select>

                {/* Action buttons — one row */}
                <div className="grid grid-cols-4 gap-2">
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
            </div>
        </div>
    );
}

const TeamsAndSoldPlayersPanel: React.FC<{
    teams: Team[];
    soldPlayers: Player[];
    unsoldPlayers: Player[];
    tournament: Tournament | null;
    winningTeamId: string | null;
    currentBid: number;
    onUndo: () => void;
    onCleanup: () => void;
}> = ({ teams, soldPlayers, unsoldPlayers, tournament, winningTeamId, currentBid, onUndo, onCleanup }) => {
    const calculateMaxBid = (team: Team) => {
        if (!tournament || !team.currentBalance) return 0;

        const squadSize = tournament.squadSize;
        const basePrice = getMinClassBasePrice(tournament);
        const playersPurchased = team.playersPurchased?.length || 0;
        const remainingPlayers = squadSize - playersPurchased;

        // If squad is complete or it's the last player, team can spend all remaining balance
        if (remainingPlayers <= 1) {
            return team.currentBalance;
        }

        // Otherwise, reserve base price for remaining players
        const reservedAmount = (remainingPlayers - 1) * basePrice;
        const maxBid = team.currentBalance - reservedAmount;

        // Return 0 if insufficient funds
        return Math.max(0, maxBid);
    };

    return (
        <div className="h-full flex flex-col gap-3">
            <div className="rounded-lg p-4 border border-[var(--border-primary)] flex flex-col flex-1 min-h-0" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                 <h3 className="font-bold text-base mb-2 shrink-0">Teams</h3>
                 <ul className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0">
                     {teams.map((team, index) => {
                         const maxBid = calculateMaxBid(team);
                         const playersPurchased = team.playersPurchased?.length || 0;
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
                                <img
                                    src={imageOptimizers.teamThumbnail(team.logoURL)}
                                    alt={team.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                    loading="lazy"
                                />
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{team.name}</p>
                                        {hasInsufficientFunds && (
                                            <span className="text-red-500 text-xs" title="Insufficient funds for remaining players">⚠️</span>
                                        )}
                                        {isBidExceeded && (
                                            <span className="text-red-400 text-xs font-semibold">Over limit</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)]">Budget: <span className="text-[var(--brand-secondary)]">{formatCurrency(team.currentBalance || 0)}</span></p>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        Max Bid: <span className={hasInsufficientFunds || isBidExceeded ? "text-red-500 font-semibold" : "text-[var(--brand-primary)]"}>{formatCurrency(maxBid)}</span>
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">{playersPurchased}/{squadSize} players</p>
                                </div>
                             </li>
                         );
                     })}
                 </ul>
            </div>
             <div className="rounded-lg p-4 border border-[var(--border-primary)] flex flex-col flex-1 min-h-0" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <div className="flex items-center justify-between mb-2 shrink-0">
                    <h3 className="font-bold text-base">Sold/Unsold Player List ({soldPlayers.length + unsoldPlayers.length})</h3>
                    <div className="flex gap-1.5">
                        <button
                            onClick={onUndo}
                            disabled={soldPlayers.length === 0 && unsoldPlayers.length === 0}
                            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                background: 'rgba(99,102,241,0.12)',
                                color: '#a5b4fc',
                                border: '1.5px solid rgba(99,102,241,0.35)',
                            }}
                            onMouseEnter={e => { if (soldPlayers.length > 0 || unsoldPlayers.length > 0) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.25)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.12)'; }}>
                            Undo
                        </button>
                        <ClearAllButton onClick={onCleanup} disabled={soldPlayers.length === 0 && unsoldPlayers.length === 0} label="Clear" size="sm" />
                    </div>
                </div>
                <div className="overflow-y-auto pr-1 flex-1 min-h-0">
                    {soldPlayers.length === 0 && unsoldPlayers.length === 0 ? (
                        <p className="text-center text-[var(--text-tertiary)] py-8 text-sm">No sold or unsold players yet</p>
                    ) : (
                        <ul className="space-y-2">
                            {soldPlayers.map((player) => {
                                const playerTeam = teams.find(t => t._id === player.winningTeamId);
                                return (
                                    <li key={player._id} className="p-2 rounded-md transition-colors hover:opacity-90 border border-[var(--border-primary)]" style={{ backgroundColor: 'var(--surface-card)' }}>
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={imageOptimizers.playerThumbnail(player.photoURL)}
                                                alt={player.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                                loading="lazy"
                                            />
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <ClassBadge tournament={tournament} player={player} variant="dot" />
                                                    <p className="font-semibold text-sm truncate">{player.name}</p>
                                                </div>
                                                <p className="text-xs text-[var(--brand-secondary)]">{formatCurrency(player.finalPrice || 0)}</p>
                                                <p className="text-xs text-[var(--text-secondary)] truncate">
                                                    {playerTeam ? playerTeam.name : 'Unknown Team'}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                            {unsoldPlayers.map((player) => (
                                <li key={player._id} className="p-2 rounded-md transition-colors hover:opacity-90 border border-red-900/40" style={{ backgroundColor: 'var(--surface-card)' }}>
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={imageOptimizers.playerThumbnail(player.photoURL)}
                                            alt={player.name}
                                            className="w-10 h-10 rounded-full object-cover opacity-60 grayscale"
                                            loading="lazy"
                                        />
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <ClassBadge tournament={tournament} player={player} variant="dot" />
                                                <p className="font-semibold text-sm truncate text-[var(--text-secondary)]">{player.name}</p>
                                            </div>
                                            <p className="text-xs font-bold text-red-400">UNSOLD</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
             </div>
        </div>
    );
};


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

    // Overlay control panel settings
    const [overlaySize, setOverlaySize] = useState<'large' | 'small'>('large');
    const [tickerMode, setTickerMode] = useState<'all' | 'sold' | 'available'>('all');
    const [displayMode, setDisplayMode] = useState<'standard' | 'sold-summary' | 'team-summary' | 'team-wise-summary' | 'resting' | 'top10-summary' | 'custom-ticker' | 'wheel-spin'>('standard');
    const [isSpinning, setIsSpinning] = useState(false);
    const spinTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [hidePremiumCard, setHidePremiumCard] = useState(false);
    const [autoSwitch, setAutoSwitch] = useState(false);
    const [autoSwitchDuration, setAutoSwitchDuration] = useState(5);
    const autoSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [customTickerLine1, setCustomTickerLine1] = useState('');
    const [customTickerLine2, setCustomTickerLine2] = useState('');
    const [showTickerModal, setShowTickerModal] = useState(false);
    const [soldMessagePosition, setSoldMessagePosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
    const [hideTickerCustom, setHideTickerCustom] = useState(false);
    const [hideTickerFullscreen, setHideTickerFullscreen] = useState(false);

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
    tickerModeRef.current = tickerMode;
    autoSwitchDurationRef.current = autoSwitchDuration;
    displayModeRef.current = displayMode;
    hidePremiumCardRef.current = hidePremiumCard;
    customTickerLine1Ref.current = customTickerLine1;
    customTickerLine2Ref.current = customTickerLine2;
    soldMessagePositionRef.current = soldMessagePosition;

    const sendOverlaySettings = async (
        size: 'large' | 'small',
        mode: 'all' | 'sold' | 'available',
        dm: 'standard' | 'sold-summary' | 'team-summary' | 'team-wise-summary' | 'resting' | 'top10-summary' | 'custom-ticker' | 'wheel-spin' = displayModeRef.current,
        hideCard: boolean = hidePremiumCardRef.current,
        line1: string = customTickerLine1Ref.current,
        line2: string = customTickerLine2Ref.current,
        soldMsgPos: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' = soldMessagePositionRef.current
    ) => {
        const tournamentId = liveTournament?._id;
        if (!tournamentId) return;
        try {
            await fetch('/api/overlay/settings', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId, size, tickerMode: mode, displayMode: dm, hidePremiumCard: hideCard, customTickerLine1: line1, customTickerLine2: line2, soldMessagePosition: soldMsgPos, hideTickerCustom: hideTickerCustomRef.current, hideTickerFullscreen: hideTickerFullscreenRef.current }),
            });
        } catch { /* non-critical */ }
    };

    const sendOverlaySettingsRef = useRef(sendOverlaySettings);
    sendOverlaySettingsRef.current = sendOverlaySettings;

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
    } = usePusherAuction(liveTournamentId, initialData || undefined);

    // Detect loading state: tournamentId is set but tournament data hasn't loaded yet
    const isLoading = liveTournamentId && !liveTournament && !pusherError;

    // Auto-switch: when a new player is selected, show Large then shrink to Small after N seconds
    useEffect(() => {
        if (autoSwitchTimerRef.current) {
            clearTimeout(autoSwitchTimerRef.current);
            autoSwitchTimerRef.current = null;
        }
        if (!autoSwitch || !auctionState.currentPlayerId) return;

        setOverlaySize('large');
        sendOverlaySettingsRef.current('large', tickerModeRef.current);

        autoSwitchTimerRef.current = setTimeout(() => {
            setOverlaySize('small');
            sendOverlaySettingsRef.current('small', tickerModeRef.current);
            autoSwitchTimerRef.current = null;
        }, autoSwitchDurationRef.current * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionState.currentPlayerId, autoSwitch]);

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

    const isAuctioning = useMemo(
        () => !!currentPlayer && auctionState.currentAuctionStatus !== 'Sold',
        [currentPlayer, auctionState.currentAuctionStatus]
    );

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

    const handleStartAuction = async () => {
        if (!selectedTournament) return;
        if (preAuctionStats.teams < 2 || preAuctionStats.players < 1) { setError('Need at least 2 teams and 1 player to start.'); return; }
        try {
            const res = await fetch('/api/auction/start', { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ tournamentId: selectedTournament._id }) });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to start auction'); return; }
            refreshTournaments();
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
            <div className="animate-fade-in space-y-6">
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
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedTournament.name}</p>
                                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Budget: {selectedTournament.budgetPerTeam.toLocaleString()} | Squad: {selectedTournament.squadSize}</p>
                                </div>
                                <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>
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
                        <div className="grid grid-cols-2 gap-4">
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
        if (!liveTournament) return;
        try {
            const response = await fetch('/api/auction/select-player', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id, playerId }),
            });
            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Failed to select player');
            }
            // Pusher will handle real-time updates, no need to refresh
        } catch (error) {
            console.error('Failed to select player:', error);
            setError('An error occurred while selecting the player');
        }
    };

    const handleSpinWheel = async () => {
        if (isSpinning || !liveTournament) return;
        const tournamentId = liveTournament._id;
        setIsSpinning(true);
        setDisplayMode('wheel-spin');
        displayModeRef.current = 'wheel-spin';
        try {
            const res = await fetch('/api/overlay/spin', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId }),
            });
            if (!res.ok) {
                const { error } = await res.json().catch(() => ({}));
                setError(error || 'Spin failed');
                setIsSpinning(false);
                setDisplayMode('standard');
                displayModeRef.current = 'standard';
                return;
            }
            const { winnerId } = await res.json();
            // Auto-select winner after spin (8s) + buffer (200ms)
            spinTimerRef.current = setTimeout(async () => {
                await fetch('/api/auction/select-player', {
                    method: 'POST',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tournamentId, playerId: winnerId }),
                }).catch(() => {});
                // Reset overlay to standard after hold period (3s)
                resetTimerRef.current = setTimeout(async () => {
                    setDisplayMode('standard');
                    displayModeRef.current = 'standard';
                    setIsSpinning(false);
                    await sendOverlaySettings(overlaySize, tickerMode, 'standard');
                }, 3000);
            }, 8200);
        } catch {
            setIsSpinning(false);
            setDisplayMode('standard');
            displayModeRef.current = 'standard';
            setError('Spin failed');
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
        console.log('handleBid called with amount:', amount);

        if (!liveTournament) return;

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

        try {
            console.log('Sending bid request:', { tournamentId: liveTournament._id, amount });
            const response = await fetch('/api/auction/bid', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId: liveTournament._id,
                    teamId,
                    amount,
                }),
            });
            console.log('Bid response status:', response.status);
            if (!response.ok) {
                const data = await response.json();
                console.log('Bid error:', data);
                setError(data.error || 'Failed to place bid');
            }
            // Pusher will handle real-time updates, no need to refresh
        } catch (error) {
            console.error('Failed to place bid:', error);
            setError('An error occurred while placing the bid');
        }
    };

    const handleCorrectBid = async (amount: number) => {
        if (!liveTournament) return;
        try {
            const response = await fetch('/api/auction/bid/correct', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId: liveTournament._id, amount }),
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
        console.log('handleSell called with team:', biddingTeamId);
        if (!liveTournament) {
            console.log('No live tournament');
            return;
        }
        if (!biddingTeamId) {
            setError('Please select a winning team before selling');
            return;
        }
        try {
            console.log('Sending sell request for tournament:', liveTournament._id, 'team:', biddingTeamId);
            const response = await fetch('/api/auction/sell', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId: liveTournament._id,
                    teamId: biddingTeamId,
                }),
            });
            console.log('Sell response status:', response.status);
            if (!response.ok) {
                const data = await response.json();
                console.log('Sell error:', data);
                setError(data.error || 'Failed to sell player');
            }
            // Pusher will handle real-time updates, no need to refresh
        } catch (error) {
            console.error('Failed to sell player:', error);
            setError('An error occurred while selling the player');
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
            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Failed to reset auction');
                return;
            }
            // Pusher will handle real-time updates, no need to refresh
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
            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Failed to reset all sales');
                return;
            }
            // Pusher will handle real-time updates, no need to refresh
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

    return (
        <div className="animate-fade-in space-y-4">
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

            {/* Auction Header */}
            <div className="border border-[var(--border-primary)] rounded-lg p-4" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {isAuctionStopped ? (
                                <>
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wide">Auction Stopped</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-green-400 font-semibold text-sm uppercase tracking-wide">Live Auction</span>
                                </>
                            )}
                        </div>
                        <div className="h-6 w-px" style={{ backgroundColor: 'var(--border-primary)' }}></div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                        <div className="h-6 w-px" style={{ backgroundColor: 'var(--border-primary)' }}></div>
                        <div>
                            <p className="text-xl font-bold text-[var(--brand-primary)]">{liveTournament.name}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">
                                Budget: {liveTournament.budgetPerTeam.toLocaleString()} | Squad: {liveTournament.squadSize} | Base Price: {liveTournament.basePricePerPlayer.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {!isAuctionStopped && (
                            <button onClick={handleStopAuction} className="text-white font-bold py-2 px-4 rounded-lg transition-colors hover:opacity-80 text-sm" style={{ backgroundColor: 'var(--status-danger)' }}>
                                ⏹ Stop
                            </button>
                        )}
                        {isAuctionStopped && (
                            <button onClick={handleRestartAuction} className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/80 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Restart
                            </button>
                        )}
                        <button onClick={() => setShowCompleteConfirm(true)} className="text-white font-bold py-2 px-4 rounded-lg transition-colors hover:opacity-80 text-sm" style={{ backgroundColor: 'var(--status-info)' }}>
                            ✓ Complete
                        </button>
                    </div>
                </div>
                {isAuctionStopped && (
                    <div className="mt-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md p-3 text-yellow-200 text-sm">
                        <p className="font-semibold mb-1">⚠️ Auction Paused</p>
                        <p className="text-yellow-300/80">
                            The auction has been stopped. You can view the current status or restart the auction to continue selling remaining players.
                        </p>
                    </div>
                )}

            </div>

            {/* Auction Control Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-9 gap-3 relative" style={{ height: 'calc(100vh - 18rem)' }}>
                <div className="xl:col-span-2 h-full">
                    <AvailablePlayersPanel
                        players={players}
                        tournament={liveTournament}
                        onSelectPlayer={handleSelectPlayer}
                        isAuctioning={isAuctioning}
                        currentPlayerId={currentPlayer?._id}
                        onReAuction={() => setShowReAuctionConfirm(true)}
                        reAuctioning={reAuctioning}
                    />
                </div>
                <div className="xl:col-span-5 h-full flex flex-col gap-3">
                    <CurrentAuctionPanel
                        currentPlayer={currentPlayer}
                        tournament={liveTournament}
                        teams={teams}
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
                    />
                    {/* Overlay Controls — spacious panel with room for future features */}
                    <div className="rounded-lg p-5 border border-[var(--border-primary)] flex-1 min-h-0" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                        <h3 className="font-bold text-sm uppercase tracking-widest mb-4" style={{ color: 'var(--text-tertiary)' }}>Overlay Controls</h3>
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>Player Card & Bid:</span>
                            {(['large', 'small'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        if (autoSwitchTimerRef.current) { clearTimeout(autoSwitchTimerRef.current); autoSwitchTimerRef.current = null; }
                                        setOverlaySize(s);
                                        sendOverlaySettings(s, tickerMode);
                                    }}
                                    className="px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-all"
                                    style={{
                                        backgroundColor: overlaySize === s ? 'var(--brand-primary)' : 'var(--surface-elevated)',
                                        color: overlaySize === s ? '#fff' : 'var(--text-secondary)',
                                        border: '1px solid var(--border-primary)',
                                    }}>{s}</button>
                            ))}
                            {/* Divider */}
                            <div className="w-px h-5 shrink-0" style={{ backgroundColor: 'var(--border-primary)' }} />
                            {/* Auto Switch toggle */}
                            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>Auto:</span>
                            <button
                                onClick={() => {
                                    const next = !autoSwitch;
                                    setAutoSwitch(next);
                                    if (!next && autoSwitchTimerRef.current) {
                                        clearTimeout(autoSwitchTimerRef.current);
                                        autoSwitchTimerRef.current = null;
                                    }
                                }}
                                className="text-xs px-3 py-1.5 rounded-md font-semibold transition-all"
                                style={{
                                    backgroundColor: autoSwitch ? 'var(--brand-primary)' : 'var(--surface-elevated)',
                                    color: autoSwitch ? '#fff' : 'var(--text-muted)',
                                    border: `1px solid ${autoSwitch ? 'var(--brand-primary)' : 'var(--border-primary)'}`,
                                }}
                            >{autoSwitch ? 'ON' : 'OFF'}</button>
                            {/* Duration — only shown when Auto Switch is ON */}
                            {autoSwitch && (
                                <>
                                    <input
                                        type="number"
                                        min={1}
                                        max={60}
                                        value={autoSwitchDuration}
                                        onChange={e => setAutoSwitchDuration(Math.max(1, Math.min(60, Number(e.target.value))))}
                                        className="w-14 text-center text-xs px-2 py-1.5 rounded-md border"
                                        style={{
                                            backgroundColor: 'var(--surface-elevated)',
                                            borderColor: 'var(--border-primary)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                    <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>sec</span>
                                </>
                            )}
                            {/* Divider */}
                            <div className="w-px h-5 shrink-0" style={{ backgroundColor: 'var(--border-primary)' }} />
                            {/* Player Card visibility toggle */}
                            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>Player Card:</span>
                            <button
                                onClick={() => {
                                    const next = !hidePremiumCard;
                                    setHidePremiumCard(next);
                                    sendOverlaySettings(overlaySize, tickerMode, displayMode, next);
                                }}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
                                style={{
                                    backgroundColor: hidePremiumCard ? 'var(--status-danger)' : 'var(--surface-elevated)',
                                    color: hidePremiumCard ? '#fff' : 'var(--text-secondary)',
                                    border: `1px solid ${hidePremiumCard ? 'var(--status-danger)' : 'var(--border-primary)'}`,
                                }}
                            >
                                <span>{hidePremiumCard ? 'Hidden' : 'Visible'}</span>
                                {hidePremiumCard && (
                                    <span className="w-2 h-2 rounded-full bg-red-300 animate-pulse" />
                                )}
                            </button>
                            {hidePremiumCard && (
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Card hidden on OBS overlay
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>Ticker Option:</span>
                            {([
                                { value: 'all',       label: 'All Players'       },
                                { value: 'sold',      label: 'Sold Players'      },
                                { value: 'available', label: 'Available Players' },
                            ] as const).map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => { setTickerMode(value); sendOverlaySettings(overlaySize, value); }}
                                    className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
                                    style={{
                                        backgroundColor: tickerMode === value ? 'var(--brand-primary)' : 'var(--surface-elevated)',
                                        color: tickerMode === value ? '#fff' : 'var(--text-secondary)',
                                        border: '1px solid var(--border-primary)',
                                    }}>{label}</button>
                            ))}
                            {/* Divider */}
                            <div className="w-px h-5 shrink-0" style={{ backgroundColor: 'var(--border-primary)' }} />
                            {/* Custom Ticker */}
                            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>Custom Ticker:</span>
                            <button
                                onClick={() => {
                                    const next = displayMode === 'custom-ticker' ? 'standard' : 'custom-ticker';
                                    setDisplayMode(next);
                                    sendOverlaySettings(overlaySize, tickerMode, next);
                                }}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
                                style={{
                                    backgroundColor: displayMode === 'custom-ticker' ? '#0891B2' : 'var(--surface-elevated)',
                                    color: displayMode === 'custom-ticker' ? '#fff' : 'var(--text-secondary)',
                                    border: '1px solid var(--border-primary)',
                                }}
                            >
                                <span>{displayMode === 'custom-ticker' ? 'Hide' : 'Show'}</span>
                                {displayMode === 'custom-ticker' && (
                                    <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                                )}
                            </button>
                            <button
                                onClick={() => setShowTickerModal(true)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-semibold transition-all"
                                style={{
                                    backgroundColor: 'var(--surface-elevated)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-primary)',
                                }}
                                title="Edit Custom Ticker lines"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                            </button>
                            {/* Divider */}
                            <div className="w-px h-5 shrink-0" style={{ backgroundColor: 'var(--border-primary)' }} />
                            {/* Hide Ticker */}
                            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>Hide Ticker:</span>
                            <button
                                onClick={() => {
                                    const next = !hideTickerCustom;
                                    setHideTickerCustom(next);
                                    hideTickerCustomRef.current = next;
                                    sendOverlaySettings(overlaySize, tickerMode);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-semibold transition-all"
                                style={{
                                    backgroundColor: hideTickerCustom ? 'var(--status-danger)' : 'var(--surface-elevated)',
                                    color: hideTickerCustom ? '#fff' : 'var(--text-secondary)',
                                    border: `1px solid ${hideTickerCustom ? 'var(--status-danger)' : 'var(--border-primary)'}`,
                                }}
                                title="Hide ticker on Custom Overlay (Screen 1)"
                            >
                                Screen 1
                            </button>
                            <button
                                onClick={() => {
                                    const next = !hideTickerFullscreen;
                                    setHideTickerFullscreen(next);
                                    hideTickerFullscreenRef.current = next;
                                    sendOverlaySettings(overlaySize, tickerMode);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-semibold transition-all"
                                style={{
                                    backgroundColor: hideTickerFullscreen ? 'var(--status-danger)' : 'var(--surface-elevated)',
                                    color: hideTickerFullscreen ? '#fff' : 'var(--text-secondary)',
                                    border: `1px solid ${hideTickerFullscreen ? 'var(--status-danger)' : 'var(--border-primary)'}`,
                                }}
                                title="Hide ticker on FullScreen Overlays (Screen 2)"
                            >
                                Screen 2
                            </button>
                        </div>
                        {/* Row 2: Player Summary · Team Summary · Top 10 Sold · Custom Ticker */}
                        <div className="flex items-center gap-3 mt-4 pt-4 flex-wrap" style={{ borderTop: '1px solid var(--border-primary)' }}>
                            {/* Player Summary */}
                            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>Player Summary:</span>
                            <button
                                onClick={() => {
                                    const next = displayMode === 'sold-summary' ? 'standard' : 'sold-summary';
                                    setDisplayMode(next);
                                    sendOverlaySettings(overlaySize, tickerMode, next);
                                }}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
                                style={{
                                    backgroundColor: displayMode === 'sold-summary' ? 'var(--brand-primary)' : 'var(--surface-elevated)',
                                    color: displayMode === 'sold-summary' ? '#fff' : 'var(--text-secondary)',
                                    border: '1px solid var(--border-primary)',
                                }}
                            >
                                <span>Show</span>
                                {displayMode === 'sold-summary' && (
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                )}
                            </button>
                            {/* Divider */}
                            <div className="w-px h-5 shrink-0" style={{ backgroundColor: 'var(--border-primary)' }} />
                            {/* Team Summary */}
                            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>Team Summary:</span>
                            <button
                                onClick={() => {
                                    const next = displayMode === 'team-summary' ? 'standard' : 'team-summary';
                                    setDisplayMode(next);
                                    sendOverlaySettings(overlaySize, tickerMode, next);
                                }}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
                                style={{
                                    backgroundColor: displayMode === 'team-summary' ? 'var(--brand-primary)' : 'var(--surface-elevated)',
                                    color: displayMode === 'team-summary' ? '#fff' : 'var(--text-secondary)',
                                    border: '1px solid var(--border-primary)',
                                }}
                            >
                                <span>Show</span>
                                {displayMode === 'team-summary' && (
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                )}
                            </button>
                            {/* Divider */}
                            <div className="w-px h-5 shrink-0" style={{ backgroundColor: 'var(--border-primary)' }} />
                            {/* Top 10 Sold */}
                            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>Top 10 Sold:</span>
                            <button
                                onClick={() => {
                                    const next = displayMode === 'top10-summary' ? 'standard' : 'top10-summary';
                                    setDisplayMode(next);
                                    sendOverlaySettings(overlaySize, tickerMode, next);
                                }}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
                                style={{
                                    backgroundColor: displayMode === 'top10-summary' ? '#D97706' : 'var(--surface-elevated)',
                                    color: displayMode === 'top10-summary' ? '#fff' : 'var(--text-secondary)',
                                    border: '1px solid var(--border-primary)',
                                }}
                            >
                                <span>Show</span>
                                {displayMode === 'top10-summary' && (
                                    <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                                )}
                            </button>
                            {/* Divider */}
                            <div className="w-px h-5 shrink-0" style={{ backgroundColor: 'var(--border-primary)' }} />
                            {/* Team Wise Summary */}
                            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>Team Wise:</span>
                            <button
                                onClick={() => {
                                    const next = displayMode === 'team-wise-summary' ? 'standard' : 'team-wise-summary';
                                    setDisplayMode(next);
                                    sendOverlaySettings(overlaySize, tickerMode, next);
                                }}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
                                style={{
                                    backgroundColor: displayMode === 'team-wise-summary' ? 'var(--brand-primary)' : 'var(--surface-elevated)',
                                    color: displayMode === 'team-wise-summary' ? '#fff' : 'var(--text-secondary)',
                                    border: '1px solid var(--border-primary)',
                                }}
                            >
                                <span>Show</span>
                                {displayMode === 'team-wise-summary' && (
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                )}
                            </button>
                            {(displayMode === 'sold-summary' || displayMode === 'team-summary' || displayMode === 'team-wise-summary' || displayMode === 'top10-summary') && (
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Player Card &amp; Teams hidden
                                </span>
                            )}
                        </div>
                        {/* Row 3: Sold Message position */}
                        <div className="flex items-center gap-3 mt-4 pt-4 flex-wrap" style={{ borderTop: '1px solid var(--border-primary)' }}>
                            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>Sold Message:</span>
                            <select
                                value={soldMessagePosition}
                                onChange={e => {
                                    const pos = e.target.value as typeof soldMessagePosition;
                                    setSoldMessagePosition(pos);
                                    sendOverlaySettings(overlaySize, tickerMode, displayMode, hidePremiumCard, customTickerLine1, customTickerLine2, pos);
                                }}
                                className="px-3 py-1.5 rounded-md text-sm font-semibold transition-all"
                                style={{
                                    backgroundColor: 'var(--surface-elevated)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-primary)',
                                    cursor: 'pointer',
                                    outline: 'none',
                                }}
                            >
                                <option value="bottom-right">▼ Right · Bottom</option>
                                <option value="bottom-left">▼ Left · Bottom</option>
                                <option value="top-right">▲ Right · Top</option>
                                <option value="top-left">▲ Left · Top</option>
                            </select>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Toast corner position</span>
                        </div>
                        {/* Row 4: Resting Time */}
                        <div className="flex items-center gap-3 mt-4 pt-4 flex-wrap" style={{ borderTop: '1px solid var(--border-primary)' }}>
                            {/* Resting Time */}
                            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>Resting Time:</span>
                            <button
                                onClick={() => {
                                    const next = displayMode === 'resting' ? 'standard' : 'resting';
                                    setDisplayMode(next);
                                    sendOverlaySettings(overlaySize, tickerMode, next);
                                }}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
                                style={{
                                    backgroundColor: displayMode === 'resting' ? '#8B5CF6' : 'var(--surface-elevated)',
                                    color: displayMode === 'resting' ? '#fff' : 'var(--text-secondary)',
                                    border: '1px solid var(--border-primary)',
                                }}
                            >
                                <span>Show</span>
                                {displayMode === 'resting' && (
                                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                                )}
                            </button>
                            {displayMode === 'resting' && (
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Player Card &amp; Teams hidden
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Custom Ticker Modal */}
                {showTickerModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                        onClick={() => setShowTickerModal(false)}
                    >
                        <div
                            className="rounded-xl p-6 w-full max-w-md shadow-2xl"
                            style={{
                                backgroundColor: 'var(--surface-secondary)',
                                border: '1px solid var(--border-primary)',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                                Custom Ticker Lines
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        Line 1
                                    </label>
                                    <input
                                        type="text"
                                        value={customTickerLine1}
                                        onChange={e => setCustomTickerLine1(e.target.value)}
                                        placeholder="Enter line 1..."
                                        className="w-full px-3 py-2 rounded-lg text-sm"
                                        style={{
                                            backgroundColor: 'var(--surface-elevated)',
                                            border: '1px solid var(--border-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        Line 2
                                    </label>
                                    <input
                                        type="text"
                                        value={customTickerLine2}
                                        onChange={e => setCustomTickerLine2(e.target.value)}
                                        placeholder="Enter line 2..."
                                        className="w-full px-3 py-2 rounded-lg text-sm"
                                        style={{
                                            backgroundColor: 'var(--surface-elevated)',
                                            border: '1px solid var(--border-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>
                            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                                If both lines have text, they will alternate every 5 seconds on the overlay.
                            </p>
                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={() => {
                                        sendOverlaySettings(overlaySize, tickerMode, displayMode, hidePremiumCard, customTickerLine1, customTickerLine2);
                                        setShowTickerModal(false);
                                    }}
                                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                                    style={{ backgroundColor: '#0891B2', color: '#fff' }}
                                >
                                    Update
                                </button>
                                <button
                                    onClick={() => setShowTickerModal(false)}
                                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                                    style={{
                                        backgroundColor: 'var(--surface-elevated)',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--border-primary)',
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="xl:col-span-2 h-full">
                    <TeamsAndSoldPlayersPanel
                        teams={teams}
                        soldPlayers={soldPlayers}
                        unsoldPlayers={unsoldPlayers}
                        tournament={liveTournament}
                        winningTeamId={auctionState.winningTeamId}
                        currentBid={auctionState.currentBid ?? 0}
                        onUndo={handleUndo}
                        onCleanup={handleCleanupAll}
                    />
                </div>
                {error && <div className="absolute bottom-4 right-4 text-center text-red-400 bg-red-900/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-red-700 animate-fade-in">{error}</div>}
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
