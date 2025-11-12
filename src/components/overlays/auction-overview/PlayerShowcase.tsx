'use client';

import React, { useEffect, useState } from 'react';
import { Player } from '@/types';
import { imageOptimizers } from '@/lib/imageOptimization';

interface PlayerShowcaseProps {
    player: Player | undefined;
    size?: 'default' | 'large';
}

/**
 * Displays the current player being auctioned with photo, stats, and glow animations
 */
const PlayerShowcase: React.FC<PlayerShowcaseProps> = ({ player, size = 'default' }) => {
    const [animationKey, setAnimationKey] = useState(0);

    // Trigger entrance animation when player changes
    useEffect(() => {
        if (player) {
            setAnimationKey(prev => prev + 1);
        }
    }, [player?._id]);

    if (!player) {
        return (
            <div className="bg-neutral-800/80 backdrop-blur-sm rounded-2xl border-2 border-neutral-700 p-6 flex items-center justify-center min-h-[280px]">
                <div className="text-center animate-breathing">
                    <div className="text-6xl mb-4">⏳</div>
                    <p className="text-xl text-neutral-400 animate-fade-pulse">
                        Waiting for next player...
                    </p>
                </div>
            </div>
        );
    }

    const sizeConfig = {
        default: {
            photoSize: 'w-32 h-32',
            nameSize: 'text-2xl',
            statsSize: 'text-lg',
            padding: 'p-6'
        },
        large: {
            photoSize: 'w-40 h-40',
            nameSize: 'text-3xl',
            statsSize: 'text-xl',
            padding: 'p-8'
        }
    };

    const config = sizeConfig[size];
    const playerNumber = player.playerNo || player._id;

    return (
        <div
            key={animationKey}
            className={`bg-neutral-800/80 backdrop-blur-sm rounded-2xl border-2 border-cyan-500 ${config.padding} animate-player-entrance gpu-accelerated`}
        >
            {/* Player Header */}
            <div className="flex items-center gap-6 mb-4">
                {/* Player Photo with Glow */}
                <div className="relative">
                    <img
                        src={imageOptimizers.playerCard(player.photoURL)}
                        alt={player.name}
                        className={`${config.photoSize} rounded-full object-cover border-4 border-cyan-400 animate-player-glow-pulse will-change-transform`}
                    />
                    {/* Jersey Number Badge */}
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-b from-orange-500 to-yellow-500 border-2 border-white flex items-center justify-center font-bold text-white text-sm shadow-lg">
                        #{playerNumber}
                    </div>
                </div>

                {/* Player Info */}
                <div className="flex-1">
                    <h3 className={`${config.nameSize} font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-1`}>
                        {player.name}
                    </h3>
                    {player.position && (
                        <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-sm font-semibold animate-slide-in-left">
                            {player.position}
                        </div>
                    )}
                    {player.currentClub && (
                        <p className="text-sm text-neutral-400 mt-1">
                            Current Club: {player.currentClub}
                        </p>
                    )}
                </div>
            </div>

            {/* Player Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-neutral-700">
                <div className="text-center animate-stats-counter" style={{ animationDelay: '100ms' }}>
                    <div className={`${config.statsSize} font-bold text-cyan-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                        {player.stats.matchesPlayed}
                    </div>
                    <div className="text-xs text-neutral-400 uppercase mt-1">Matches</div>
                </div>
                <div className="text-center animate-stats-counter" style={{ animationDelay: '200ms' }}>
                    <div className={`${config.statsSize} font-bold text-green-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                        {player.stats.totalScore}
                    </div>
                    <div className="text-xs text-neutral-400 uppercase mt-1">Runs</div>
                </div>
                <div className="text-center animate-stats-counter" style={{ animationDelay: '300ms' }}>
                    <div className={`${config.statsSize} font-bold text-purple-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                        {player.stats.totalWickets}
                    </div>
                    <div className="text-xs text-neutral-400 uppercase mt-1">Wickets</div>
                </div>
            </div>
        </div>
    );
};

export default PlayerShowcase;
