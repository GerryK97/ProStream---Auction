import React from 'react';
import type { DisplayMode, OverlaySize, TickerMode } from './types';

const DISPLAY_MODE_LABEL: Record<DisplayMode, string> = {
    'standard': 'Standard',
    'sold-summary': 'Player Summary',
    'team-summary': 'Team Summary',
    'top10-summary': 'Top 10 Sold',
    'team-wise-summary': 'Team-wise Summary',
    'custom-ticker': 'Custom Ticker',
    'resting': 'Resting Time',
    'wheel-spin': 'Wheel Spin',
};

const DISPLAY_MODE_DOT: Partial<Record<DisplayMode, string>> = {
    'standard': 'var(--status-success)',
    'sold-summary': 'var(--brand-primary)',
    'team-summary': 'var(--brand-primary)',
    'top10-summary': 'var(--accent-premium, #D97706)',
    'team-wise-summary': 'var(--brand-primary)',
    'custom-ticker': '#0891B2',
    'resting': 'var(--accent-color)',
    'wheel-spin': 'var(--accent-color)',
};

const TICKER_LABEL: Record<TickerMode, string> = {
    'all': 'All Players',
    'sold': 'Sold Players',
    'available': 'Available Players',
};

interface StatusStripProps {
    displayMode: DisplayMode;
    overlaySize: OverlaySize;
    tickerMode: TickerMode;
    hidePremiumCard: boolean;
    hideTeamCards: boolean;
    hideTickerCustom: boolean;
    hideTickerFullscreen: boolean;
}

function HiddenPill({ label }: { label: string }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{
                backgroundColor: 'color-mix(in oklab, var(--status-danger) 15%, transparent)',
                color: 'var(--status-danger)',
                border: '1px solid color-mix(in oklab, var(--status-danger) 30%, transparent)',
            }}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            {label}
        </span>
    );
}

export default function StatusStrip({
    displayMode,
    overlaySize,
    tickerMode,
    hidePremiumCard,
    hideTeamCards,
    hideTickerCustom,
    hideTickerFullscreen,
}: StatusStripProps) {
    const isStandard = displayMode === 'standard';
    const suppressesStandard =
        displayMode === 'sold-summary' ||
        displayMode === 'team-summary' ||
        displayMode === 'top10-summary' ||
        displayMode === 'team-wise-summary' ||
        displayMode === 'resting';

    return (
        <div
            className="rounded-lg px-4 py-3 mb-4"
            style={{
                backgroundColor: 'var(--surface-elevated)',
                border: '1px solid var(--border-primary)',
            }}
        >
            <div className="flex items-center gap-3 flex-wrap">
                <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                        backgroundColor: DISPLAY_MODE_DOT[displayMode] ?? 'var(--text-muted)',
                        boxShadow: `0 0 10px ${DISPLAY_MODE_DOT[displayMode] ?? 'var(--text-muted)'}`,
                        animation: 'pulse 2s infinite',
                    }}
                />
                <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-tertiary)' }}>
                    Now broadcasting
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {DISPLAY_MODE_LABEL[displayMode]}
                </span>
                {isStandard && (
                    <>
                        <span style={{ color: 'var(--border-primary)' }}>·</span>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            Card: <span className="font-semibold capitalize" style={{ color: 'var(--text-secondary)' }}>{overlaySize}</span>
                        </span>
                        <span style={{ color: 'var(--border-primary)' }}>·</span>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            Ticker: <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{TICKER_LABEL[tickerMode]}</span>
                        </span>
                    </>
                )}
            </div>

            {(hidePremiumCard || hideTeamCards || hideTickerCustom || hideTickerFullscreen || suppressesStandard) && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {suppressesStandard && (
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            Player Card &amp; Teams hidden in this mode
                        </span>
                    )}
                    {hidePremiumCard && isStandard && <HiddenPill label="Player Card hidden" />}
                    {hideTeamCards && isStandard && <HiddenPill label="Team Cards hidden" />}
                    {hideTickerCustom && <HiddenPill label="Ticker off · Screen 1" />}
                    {hideTickerFullscreen && <HiddenPill label="Ticker off · Screen 2" />}
                </div>
            )}
        </div>
    );
}
