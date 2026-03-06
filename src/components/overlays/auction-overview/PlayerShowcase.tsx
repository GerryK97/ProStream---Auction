'use client';

import React, { useEffect, useState } from 'react';
import { Player, Tournament } from '@/types';
import { imageOptimizers } from '@/lib/imageOptimization';
import ClassBadge from '@/components/shared/ClassBadge';

interface PlayerShowcaseProps {
    player: Player | undefined;
    tournament?: Tournament | null;
    size?: 'default' | 'large';
}

/**
 * Displays the current player being auctioned with photo, stats, and glow animations
 */
const PlayerShowcase: React.FC<PlayerShowcaseProps> = ({ player, tournament, size = 'default' }) => {
    const [animationKey, setAnimationKey] = useState(0);

    // Trigger entrance animation when player changes
    useEffect(() => {
        if (player) {
            setAnimationKey(prev => prev + 1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [player?._id]);

    if (!player) {
        return (
            <div className="bg-neutral-800/80 backdrop-blur-sm rounded-2xl border-2 border-neutral-700 p-4 flex items-center justify-center min-h-[240px]">
                <div className="text-center animate-breathing">
                    <div className="text-5xl mb-3">⏳</div>
                    <p className="text-lg text-neutral-400 animate-fade-pulse">
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
            statsSize: 'text-base',
            padding: 'p-5'
        },
        large: {
            photoSize: 'w-56 h-56',
            nameSize: 'text-4xl',
            statsSize: 'text-2xl',
            padding: 'p-8'
        }
    };

    const config = sizeConfig[size];
    const playerNumber = player.playerNo || player._id;

    return (
        <div
            key={animationKey}
            className={`bg-neutral-800/80 backdrop-blur-sm rounded-2xl border-2 border-cyan-500 ${config.padding} animate-player-entrance gpu-accelerated relative`}
        >
            {/* Player Class Badge */}
            <ClassBadge tournament={tournament || null} player={player} variant="corner" />

            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Player Info + photo */}
                <div className="flex flex-1 items-center gap-8">
                    <div className="relative">
                        <img
                            src={imageOptimizers.playerCard(player.photoURL)}
                            alt={player.name}
                            className={`${config.photoSize} rounded-full object-cover border-4 border-cyan-400 animate-player-glow-pulse will-change-transform`}
                        />
                        <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-b from-orange-500 to-yellow-500 border-2 border-white flex items-center justify-center font-bold text-white text-base shadow-lg">
                            {playerNumber}
                        </div>
                    </div>
                    <div>
                        <h3 className={`${config.nameSize} font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-2`}>
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

                {/* Stats + class */}
                <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">Player Class</p>
                        <ClassBadge tournament={tournament || null} player={player} variant="inline" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[{ label: 'Matches', value: (player as any).stats?.matchesPlayed }, { label: 'Runs', value: (player as any).stats?.totalScore }, { label: 'Wickets', value: (player as any).stats?.totalWickets }].map((stat, index) => (
                            <div key={stat.label} className="text-center animate-stats-counter" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                                <div className={`${config.statsSize} font-bold text-cyan-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                                    {stat.value}
                                </div>
                                <div className="text-xs text-neutral-400 uppercase mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerShowcase;
