'use client';

import React, { useEffect, useState } from 'react';
import { Team, Tournament } from '@/types';
import { imageOptimizers } from '@/lib/imageOptimization';

interface TeamCardProps {
    team: Team;
    tournament: Tournament | null;
    delay?: number;
    isWinning?: boolean;
    currentBid?: number;
}

const formatCurrency = (amount: number) => amount.toLocaleString();

/**
 * Individual team card showing logo, balance, max bid, and player count
 */
const TeamCard: React.FC<TeamCardProps> = ({ team, tournament, delay = 0, isWinning = false, currentBid = 0 }) => {
    const [balanceKey, setBalanceKey] = useState(0);
    const [previousBalance, setPreviousBalance] = useState(team.currentBalance || 0);

    // Calculate max bid
    const calculateMaxBid = () => {
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

    const maxBid = calculateMaxBid();
    const playersPurchased = team.playersPurchased?.length || 0;
    const squadSize = tournament?.squadSize || 0;
    const basePrice = tournament?.basePricePerPlayer || 0;
    const isSquadComplete = playersPurchased === squadSize && squadSize > 0;
    const hasInsufficientFunds = maxBid <= 0 && playersPurchased < squadSize;
    const isHighSpender = team.currentBalance && team.initialBudget &&
                          (team.currentBalance / team.initialBudget) < 0.2; // Spent >80%
    const cannotAfford = currentBid > 0 && maxBid < currentBid && !isSquadComplete;

    // Trigger balance update animation
    useEffect(() => {
        if (team.currentBalance !== previousBalance) {
            setBalanceKey(prev => prev + 1);
            setPreviousBalance(team.currentBalance || 0);
        }
    }, [team.currentBalance, previousBalance]);

    return (
        <div
            className={`bg-neutral-800/80 backdrop-blur-sm rounded-xl border-2 p-2 transition-all duration-300 animate-team-card-cascade gpu-accelerated
                ${isWinning ? 'border-yellow-400 shadow-lg shadow-yellow-400/50 animate-team-highlight' : 'border-neutral-700'}
                ${isHighSpender ? 'border-gold-500' : ''}
                ${hasInsufficientFunds ? 'animate-team-glow-warning' : ''}
                ${isSquadComplete ? 'bg-green-900/20 border-green-500' : ''}`}
            style={{
                animationDelay: `${delay}ms`,
                ...(cannotAfford && {
                    boxShadow: '0 0 18px rgba(239, 68, 68, 0.75)',
                    borderColor: 'rgb(239 68 68)',
                })
            }}
        >
            {/* Team Logo */}
            <div className="flex justify-center mb-1.5">
                <img
                    src={imageOptimizers.teamThumbnail(team.logoURL)}
                    alt={team.name}
                    className={`w-12 h-12 rounded-full object-cover border-2 ${isWinning ? 'border-yellow-400' : 'border-neutral-600'} shadow-lg`}
                />
            </div>

            {/* Team Name */}
            <h4 className="text-xs font-bold text-white text-center truncate mb-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {team.name}
            </h4>

            {/* Stats */}
            <div className="space-y-1 text-xs">
                {/* Balance */}
                <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Balance:</span>
                    <span
                        key={balanceKey}
                        className={`font-bold text-green-400 animate-team-balance-update`}
                    >
                        {formatCurrency(team.currentBalance || 0)}
                    </span>
                </div>

                {/* Max Bid */}
                <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Max Bid:</span>
                    <span className={`font-bold ${hasInsufficientFunds ? 'text-red-400' : 'text-cyan-400'}`}>
                        {formatCurrency(maxBid)}
                    </span>
                </div>

                {/* Players */}
                <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Players:</span>
                    <span className="font-bold text-white flex items-center gap-1">
                        {playersPurchased}/{squadSize}
                        {isSquadComplete && (
                            <span className="text-green-400 animate-squad-complete">✓</span>
                        )}
                    </span>
                </div>
            </div>

            {/* Warning Indicators */}
            {hasInsufficientFunds && !isSquadComplete && (
                <div className="mt-1 flex items-center justify-center gap-1 text-red-400 text-xs animate-team-low-balance">
                    <span>⚠️</span>
                    <span className="font-semibold text-[10px]">Low Funds</span>
                </div>
            )}

            {isHighSpender && !isSquadComplete && !hasInsufficientFunds && (
                <div className="mt-1 text-center text-[10px] text-orange-400 font-semibold">
                    💰 High Spender
                </div>
            )}

            {isSquadComplete && (
                <div className="mt-1 text-center text-[10px] text-green-400 font-semibold">
                    🎉 Complete
                </div>
            )}
        </div>
    );
};

export default TeamCard;
