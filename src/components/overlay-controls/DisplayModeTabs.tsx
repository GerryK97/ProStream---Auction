import React from 'react';
import type { DisplayMode, SendOverlaySettings, TickerMode, OverlaySize, TeamOption } from './types';

interface DisplayModeTabsProps {
    displayMode: DisplayMode;
    setDisplayMode: (mode: DisplayMode) => void;
    overlaySize: OverlaySize;
    tickerMode: TickerMode;
    sendOverlaySettings: SendOverlaySettings;
    teamWiseTeamId: string | null;
    setTeamWiseTeamId: (id: string | null) => void;
    teamWiseTeamIdRef: React.MutableRefObject<string | null>;
    teams: TeamOption[];
    onOpenCustomTickerModal: () => void;
}

type ModeDef = {
    value: Exclude<DisplayMode, 'wheel-spin'>;
    label: string;
    accent: string;
};

const MODES: ModeDef[] = [
    { value: 'standard',           label: 'Standard',         accent: 'var(--status-success)' },
    { value: 'sold-summary',       label: 'Player Summary',   accent: 'var(--brand-primary)' },
    { value: 'team-summary',       label: 'Team Summary',     accent: 'var(--brand-primary)' },
    { value: 'top10-summary',      label: 'Top 10 Sold',      accent: '#D97706' },
    { value: 'team-wise-summary',  label: 'Team-wise',        accent: 'var(--brand-primary)' },
    { value: 'custom-ticker',      label: 'Custom Ticker',    accent: '#0891B2' },
    { value: 'resting',            label: 'Resting Time',     accent: 'var(--accent-color)' },
];

export default function DisplayModeTabs({
    displayMode,
    setDisplayMode,
    overlaySize,
    tickerMode,
    sendOverlaySettings,
    teamWiseTeamId,
    setTeamWiseTeamId,
    teamWiseTeamIdRef,
    teams,
    onOpenCustomTickerModal,
}: DisplayModeTabsProps) {
    const handleSelect = (mode: Exclude<DisplayMode, 'wheel-spin'>) => {
        setDisplayMode(mode);
        sendOverlaySettings(overlaySize, tickerMode, mode);
    };

    return (
        <div className="mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Display Mode
            </h3>
            <div className="flex flex-wrap gap-2">
                {MODES.map(({ value, label, accent }) => {
                    const active = displayMode === value;
                    return (
                        <button
                            key={value}
                            onClick={() => handleSelect(value)}
                            className="relative px-4 py-2 rounded-md text-sm font-semibold transition-all"
                            style={{
                                backgroundColor: active ? accent : 'var(--surface-elevated)',
                                color: active ? '#fff' : 'var(--text-secondary)',
                                border: `1px solid ${active ? accent : 'var(--border-primary)'}`,
                                boxShadow: active ? `0 0 0 2px color-mix(in oklab, ${accent} 25%, transparent)` : 'none',
                            }}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Mode context row — mode-specific sub-controls */}
            {displayMode === 'team-wise-summary' && (
                <div
                    className="mt-3 flex items-center gap-3 rounded-md px-3 py-2 flex-wrap"
                    style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}
                >
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                        Team filter:
                    </span>
                    <select
                        value={teamWiseTeamId ?? ''}
                        onChange={e => {
                            const val = e.target.value || null;
                            setTeamWiseTeamId(val);
                            teamWiseTeamIdRef.current = val;
                            sendOverlaySettings(overlaySize, tickerMode, 'team-wise-summary');
                        }}
                        className="text-sm rounded-md px-2 py-1.5 font-semibold"
                        style={{
                            backgroundColor: 'var(--surface-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-primary)',
                            outline: 'none',
                            maxWidth: 180,
                        }}
                    >
                        <option value="">All Teams (aggregate)</option>
                        {[...teams].sort((a, b) => a.name.localeCompare(b.name)).map(t => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                    </select>
                    {!teamWiseTeamId && (
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            Showing aggregate summary across all teams
                        </span>
                    )}
                </div>
            )}

            {displayMode === 'custom-ticker' && (
                <div
                    className="mt-3 flex items-center gap-3 rounded-md px-3 py-2 flex-wrap"
                    style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}
                >
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                        Custom ticker text:
                    </span>
                    <button
                        onClick={onOpenCustomTickerModal}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                        style={{
                            backgroundColor: '#0891B2',
                            color: '#fff',
                            border: '1px solid #0891B2',
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit lines
                    </button>
                </div>
            )}
        </div>
    );
}
