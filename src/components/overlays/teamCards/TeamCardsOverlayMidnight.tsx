'use client';

import React from 'react';
import {
    TeamCardsOverlayBaseProps,
    buildTeamCardViewModels,
    layoutWrapperClasses,
    OverlayShell,
    formatAmount
} from './shared';

const TeamCardsOverlayMidnight: React.FC<TeamCardsOverlayBaseProps> = ({
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
                        ? 'teamHighlight 1.2s ease-in-out infinite, midnightSlatePulse 6s ease-in-out infinite'
                        : 'midnightSlatePulse 6s ease-in-out infinite';

                    return (
                        <div
                            key={team._id}
                            className="relative w-80 overflow-hidden border backdrop-blur"
                            style={{
                                borderRadius: 18,
                                borderColor: isWinningTeam ? '#2563eb' : '#334155',
                                boxShadow: isWinningTeam
                                    ? '0 0 30px rgba(37, 99, 235, 0.45)'
                                    : '0 0 20px rgba(15, 23, 42, 0.4)',
                                background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                                animation
                            }}
                        >
                            <div
                                className="absolute inset-0 opacity-60 pointer-events-none"
                                style={{
                                    background:
                                        'linear-gradient(135deg, rgba(148, 163, 184, 0.08) 0%, transparent 60%)',
                                    borderRadius: 18
                                }}
                            />
                            <div
                                className="absolute inset-0 opacity-50 pointer-events-none mix-blend-screen"
                                style={{
                                    background: 'linear-gradient(45deg, rgba(100, 116, 139, 0.04), transparent)',
                                    borderRadius: 18
                                }}
                            />
                            <div className="relative z-10 p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-[#94a3b8]">
                                    <span
                                        className="flex items-center gap-2 px-2 py-1 rounded-full"
                                        style={{
                                            background:
                                                'linear-gradient(90deg, rgba(148, 163, 184, 0.25), rgba(30, 64, 175, 0.15))'
                                        }}
                                    >
                                        <span>•</span>Match Status
                                    </span>
                                    <span
                                        className="px-3 py-1 rounded-full font-semibold tracking-tight text-[11px]"
                                        style={{
                                            background: 'rgba(15, 118, 110, 0.35)',
                                            color: '#f0fdfa'
                                        }}
                                    >
                                        Max {formatAmount(maxBid)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div
                                            className="absolute inset-0 blur-xl opacity-50 pointer-events-none"
                                            style={{ background: 'rgba(15, 118, 110, 0.5)' }}
                                        />
                                        <div
                                            className="relative rounded-2xl p-0.5"
                                            style={{
                                                background:
                                                    'linear-gradient(135deg, rgba(71, 85, 105, 0.35), rgba(15, 118, 110, 0.25))'
                                            }}
                                        >
                                            <img
                                                src={team.logoURL}
                                                alt={team.name}
                                                className="w-16 h-16 rounded-2xl object-cover border shadow-lg"
                                                style={{ borderColor: 'rgba(148, 163, 184, 0.9)' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-lg truncate" style={{ color: '#f1f5f9' }}>
                                            {team.name}
                                        </p>
                                        <p className="text-sm" style={{ color: '#cbd5f5' }}>
                                            {playersPurchased}/{squadSize} players • {remainingSlots} slots left
                                        </p>
                                        <div className="mt-2 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${fillPercent}%`,
                                                    background: 'linear-gradient(90deg, #0ea5e9, #14b8a6)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs uppercase tracking-wide" style={{ color: '#cbd5f5' }}>
                                            Balance
                                        </p>
                                        <p className="text-xl font-mono" style={{ color: '#f8fafc' }}>
                                            {formatAmount(team.currentBalance)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs" style={{ color: '#e2e8f0' }}>
                                    <span className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#e2e8f0' }} />
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

export default TeamCardsOverlayMidnight;

