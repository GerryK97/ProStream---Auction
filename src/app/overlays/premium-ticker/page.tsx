'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PremiumBreakingNewsTickerOverlay from '@/components/overlays/PremiumBreakingNewsTickerOverlay';
import { Player, Team } from '@/types';
import { useAuctionSSE } from '@/hooks/useAuctionSSE';

/**
 * Premium Breaking News Ticker Overlay Page
 * Shows one sold player at a time with smooth transitions
 * Based on breaking news ticker design pattern
 */
export default function PremiumTickerPage() {
    const searchParams = useSearchParams();
    const [soldPlayers, setSoldPlayers] = useState<Player[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);

    // Get configuration from URL parameters
    const size = (searchParams.get('size') as 'small' | 'default' | 'large') || 'default';
    const effect = (searchParams.get('effect') as 'slide-h' | 'slide-v' | 'fade') || 'slide-h';
    const color = (searchParams.get('color') as 'blue' | 'green' | 'purple' | 'orange' | 'yellow') || 'blue';
    const autoplay = searchParams.get('autoplay') !== 'false';
    const timer = parseInt(searchParams.get('timer') || '5000');
    const border = searchParams.get('border') !== 'false';
    const position = (searchParams.get('position') as 'top' | 'bottom') || 'bottom';

    // Subscribe to auction updates via SSE
    useAuctionSSE({
        onUpdate: (data) => {
            if (data.soldPlayers) {
                setSoldPlayers(data.soldPlayers);
            }
            if (data.teams) {
                setTeams(data.teams);
            }
        }
    });

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/auction/state');
                if (response.ok) {
                    const data = await response.json();
                    setSoldPlayers(data.soldPlayers || []);
                    setTeams(data.teams || []);
                }
            } catch (error) {
                console.error('Error fetching auction data:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="w-full h-screen bg-transparent overflow-hidden">
            <PremiumBreakingNewsTickerOverlay
                soldPlayers={soldPlayers}
                teams={teams}
                size={size}
                effect={effect}
                color={color}
                autoplay={autoplay}
                timer={timer}
                border={border}
                position={position}
            />
        </div>
    );
}
