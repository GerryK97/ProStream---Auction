'use client';

import React, { useState } from 'react';
import type { AuctionLayoutMode, AuctionSectionKey, AuctionSectionVisibility } from './types';
import { SECTION_TOGGLE_LABELS } from './types';

const SectionToggleButton: React.FC<{
    label: string;
    active: boolean;
    onClick: () => void;
}> = ({ label, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className="text-xs font-semibold px-2.5 py-1 rounded-md transition-all border"
        style={{
            backgroundColor: active ? 'color-mix(in oklab, var(--brand-primary) 18%, transparent)' : 'var(--surface-elevated)',
            color: active ? 'var(--brand-primary)' : 'var(--text-tertiary)',
            borderColor: active ? 'color-mix(in oklab, var(--brand-primary) 45%, transparent)' : 'var(--border-primary)',
        }}
    >
        {label}
    </button>
);

export interface AuctionHeaderBarProps {
    layoutMode: AuctionLayoutMode;
    isAuctionStopped: boolean;
    isConnected: boolean;
    tournamentName: string;
    budgetPerTeam: number;
    squadSize: number;
    basePricePerPlayer: number;
    availableCount: number;
    soldCount: number;
    unsoldCount: number;
    onStop: () => void;
    onRestart: () => void;
    onComplete: () => void;
    sectionVisibility?: AuctionSectionVisibility;
    onToggleSection?: (key: AuctionSectionKey) => void;
}

export default function AuctionHeaderBar({
    layoutMode,
    isAuctionStopped,
    isConnected,
    tournamentName,
    budgetPerTeam,
    squadSize,
    basePricePerPlayer,
    availableCount,
    soldCount,
    unsoldCount,
    onStop,
    onRestart,
    onComplete,
    sectionVisibility,
    onToggleSection,
}: AuctionHeaderBarProps) {
    const [contextExpanded, setContextExpanded] = useState(false);
    const showSectionToggles = layoutMode === 'wide' && sectionVisibility && onToggleSection;
    const collapseContext = layoutMode === 'focused';

    return (
        <div className="border border-[var(--border-primary)] rounded-lg p-3 sm:p-4 min-w-0" style={{ backgroundColor: 'var(--surface-secondary)' }}>
            {/* Tier 1: status bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 shrink-0">
                        {isAuctionStopped ? (
                            <>
                                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                                <span className="text-yellow-400 font-semibold text-xs sm:text-sm uppercase tracking-wide">Stopped</span>
                            </>
                        ) : (
                            <>
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-green-400 font-semibold text-xs sm:text-sm uppercase tracking-wide">Live</span>
                            </>
                        )}
                    </div>
                    <div className="hidden sm:block h-5 w-px shrink-0" style={{ backgroundColor: 'var(--border-primary)' }} />
                    <div className="flex items-center gap-1.5 shrink-0">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                            {isConnected ? 'Connected' : 'Offline'}
                        </span>
                    </div>
                    <div className="hidden md:block h-5 w-px shrink-0" style={{ backgroundColor: 'var(--border-primary)' }} />
                    <p className="font-bold text-[var(--brand-primary)] truncate min-w-0 text-sm sm:text-base md:max-w-[40%] lg:max-w-none">
                        {tournamentName}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {!isAuctionStopped && (
                        <button
                            type="button"
                            onClick={onStop}
                            className="text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg transition-colors hover:opacity-80 text-xs sm:text-sm"
                            style={{ backgroundColor: 'var(--status-danger)' }}
                        >
                            Stop
                        </button>
                    )}
                    {isAuctionStopped && (
                        <button
                            type="button"
                            onClick={onRestart}
                            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/80 text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg transition-colors flex items-center gap-2 text-xs sm:text-sm"
                        >
                            Restart
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onComplete}
                        className="text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg transition-colors hover:opacity-80 text-xs sm:text-sm"
                        style={{ backgroundColor: 'var(--status-info)' }}
                    >
                        Complete
                    </button>
                </div>
            </div>

            {/* Tier 2: context bar */}
            {collapseContext ? (
                <div className="mt-2 pt-2 border-t border-[var(--border-primary)]">
                    <button
                        type="button"
                        onClick={() => setContextExpanded(v => !v)}
                        className="flex items-center justify-between w-full text-xs font-semibold"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <span>{availableCount} avail · {soldCount} sold · {unsoldCount} unsold</span>
                        <span>{contextExpanded ? '▲' : '▼'}</span>
                    </button>
                    {contextExpanded && (
                        <div className="mt-2 space-y-2">
                            <p className="text-xs text-[var(--text-tertiary)]">
                                Budget: {budgetPerTeam.toLocaleString()} | Squad: {squadSize} | Base: {basePricePerPlayer.toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="mt-2 pt-2 border-t border-[var(--border-primary)] space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-tertiary)]">
                        <span>Budget: {budgetPerTeam.toLocaleString()}</span>
                        <span>Squad: {squadSize}</span>
                        <span>Base: {basePricePerPlayer.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>
                            {availableCount} Available
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--status-success)', border: '1px solid var(--border-primary)' }}>
                            {soldCount} Sold
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--status-danger)', border: '1px solid var(--border-primary)' }}>
                            {unsoldCount} Unsold
                        </span>
                    </div>
                    {showSectionToggles && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>Panels:</span>
                            {(Object.keys(SECTION_TOGGLE_LABELS) as AuctionSectionKey[]).map(key => (
                                <SectionToggleButton
                                    key={key}
                                    label={SECTION_TOGGLE_LABELS[key]}
                                    active={sectionVisibility![key]}
                                    onClick={() => onToggleSection!(key)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {isAuctionStopped && (
                <div className="mt-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md p-3 text-yellow-200 text-sm">
                    <p className="font-semibold mb-1">Auction Paused</p>
                    <p className="text-yellow-300/80 text-xs sm:text-sm">
                        The auction has been stopped. Restart to continue selling remaining players.
                    </p>
                </div>
            )}
        </div>
    );
}
