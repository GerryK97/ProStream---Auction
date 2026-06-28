'use client';

import { useEffect, useState } from 'react';
import type { AuctionLayoutMode } from './types';

const WIDE_MIN = 1400;
const COMPACT_MIN = 1024;

function resolveLayoutMode(width: number): AuctionLayoutMode {
    if (width >= WIDE_MIN) return 'wide';
    if (width >= COMPACT_MIN) return 'compact';
    return 'focused';
}

export function useAuctionLayoutMode(): AuctionLayoutMode {
    const [mode, setMode] = useState<AuctionLayoutMode>(() => {
        if (typeof window === 'undefined') return 'wide';
        return resolveLayoutMode(window.innerWidth);
    });

    useEffect(() => {
        const mqWide = window.matchMedia(`(min-width: ${WIDE_MIN}px)`);
        const mqCompact = window.matchMedia(`(min-width: ${COMPACT_MIN}px)`);

        const update = () => setMode(resolveLayoutMode(window.innerWidth));

        mqWide.addEventListener('change', update);
        mqCompact.addEventListener('change', update);
        window.addEventListener('resize', update);
        update();

        return () => {
            mqWide.removeEventListener('change', update);
            mqCompact.removeEventListener('change', update);
            window.removeEventListener('resize', update);
        };
    }, []);

    return mode;
}

export function isTabLayoutMode(mode: AuctionLayoutMode): boolean {
    return mode === 'compact' || mode === 'focused';
}
