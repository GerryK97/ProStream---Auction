import React from 'react';
import type { OverlaySize, SendOverlaySettings, TickerMode } from './types';

interface TickerGroupProps {
    tickerMode: TickerMode;
    setTickerMode: (m: TickerMode) => void;
    hideTickerCustom: boolean;
    setHideTickerCustom: (v: boolean) => void;
    hideTickerCustomRef: React.MutableRefObject<boolean>;
    hideTickerFullscreen: boolean;
    setHideTickerFullscreen: (v: boolean) => void;
    hideTickerFullscreenRef: React.MutableRefObject<boolean>;
    overlaySize: OverlaySize;
    sendOverlaySettings: SendOverlaySettings;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
            {children}
        </span>
    );
}

function HideCheckbox({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <button
            onClick={onChange}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
            style={{
                backgroundColor: checked ? 'color-mix(in oklab, var(--status-danger) 15%, var(--surface-secondary))' : 'var(--surface-secondary)',
                color: checked ? 'var(--status-danger)' : 'var(--text-secondary)',
                border: `1px solid ${checked ? 'color-mix(in oklab, var(--status-danger) 40%, var(--border-primary))' : 'var(--border-primary)'}`,
            }}
        >
            <span
                className="flex items-center justify-center w-4 h-4 rounded"
                style={{
                    backgroundColor: checked ? 'var(--status-danger)' : 'transparent',
                    border: `1.5px solid ${checked ? 'var(--status-danger)' : 'var(--border-primary)'}`,
                }}
            >
                {checked && (
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="#fff">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L8.5 11.836l6.543-6.543a1 1 0 011.664 0z" clipRule="evenodd" />
                    </svg>
                )}
            </span>
            Hide on {label}
        </button>
    );
}

export default function TickerGroup({
    tickerMode,
    setTickerMode,
    hideTickerCustom,
    setHideTickerCustom,
    hideTickerCustomRef,
    hideTickerFullscreen,
    setHideTickerFullscreen,
    hideTickerFullscreenRef,
    overlaySize,
    sendOverlaySettings,
}: TickerGroupProps) {
    return (
        <div
            className="rounded-lg p-4"
            style={{
                backgroundColor: 'var(--surface-elevated)',
                border: '1px solid var(--border-primary)',
            }}
        >
            <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0891B2' }}>
                    <rect x="2" y="7" width="20" height="10" rx="1" />
                    <path d="M6 11h2M10 11h4M16 11h2" />
                </svg>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Ticker</h4>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <SectionLabel>Content</SectionLabel>
                    <div className="flex items-center rounded-md overflow-hidden mt-1" style={{ border: '1px solid var(--border-primary)' }}>
                        {([
                            { value: 'all',       label: 'All Players'      },
                            { value: 'sold',      label: 'Sold'             },
                            { value: 'available', label: 'Available'        },
                        ] as const).map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => {
                                    setTickerMode(value);
                                    sendOverlaySettings(overlaySize, value);
                                }}
                                className="flex-1 px-3 py-1.5 text-xs font-semibold transition-all"
                                style={{
                                    backgroundColor: tickerMode === value ? 'var(--brand-primary)' : 'var(--surface-secondary)',
                                    color: tickerMode === value ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <SectionLabel>Visibility per screen</SectionLabel>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <HideCheckbox
                            label="Screen 1"
                            checked={hideTickerCustom}
                            onChange={() => {
                                const next = !hideTickerCustom;
                                setHideTickerCustom(next);
                                hideTickerCustomRef.current = next;
                                sendOverlaySettings(overlaySize, tickerMode);
                            }}
                        />
                        <HideCheckbox
                            label="Screen 2"
                            checked={hideTickerFullscreen}
                            onChange={() => {
                                const next = !hideTickerFullscreen;
                                setHideTickerFullscreen(next);
                                hideTickerFullscreenRef.current = next;
                                sendOverlaySettings(overlaySize, tickerMode);
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
