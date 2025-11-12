'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Player, Team } from '@/types';

interface PremiumBreakingNewsTickerProps {
    soldPlayers: Player[];
    teams: Team[];
    size?: 'small' | 'default' | 'large';
    effect?: 'slide-h' | 'slide-v' | 'fade';
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'yellow';
    autoplay?: boolean;
    timer?: number;
    border?: boolean;
    position?: 'top' | 'bottom';
}

const formatCurrency = (amount: number) => amount.toLocaleString();

/**
 * Premium Breaking News Style Ticker
 * Shows one sold player at a time with smooth transitions
 * Based on breaking news ticker design pattern
 */
const PremiumBreakingNewsTickerOverlay: React.FC<PremiumBreakingNewsTickerProps> = ({
    soldPlayers,
    teams,
    size = 'default',
    effect = 'slide-h',
    color = 'blue',
    autoplay = true,
    timer = 5000,
    border = true,
    position = 'bottom'
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Size configurations
    const sizeConfig = {
        small: {
            height: 'h-[30px]',
            titleHeight: 'h-[30px]',
            fontSize: 'text-sm',
            titleFont: 'text-base',
            padding: 'px-3',
            imgSize: 'w-6 h-6',
            arrowTop: 'top-[5px]'
        },
        default: {
            height: 'h-[40px]',
            titleHeight: 'h-[40px]',
            fontSize: 'text-base',
            titleFont: 'text-lg',
            padding: 'px-4',
            imgSize: 'w-8 h-8',
            arrowTop: 'top-[10px]'
        },
        large: {
            height: 'h-[50px]',
            titleHeight: 'h-[50px]',
            fontSize: 'text-lg',
            titleFont: 'text-xl',
            padding: 'px-5',
            imgSize: 'w-10 h-10',
            arrowTop: 'top-[15px]'
        }
    };

    // Color theme configurations
    const colorConfig = {
        blue: {
            border: 'border-brand-primary',
            bg: 'bg-brand-primary',
            arrow: 'border-l-brand-primary',
            accent: 'text-brand-primary'
        },
        green: {
            border: 'border-brand-secondary',
            bg: 'bg-brand-secondary',
            arrow: 'border-l-brand-secondary',
            accent: 'text-brand-secondary'
        },
        purple: {
            border: 'border-status-purple',
            bg: 'bg-status-purple',
            arrow: 'border-l-status-purple',
            accent: 'text-status-purple'
        },
        orange: {
            border: 'border-orange-500',
            bg: 'bg-orange-500',
            arrow: 'border-l-orange-500',
            accent: 'text-orange-500'
        },
        yellow: {
            border: 'border-status-yellow',
            bg: 'bg-status-yellow',
            arrow: 'border-l-status-yellow',
            accent: 'text-status-yellow'
        }
    };

    const currentSize = sizeConfig[size];
    const currentColor = colorConfig[color];
    const currentPlayer = soldPlayers[activeIndex];
    const playerTeam = teams.find(t => t._id === currentPlayer?.winningTeamId);

    const handleNext = () => {
        if (isAnimating || !soldPlayers || soldPlayers.length === 0) return;
        setIsAnimating(true);
        setActiveIndex((prev) => (prev + 1) % soldPlayers.length);
        setTimeout(() => setIsAnimating(false), 500);
    };

    const handlePrevious = () => {
        if (isAnimating || !soldPlayers || soldPlayers.length === 0) return;
        setIsAnimating(true);
        setActiveIndex((prev) => (prev - 1 + soldPlayers.length) % soldPlayers.length);
        setTimeout(() => setIsAnimating(false), 500);
    };

    // Auto-play functionality
    useEffect(() => {
        if (autoplay && !isHovered && soldPlayers && soldPlayers.length > 0) {
            timerRef.current = setInterval(() => {
                setActiveIndex((prev) => (prev + 1) % soldPlayers.length);
            }, timer);

            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    }, [autoplay, isHovered, soldPlayers, timer]);

    // Position config
    const positionClass = position === 'top' ? 'top-8' : 'bottom-8';

    // Animation effect classes
    const getEffectClass = () => {
        if (!isAnimating) return 'opacity-100';

        switch (effect) {
            case 'fade':
                return 'animate-fade-in';
            case 'slide-h':
                return 'animate-slide-in-right';
            case 'slide-v':
                return 'animate-slide-in-bottom';
            default:
                return 'animate-fade-in';
        }
    };

    // Early return if no sold players
    if (!soldPlayers || soldPlayers.length === 0) {
        return null;
    }

    return (
        <div
            className={`fixed ${positionClass} left-0 right-0 px-8 z-50`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`relative ${currentSize.height} bg-white overflow-hidden ${
                    border ? `border-2 ${currentColor.border}` : ''
                }`}
            >
                {/* Title Section */}
                <div className={`inline-block ${currentSize.titleHeight} ${currentColor.bg} relative`}>
                    <h2 className={`inline-block m-0 ${currentSize.padding} leading-none ${currentSize.titleFont} text-white ${currentSize.titleHeight} flex items-center`}>
                        SOLD PLAYERS
                    </h2>
                    {/* Arrow Triangle */}
                    <span
                        className={`absolute right-[-10px] ${currentSize.arrowTop} w-0 h-0 border-solid border-y-[10px] border-l-[10px] border-y-transparent ${currentColor.arrow}`}
                    />
                </div>

                {/* Content Area */}
                <div className={`absolute left-[220px] right-[50px] top-0 ${currentSize.height} ${currentSize.fontSize}`}>
                    {currentPlayer && (
                        <div
                            key={activeIndex}
                            className={`absolute w-full ${currentSize.height} flex items-center whitespace-nowrap overflow-hidden ${getEffectClass()}`}
                        >
                            {/* Player Photo */}
                            <img
                                src={currentPlayer.photoURL}
                                alt={currentPlayer.name}
                                className={`${currentSize.imgSize} rounded-full object-cover border-2 border-white shadow-lg mr-2`}
                            />

                            {/* Player Number */}
                            <span className={`${currentColor.accent} font-mono mr-2`}>
                                #{currentPlayer.playerNo || currentPlayer._id}
                            </span>

                            {/* Player Name */}
                            <span className="font-semibold text-gray-800 mr-2">
                                {currentPlayer.name}
                            </span>

                            {/* Separator */}
                            <span className="text-gray-400 mr-2">→</span>

                            {/* Team Logo */}
                            {playerTeam?.logoURL && (
                                <img
                                    src={playerTeam.logoURL}
                                    alt={playerTeam.name}
                                    className={`${currentSize.imgSize} rounded-full object-cover border-2 border-gray-300 mr-2`}
                                />
                            )}

                            {/* Team Name */}
                            <span className={`${currentColor.accent} font-semibold mr-2`}>
                                {playerTeam?.name || 'Unknown'}
                            </span>

                            {/* Separator */}
                            <span className="text-gray-400 mr-2">•</span>

                            {/* Price */}
                            <span className="text-green-600 font-bold">
                                ₹ {formatCurrency(currentPlayer.finalPrice || 0)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Navigation Arrows */}
                <div
                    className={`absolute right-0 top-0 ${currentSize.height} w-[50px] transition-opacity duration-250 ${
                        isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    {/* Previous Arrow */}
                    <button
                        onClick={handlePrevious}
                        className={`absolute left-0 top-0 w-[25px] ${currentSize.height} opacity-30 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none`}
                    >
                        <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Next Arrow */}
                    <button
                        onClick={handleNext}
                        className={`absolute right-0 top-0 w-[25px] ${currentSize.height} opacity-30 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none`}
                    >
                        <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Progress Indicator (optional) */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-200">
                    <div
                        className={`h-full ${currentColor.bg} transition-all duration-${timer}`}
                        style={{
                            width: isHovered ? '0%' : '100%',
                            transition: isHovered ? 'none' : `width ${timer}ms linear`
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PremiumBreakingNewsTickerOverlay;
