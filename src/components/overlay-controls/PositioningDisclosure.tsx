import React from 'react';
import type { DisplayMode, OverlaySize, SendOverlaySettings, SoldMessagePosition, TickerMode } from './types';

interface PositioningDisclosureProps {
    open: boolean;
    onToggle: () => void;
    soldMessagePosition: SoldMessagePosition;
    setSoldMessagePosition: (p: SoldMessagePosition) => void;
    soldMessagePositionRef: React.MutableRefObject<SoldMessagePosition>;
    bidCardTop: number;
    setBidCardTop: (n: number) => void;
    bidCardLeft: number;
    setBidCardLeft: (n: number) => void;
    overlaySize: OverlaySize;
    tickerMode: TickerMode;
    displayMode: DisplayMode;
    hidePremiumCard: boolean;
    customTickerLine1: string;
    customTickerLine2: string;
    sendOverlaySettings: SendOverlaySettings;
}

const SOLD_MESSAGE_OPTIONS: { value: SoldMessagePosition; label: string }[] = [
    { value: 'top-left',     label: '▲  Left · Top'    },
    { value: 'top-right',    label: '▲  Right · Top'   },
    { value: 'bottom-left',  label: '▼  Left · Bottom' },
    { value: 'bottom-right', label: '▼  Right · Bottom' },
];

export default function PositioningDisclosure({
    open,
    onToggle,
    soldMessagePosition,
    setSoldMessagePosition,
    soldMessagePositionRef,
    bidCardTop,
    setBidCardTop,
    bidCardLeft,
    setBidCardLeft,
    overlaySize,
    tickerMode,
    displayMode,
    hidePremiumCard,
    customTickerLine1,
    customTickerLine2,
    sendOverlaySettings,
}: PositioningDisclosureProps) {
    return (
        <div
            className="rounded-lg mt-4 overflow-hidden"
            style={{
                backgroundColor: 'var(--surface-elevated)',
                border: '1px solid var(--border-primary)',
            }}
        >
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full px-4 py-3 text-left transition-all"
                style={{ backgroundColor: open ? 'var(--surface-hover, var(--surface-elevated))' : 'transparent' }}
            >
                <div className="flex items-center gap-2">
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            color: 'var(--text-tertiary)',
                            transition: 'transform 0.15s',
                            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                        }}
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-tertiary)' }}>
                        Advanced positioning
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        · sold message corner · bid card pixels
                    </span>
                </div>
            </button>

            {open && (
                <div className="px-4 pb-4 pt-1 grid gap-5 md:grid-cols-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
                            Sold message corner
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 mt-2">
                            {SOLD_MESSAGE_OPTIONS.map(opt => {
                                const active = soldMessagePosition === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            setSoldMessagePosition(opt.value);
                                            soldMessagePositionRef.current = opt.value;
                                            sendOverlaySettings(overlaySize, tickerMode, displayMode, hidePremiumCard, customTickerLine1, customTickerLine2, opt.value);
                                        }}
                                        className="px-3 py-2 rounded-md text-xs font-semibold text-left transition-all"
                                        style={{
                                            backgroundColor: active ? 'var(--brand-primary)' : 'var(--surface-secondary)',
                                            color: active ? '#fff' : 'var(--text-secondary)',
                                            border: `1px solid ${active ? 'var(--brand-primary)' : 'var(--border-primary)'}`,
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
                            Bid card position
                        </span>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                            1920 × 1080 canvas · Screen 2 only
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <span className="w-8 font-semibold uppercase text-[10px] tracking-wider" style={{ color: 'var(--text-muted)' }}>Top</span>
                                <input
                                    type="number"
                                    value={bidCardTop}
                                    onChange={e => setBidCardTop(Number(e.target.value))}
                                    onBlur={() => sendOverlaySettings(overlaySize, tickerMode)}
                                    className="w-20 rounded-md px-2 py-1.5 text-xs"
                                    style={{
                                        backgroundColor: 'var(--surface-secondary)',
                                        border: '1px solid var(--border-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                    }}
                                />
                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>px</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <span className="w-8 font-semibold uppercase text-[10px] tracking-wider" style={{ color: 'var(--text-muted)' }}>Left</span>
                                <input
                                    type="number"
                                    value={bidCardLeft}
                                    onChange={e => setBidCardLeft(Number(e.target.value))}
                                    onBlur={() => sendOverlaySettings(overlaySize, tickerMode)}
                                    className="w-20 rounded-md px-2 py-1.5 text-xs"
                                    style={{
                                        backgroundColor: 'var(--surface-secondary)',
                                        border: '1px solid var(--border-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                    }}
                                />
                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>px</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
