import React from 'react';
import type { DisplayMode, OverlaySize, SendOverlaySettings, TickerMode } from './types';

interface CustomTickerModalProps {
    open: boolean;
    onClose: () => void;
    customTickerLine1: string;
    setCustomTickerLine1: (v: string) => void;
    customTickerLine2: string;
    setCustomTickerLine2: (v: string) => void;
    overlaySize: OverlaySize;
    tickerMode: TickerMode;
    displayMode: DisplayMode;
    hidePremiumCard: boolean;
    sendOverlaySettings: SendOverlaySettings;
}

export default function CustomTickerModal({
    open,
    onClose,
    customTickerLine1,
    setCustomTickerLine1,
    customTickerLine2,
    setCustomTickerLine2,
    overlaySize,
    tickerMode,
    displayMode,
    hidePremiumCard,
    sendOverlaySettings,
}: CustomTickerModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={onClose}
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
                        <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Line 1</label>
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
                        <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Line 2</label>
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
                            onClose();
                        }}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                        style={{ backgroundColor: '#0891B2', color: '#fff' }}
                    >
                        Update
                    </button>
                    <button
                        onClick={onClose}
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
    );
}
