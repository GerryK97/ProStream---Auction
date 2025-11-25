'use client';

import React from 'react';
import {
    TeamCardsOverlayBaseProps,
    buildTeamCardViewModels,
    layoutWrapperClasses,
    OverlayShell,
    formatAmount
} from './shared';

const TeamCardsOverlayEmber: React.FC<TeamCardsOverlayBaseProps> = ({
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
                        ? 'teamHighlight 1.2s ease-in-out infinite, emberHeatWave 5s ease-in-out infinite'
                        : 'emberHeatWave 5s ease-in-out infinite';

                    return (
                        <div
                            key={team._id}
                            className="relative w-80 overflow-hidden backdrop-blur-xl border transition-all"
                            style={{
                                borderRadius: 20,
                                borderColor: isWinningTeam ? '#fbbf24' : '#fb923c',
                                boxShadow: isWinningTeam
                                    ? '0 0 50px rgba(251, 191, 36, 0.65)'
                                    : '0 0 35px rgba(251, 146, 60, 0.45)',
                                background: 'linear-gradient(135deg, rgba(43,15,0,0.92) 0%, rgba(122,35,20,0.9) 100%)',
                                animation
                            }}
                        >
                            <div
                                className="absolute inset-0 opacity-70 pointer-events-none"
                                style={{
                                    background:
                                        'radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.35), transparent 40%)',
                                    borderRadius: 20
                                }}
                            />
                            <div
                                className="absolute inset-0 opacity-60 pointer-events-none"
                                style={{
                                    background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.08), transparent)',
                                    borderRadius: 20
                                }}
                            />
                            <div className="relative z-10 p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-[#fed7aa]">
                                    <span
                                        className="flex items-center gap-2 px-2 py-1 rounded-full"
                                        style={{
                                            background:
                                                'linear-gradient(90deg, rgba(249, 115, 22, 0.45), rgba(220, 38, 38, 0.2))'
                                        }}
                                    >
                                        <span>🔥</span>Ember Rush
                                    </span>
                                    <span
                                        className="px-3 py-1 rounded-full font-semibold tracking-tight text-[11px]"
                                        style={{
                                            background: 'rgba(251, 191, 36, 0.25)',
                                            color: '#fff7ed'
                                        }}
                                    >
                                        Max {formatAmount(maxBid)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div
                                            className="absolute inset-0 blur-xl opacity-70 pointer-events-none"
                                            style={{ background: 'rgba(251, 146, 60, 0.4)' }}
                                        />
                                        <div
                                            className="relative rounded-2xl p-0.5"
                                            style={{
                                                background:
                                                    'linear-gradient(135deg, rgba(194, 65, 12, 0.4), rgba(249, 115, 22, 0.35))'
                                            }}
                                        >
                                            <img
                                                src={team.logoURL}
                                                alt={team.name}
                                                className="w-16 h-16 rounded-2xl object-cover border shadow-lg"
                                                style={{ borderColor: 'rgba(251, 191, 36, 0.9)' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-lg truncate" style={{ color: '#fef3c7' }}>
                                            {team.name}
                                        </p>
                                        <p className="text-sm" style={{ color: '#fed7aa' }}>
                                            {playersPurchased}/{squadSize} players • {remainingSlots} slots left
                                        </p>
                                        <div className="mt-2 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${fillPercent}%`,
                                                    background: 'linear-gradient(90deg, #fb923c, #f87171)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs uppercase tracking-wide" style={{ color: '#fffbeb' }}>
                                            Balance
                                        </p>
                                        <p className="text-xl font-mono" style={{ color: '#fff7ed' }}>
                                            {formatAmount(team.currentBalance)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs" style={{ color: '#ffedd5' }}>
                                    <span className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#ffedd5' }} />
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

export default TeamCardsOverlayEmber;

