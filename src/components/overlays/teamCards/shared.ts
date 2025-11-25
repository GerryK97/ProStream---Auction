'use client';

import React from 'react';
import { Team, Tournament, Player } from '@/types';

export type TeamCardsLayout = 'horizontal' | 'vertical' | 'grid';
export type TeamCardsPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TeamCardsOverlayBaseProps {
    teams: Team[];
    tournament: Tournament | null;
    currentPlayer: Player | undefined;
    layout?: TeamCardsLayout;
    position?: TeamCardsPosition;
}

export interface TeamCardViewModel {
    team: Team;
    playersPurchased: number;
    squadSize: number;
    remainingSlots: number;
    fillPercent: number;
    maxBid: number;
    isWinningTeam: boolean;
}

export const layoutWrapperClasses: Record<TeamCardsLayout, string> = {
    horizontal: 'flex flex-row flex-wrap justify-center gap-5',
    vertical: 'flex flex-col items-center gap-5',
    grid: 'grid grid-cols-1 md:grid-cols-2 gap-5'
};

export const positionWrapperClasses: Record<TeamCardsPosition, string> = {
    top: 'justify-start pt-8',
    bottom: 'justify-end pb-8',
    left: 'justify-start pl-8 flex-col',
    right: 'justify-end pr-8 flex-col'
};

const formatCurrency = (amount: number) => amount.toLocaleString();
export const formatAmount = (amount: number | undefined) => formatCurrency(amount || 0);

const calculateMaxBid = (team: Team, tournament: Tournament | null) => {
    if (!tournament || !team.currentBalance) return 0;

    const squadSize = tournament.squadSize;
    const basePrice = tournament.basePricePerPlayer;
    const playersPurchased = team.playersPurchased?.length || 0;
    const remainingPlayers = squadSize - playersPurchased;

    if (remainingPlayers <= 1) {
        return team.currentBalance;
    }

    const reservedAmount = (remainingPlayers - 1) * basePrice;
    const maxBid = team.currentBalance - reservedAmount;
    return Math.max(0, maxBid);
};

export const buildTeamCardViewModels = (
    teams: Team[],
    tournament: Tournament | null,
    currentPlayer: Player | undefined
): TeamCardViewModel[] => {
    if (!tournament || teams.length === 0) {
        return [];
    }

    const squadSize = tournament.squadSize;

    return teams.map(team => {
        const playersPurchased = team.playersPurchased?.length || 0;
        const remainingSlots = Math.max(0, squadSize - playersPurchased);
        const fillPercent = squadSize > 0 ? Math.min(100, (playersPurchased / squadSize) * 100) : 0;
        const maxBid = calculateMaxBid(team, tournament);
        const isWinningTeam = currentPlayer?.winningTeamId === team._id;

        return {
            team,
            playersPurchased,
            squadSize,
            remainingSlots,
            fillPercent,
            maxBid,
            isWinningTeam
        };
    });
};

export const OverlayShell: React.FC<React.PropsWithChildren<{ position: TeamCardsPosition }>> = ({
    position,
    children
}) => (
    <div className={`w-full h-full flex ${positionWrapperClasses[position]} items-center px-8`}>
        <div className="transition-all duration-500 ease-in-out animate-slide-in-bottom w-full">{children}</div>
    </div>
);

