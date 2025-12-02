'use client';

import React from 'react';
import {
    TeamCardsOverlayBaseProps,
    buildTeamCardViewModels,
    layoutWrapperClasses,
    OverlayShell,
    formatAmount
} from './shared';

const TeamCardsOverlayNeon: React.FC<TeamCardsOverlayBaseProps> = ({
    teams,
    tournament,
    currentPlayer,
    layout = 'horizontal',
    position = 'bottom'
}) => {
    const cards = buildTeamCardViewModels(teams, tournament, currentPlayer);
    if (cards.length === 0) {
        return null;
    }

    return (
        <OverlayShell position={position}>
            <div className={layoutWrapperClasses[layout]}>
                {cards.map(({ team, playersPurchased, squadSize, remainingSlots, fillPercent, maxBid, isWinningTeam }) => {
                    const animation = isWinningTeam
                        ? 'teamHighlight 1.2s ease-in-out infinite, neonPulseGlow 4s ease-in-out infinite'
                        : 'neonPulseGlow 4s ease-in-out infinite';

                    return (
                        <div
                            key={team._id}
                            className="relative w-80 overflow-hidden backdrop-blur-xl border transition-all"
                            style={{
                                borderRadius: 22,
                                borderColor: isWinningTeam ? '#f97316' : '#22d3ee',
                                boxShadow: isWinningTeam
                                    ? '0 0 45px rgba(249, 115, 22, 0.65)'
                                    : '0 0 30px rgba(13, 148, 136, 0.45)',
                                background: 'linear-gradient(135deg, rgba(5,25,55,0.85) 0%, rgba(92,44,144,0.8) 100%)',
                                animation
                            }}
                        >
                            <div
                                className="absolute inset-0 opacity-80 pointer-events-none"
                                style={{
                                    background:
                                        'radial-gradient(circle at 25% 15%, rgba(34, 211, 238, 0.35), transparent 55%)',
                                    borderRadius: 22
                                }}
                            />
                            <div
                                className="absolute inset-0 opacity-70 mix-blend-screen pointer-events-none"
                                style={{
                                    background: 'linear-gradient(120deg, rgba(14, 165, 233, 0.07), transparent)',
                                    borderRadius: 22
                                }}
                            />
                            <div className="relative z-10 p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-end text-[10px] uppercase tracking-[0.25em] text-[#a5f3fc]">
                                    <span
                                        className="px-3 py-1 rounded-full font-semibold tracking-tight text-[11px]"
                                        style={{
                                            background: 'rgba(168, 85, 247, 0.25)',
                                            color: '#f0f9ff'
                                        }}
                                    >
                                        Max {formatAmount(maxBid)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div
                                            className="absolute inset-0 blur-xl opacity-80 pointer-events-none"
                                            style={{ background: 'rgba(14, 165, 233, 0.45)' }}
                                        />
                                        <div
                                            className="relative rounded-2xl p-0.5"
                                            style={{
                                                background:
                                                    'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(244, 114, 182, 0.3))'
                                            }}
                                        >
                                            <img
                                                src={team.logoURL}
                                                alt={team.name}
                                                className="w-16 h-16 rounded-2xl object-cover border shadow-lg"
                                                style={{ borderColor: 'rgba(103, 232, 249, 0.9)' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-lg break-words" style={{ color: '#ecfeff', lineHeight: '1.2' }}>
                                            {team.name}
                                        </p>
                                        <p className="text-sm" style={{ color: '#bae6fd' }}>
                                            {playersPurchased}/{squadSize} players • {remainingSlots} slots left
                                        </p>
                                        <div className="mt-2 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${fillPercent}%`,
                                                    background: 'linear-gradient(90deg, #22d3ee, #c084fc)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs uppercase tracking-wide" style={{ color: '#cffafe' }}>
                                            Balance
                                        </p>
                                        <p className="text-xl font-mono" style={{ color: '#fef3c7' }}>
                                            {formatAmount(team.currentBalance)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs" style={{ color: '#e9d5ff' }}>
                                    <span className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#e9d5ff' }} />
                                        Max Bid Ready
                                    </span>
                                    <span className="font-semibold">{formatAmount(maxBid)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </OverlayShell>
    );
};

export default TeamCardsOverlayNeon;
