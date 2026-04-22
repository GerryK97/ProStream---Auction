import React from 'react';
import type { OverlaySize, SendOverlaySettings, TickerMode, DisplayMode } from './types';

interface PlayerCardGroupProps {
    overlaySize: OverlaySize;
    setOverlaySize: (s: OverlaySize) => void;
    hidePremiumCard: boolean;
    setHidePremiumCard: (v: boolean) => void;
    autoSwitch: boolean;
    setAutoSwitch: (v: boolean) => void;
    autoSwitchDuration: number;
    setAutoSwitchDuration: (n: number) => void;
    autoSwitchTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
    tickerMode: TickerMode;
    displayMode: DisplayMode;
    sendOverlaySettings: SendOverlaySettings;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
            {children}
        </span>
    );
}

export default function PlayerCardGroup({
    overlaySize,
    setOverlaySize,
    hidePremiumCard,
    setHidePremiumCard,
    autoSwitch,
    setAutoSwitch,
    autoSwitchDuration,
    setAutoSwitchDuration,
    autoSwitchTimerRef,
    tickerMode,
    displayMode,
    sendOverlaySettings,
}: PlayerCardGroupProps) {
    const disabled = hidePremiumCard;

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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-primary)' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Player Card</h4>
                </div>
                <button
                    onClick={() => {
                        const next = !hidePremiumCard;
                        setHidePremiumCard(next);
                        sendOverlaySettings(overlaySize, tickerMode, displayMode, next);
                    }}
                    className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold transition-all"
                    style={{
                        backgroundColor: hidePremiumCard ? 'var(--status-danger)' : 'color-mix(in oklab, var(--status-success) 18%, var(--surface-secondary))',
                        color: hidePremiumCard ? '#fff' : 'var(--status-success)',
                        border: `1px solid ${hidePremiumCard ? 'var(--status-danger)' : 'color-mix(in oklab, var(--status-success) 40%, var(--border-primary))'}`,
                    }}
                >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
                    {hidePremiumCard ? 'Hidden' : 'Visible'}
                </button>
            </div>

            <div className={`space-y-3 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div>
                    <SectionLabel>Size</SectionLabel>
                    <div className="flex items-center rounded-md overflow-hidden mt-1" style={{ border: '1px solid var(--border-primary)' }}>
                        {(['large', 'small'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => {
                                    if (autoSwitchTimerRef.current) { clearTimeout(autoSwitchTimerRef.current); autoSwitchTimerRef.current = null; }
                                    setOverlaySize(s);
                                    sendOverlaySettings(s, tickerMode);
                                }}
                                className="flex-1 px-3 py-1.5 text-xs font-semibold capitalize transition-all"
                                style={{
                                    backgroundColor: overlaySize === s ? 'var(--brand-primary)' : 'var(--surface-secondary)',
                                    color: overlaySize === s ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <SectionLabel>Auto-switch size</SectionLabel>
                    <div className="flex items-center gap-2 mt-1">
                        <button
                            onClick={() => {
                                const next = !autoSwitch;
                                setAutoSwitch(next);
                                if (!next && autoSwitchTimerRef.current) {
                                    clearTimeout(autoSwitchTimerRef.current);
                                    autoSwitchTimerRef.current = null;
                                }
                            }}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                            style={{
                                backgroundColor: autoSwitch ? 'var(--brand-primary)' : 'var(--surface-secondary)',
                                color: autoSwitch ? '#fff' : 'var(--text-muted)',
                                border: `1px solid ${autoSwitch ? 'var(--brand-primary)' : 'var(--border-primary)'}`,
                                minWidth: 60,
                            }}
                        >
                            {autoSwitch ? 'ON' : 'OFF'}
                        </button>
                        {autoSwitch && (
                            <>
                                <input
                                    type="number"
                                    min={1}
                                    max={60}
                                    value={autoSwitchDuration}
                                    onChange={e => setAutoSwitchDuration(Math.max(1, Math.min(60, Number(e.target.value))))}
                                    className="w-16 text-center text-xs px-2 py-1.5 rounded-md"
                                    style={{
                                        backgroundColor: 'var(--surface-secondary)',
                                        border: '1px solid var(--border-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                    }}
                                />
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>sec</span>
                            </>
                        )}
                    </div>
                    {autoSwitch && (
                        <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                            Shrinks Large → Small after each new player
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
