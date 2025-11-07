'use client';

import React from 'react';
import { Player, Team, Tournament } from '@/types';

interface PremiumPlayerCardOverlayProps {
    currentPlayer: Player | undefined;
    tournament: Tournament | null;
    teams: Team[];
    position?: 'center' | 'left' | 'right';
}

const PremiumPlayerCardOverlay: React.FC<PremiumPlayerCardOverlayProps> = ({
    currentPlayer,
    tournament,
    teams,
    position = 'center'
}) => {
    // Hide when no player selected
    if (!currentPlayer || tournament?.status !== 'Live') {
        return null;
    }

    // Get player's team if sold
    const playerTeam = teams.find(t => t._id === currentPlayer.winningTeamId);

    // Position configurations
    const positionConfig = {
        'center': 'justify-center',
        'left': 'justify-start pl-8',
        'right': 'justify-end pr-8'
    };

    // Extract player number from ID (e.g., 'p26' -> '26')
    const playerNumber = currentPlayer._id.replace('p', '');

    return (
        <div className={`w-full h-full flex items-center ${positionConfig[position]}`}>
            <div className="w-[380px] animate-slide-in-top">
                <div className="rounded-3xl border border-custom-gray-200 bg-custom-gray-100 dark:border-custom-gray-600 dark:bg-custom-gray-700">
                    <div className="rounded-3xl bg-white p-4 ring-1 ring-custom-gray-200 dark:bg-custom-gray-800 dark:ring-custom-gray-600">
                        {/* Player Image Section */}
                        <div className="relative overflow-hidden pb-3">
                            <div className="overflow-hidden">
                                <div className="relative h-[400px] border border-custom-gray-200 bg-gradient-to-b from-custom-orange to-custom-yellow rounded-lg dark:border-custom-gray-600">
                                    {/* Background Text Watermark */}
                                    <div className="pointer-events-none absolute left-1/2 top-10 -z-10 ml-8 -translate-x-1/2 text-center text-9xl font-extrabold tracking-tighter text-white uppercase italic opacity-40 mix-blend-overlay">
                                        <div className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">{currentPlayer.name.split(' ')[0]}</div>
                                        <div className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">{currentPlayer.name.split(' ')[1] || ''}</div>
                                    </div>

                                    {/* Player Image */}
                                    <img
                                        src={currentPlayer.imageURL}
                                        alt={currentPlayer.name}
                                        className="absolute left-1/2 top-2 max-w-[calc(100%+60px)] -translate-x-1/2 h-[380px] object-contain"
                                    />
                                </div>
                            </div>

                            {/* Jersey Number Badge */}
                            <div className="absolute start-1/2 bottom-0 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-2xl bg-gradient-to-b from-custom-orange to-custom-yellow text-2xl/none font-extrabold tracking-tighter text-white">
                                {playerNumber}
                            </div>

                            {/* White Cutout Badge (Top Left) */}
                            <div className="absolute left-0 top-0 aspect-square w-[76px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-custom-gray-200 bg-white dark:border-custom-gray-600 dark:bg-white"></div>

                            {/* White Cutout Badge (Top Right) */}
                            <div className="absolute right-0 top-0 aspect-square w-[76px] translate-x-1/2 -translate-y-1/2 rounded-full border border-custom-gray-200 bg-white dark:border-custom-gray-600 dark:bg-white"></div>
                        </div>

                        {/* Player Name Section */}
                        <div className="pt-3 pb-1 text-center text-slate-800 dark:text-white">
                            <h2 className="text-[22px] leading-tight font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                {currentPlayer.name}
                            </h2>
                            <div className="text-sm text-neutral-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                Player
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="mx-auto grid w-fit grid-cols-3 divide-x divide-custom-gray-200 py-5 text-slate-800 dark:divide-custom-gray-600 dark:text-white">
                        <div className="px-7 text-center">
                            <div className="mb-2 text-sm font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                {currentPlayer.stats.matchesPlayed}
                            </div>
                            <div className="text-2xs uppercase text-neutral-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                Matches
                            </div>
                        </div>
                        <div className="px-7 text-center">
                            <div className="mb-2 text-sm font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                {currentPlayer.stats.totalScore}
                            </div>
                            <div className="text-2xs uppercase text-neutral-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                Score
                            </div>
                        </div>
                        <div className="px-7 text-center">
                            <div className="mb-2 text-sm font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                {currentPlayer.stats.totalWickets}
                            </div>
                            <div className="text-2xs uppercase text-neutral-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                Wickets
                            </div>
                        </div>
                    </div>
                </div>

                {/* SVG Filter for rounded edges effect */}
                <svg className="invisible absolute" width="0" height="0" xmlns="http://www.w3.org/2000/svg" version="1.1">
                    <defs>
                        <filter id="rounded-sm">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur-sm"></feGaussianBlur>
                            <feColorMatrix in="blur-sm" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo"></feColorMatrix>
                            <feComposite in="SourceGraphic" in2="goo" operator="atop"></feComposite>
                        </filter>
                    </defs>
                </svg>
            </div>
        </div>
    );
};

export default PremiumPlayerCardOverlay;
