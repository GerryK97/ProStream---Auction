'use client';

import React from 'react';
import { Tournament, Player } from '@/types';
import { getClassConfig } from '@/lib/playerClassUtils';

interface ClassBadgeProps {
    tournament: Tournament | null;
    player: Player | null;
    variant?: 'corner' | 'dot' | 'inline' | 'large';
    showIcon?: boolean;
    className?: string;
}

/**
 * Reusable player class badge component
 * Supports different visual styles: corner badge, dot, inline, large
 */
const ClassBadge: React.FC<ClassBadgeProps> = ({
    tournament,
    player,
    variant = 'corner',
    showIcon = true,
    className = '',
}) => {
    // Don't render if no class or classes not enabled
    if (!player?.playerClass || !tournament?.usePlayerClasses) {
        return null;
    }

    const classConfig = getClassConfig(tournament, player.playerClass);

    if (!classConfig) {
        return null;
    }

    // Corner badge (top-right corner for overlays)
    if (variant === 'corner') {
        return (
            <div
                className={`absolute top-2 right-2 px-2.5 py-1.5 rounded-bl-lg rounded-tr-lg text-[11px] font-bold backdrop-blur-sm border-2 shadow-lg ${className}`}
                style={{
                    backgroundColor: `${classConfig.color}35`,
                    borderColor: `${classConfig.color}`,
                    color: classConfig.color,
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                }}
                title={`${classConfig.name} Class`}
            >
                {showIcon && classConfig.icon && (
                    <span className="mr-1">{classConfig.icon}</span>
                )}
                <span className="tracking-wider">{classConfig.name.toUpperCase()}</span>
            </div>
        );
    }

    // Dot badge (small circular indicator)
    if (variant === 'dot') {
        return (
            <div
                className={`w-2.5 h-2.5 rounded-full shadow-sm ${className}`}
                style={{
                    backgroundColor: classConfig.color,
                    boxShadow: `0 0 0 1.5px ${classConfig.color}40`
                }}
                title={`${classConfig.name} Class`}
            />
        );
    }

    // Inline badge (for lists and tables)
    if (variant === 'inline') {
        return (
            <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${className}`}
                style={{
                    backgroundColor: `${classConfig.color}40`,
                    color: classConfig.color,
                    borderWidth: '1.5px',
                    borderColor: `${classConfig.color}80`,
                }}
                title={`${classConfig.name} Class`}
            >
                {showIcon && classConfig.icon && (
                    <span className="mr-1 text-sm">{classConfig.icon}</span>
                )}
                <span className="tracking-wide">{classConfig.name}</span>
            </span>
        );
    }

    // Large badge (for showcases and prominent displays)
    if (variant === 'large') {
        return (
            <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${className}`}
                style={{
                    backgroundColor: `${classConfig.color}30`,
                    borderWidth: '2px',
                    borderColor: `${classConfig.color}`,
                    color: classConfig.color,
                }}
            >
                {showIcon && classConfig.icon && (
                    <span className="text-2xl">{classConfig.icon}</span>
                )}
                <span className="text-lg">{classConfig.name.toUpperCase()}</span>
            </div>
        );
    }

    return null;
};

export default ClassBadge;
