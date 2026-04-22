import React from 'react';
import type { OverlaySize, SendOverlaySettings, TeamCardPosition, TeamCardSize, TickerMode } from './types';

interface TeamCardsGroupProps {
    hideTeamCards: boolean;
    setHideTeamCards: (v: boolean) => void;
    hideTeamCardsRef: React.MutableRefObject<boolean>;
    teamCardSize: TeamCardSize;
    setTeamCardSize: (s: TeamCardSize) => void;
    teamCardSizeRef: React.MutableRefObject<TeamCardSize>;
    teamCardPosition: TeamCardPosition;
    setTeamCardPosition: (p: TeamCardPosition) => void;
    teamCardPositionRef: React.MutableRefObject<TeamCardPosition>;
    overlaySize: OverlaySize;
    tickerMode: TickerMode;
    sendOverlaySettings: SendOverlaySettings;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
            {children}
        </span>
    );
}

export default function TeamCardsGroup({
    hideTeamCards,
    setHideTeamCards,
    hideTeamCardsRef,
    teamCardSize,
    setTeamCardSize,
    teamCardSizeRef,
    teamCardPosition,
    setTeamCardPosition,
    teamCardPositionRef,
    overlaySize,
    tickerMode,
    sendOverlaySettings,
}: TeamCardsGroupProps) {
    const disabled = hideTeamCards;

    return (
        <div
            className="rounded-lg p-4"
            style={{
                backgroundColor: 'var(--surface-elevated)',
                border: '1px solid var(--border-primary)',
            }}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-secondary)' }}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Team Cards</h4>
                </div>
                <button
                    onClick={() => {
                        const next = !hideTeamCards;
                        setHideTeamCards(next);
                        hideTeamCardsRef.current = next;
                        sendOverlaySettings(overlaySize, tickerMode);
                    }}
                    className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold transition-all"
                    style={{
                        backgroundColor: hideTeamCards ? 'var(--status-danger)' : 'color-mix(in oklab, var(--status-success) 18%, var(--surface-secondary))',
                        color: hideTeamCards ? '#fff' : 'var(--status-success)',
                        border: `1px solid ${hideTeamCards ? 'var(--status-danger)' : 'color-mix(in oklab, var(--status-success) 40%, var(--border-primary))'}`,
                    }}
                >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
                    {hideTeamCards ? 'Hidden' : 'Visible'}
                </button>
            </div>

            <div className={`space-y-3 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div>
                    <SectionLabel>Size</SectionLabel>
                    <div className="flex items-center rounded-md overflow-hidden mt-1" style={{ border: '1px solid var(--border-primary)' }}>
                        {(['small', 'medium', 'large'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => {
                                    setTeamCardSize(s);
                                    teamCardSizeRef.current = s;
                                    sendOverlaySettings(overlaySize, tickerMode);
                                }}
                                className="flex-1 px-3 py-1.5 text-xs font-semibold capitalize transition-all"
                                style={{
                                    backgroundColor: teamCardSize === s ? 'var(--brand-primary)' : 'var(--surface-secondary)',
                                    color: teamCardSize === s ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <SectionLabel>Position</SectionLabel>
                    <div className="flex items-center rounded-md overflow-hidden mt-1" style={{ border: '1px solid var(--border-primary)' }}>
                        {([
                            { value: 'top-right',    label: 'Top Right'    },
                            { value: 'bottom-right', label: 'Bottom Right' },
                        ] as const).map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => {
                                    setTeamCardPosition(value);
                                    teamCardPositionRef.current = value;
                                    sendOverlaySettings(overlaySize, tickerMode);
                                }}
                                className="flex-1 px-3 py-1.5 text-xs font-semibold transition-all"
                                style={{
                                    backgroundColor: teamCardPosition === value ? 'var(--brand-primary)' : 'var(--surface-secondary)',
                                    color: teamCardPosition === value ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
