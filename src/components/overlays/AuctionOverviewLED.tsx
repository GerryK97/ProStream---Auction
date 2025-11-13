'use client';

import React, { useEffect, useState } from 'react';
import { Player, Team, Tournament, AuctionState } from '@/types';
import BackgroundEffects from './auction-overview/BackgroundEffects';
import PlayerShowcase from './auction-overview/PlayerShowcase';
import LiveBiddingPanel from './auction-overview/LiveBiddingPanel';
import TeamsOverviewFlip from './auction-overview/TeamsOverviewFlip';
import AuctionStats from './auction-overview/AuctionStats';
import RecentSoldPlayers from './auction-overview/RecentSoldPlayers';
import SoldCelebration from './auction-overview/SoldCelebration';

interface AuctionOverviewLEDProps {
    tournament: Tournament | null;
    auctionState: AuctionState;
    players: Player[];
    teams: Team[];
    currentPlayer: Player | undefined;
    soldPlayers: Player[];
    // Display options
    size?: 'default' | 'large';
    showBackground?: boolean;
    theme?: 'dark' | 'premium' | 'vibrant';
    // Animation settings
    animationSpeed?: 'slow' | 'normal' | 'fast';
    teamFlipDuration?: number;
    // Feature toggles
    showStats?: boolean;
    showRecentSold?: boolean;
    maxRecentSold?: number;
    teamsPerPage?: number;
}

/**
 * Comprehensive full-screen auction overview overlay for LED screens (1920x1080)
 * Shows complete auction flow with complex animations
 */
const AuctionOverviewLED: React.FC<AuctionOverviewLEDProps> = ({
    tournament,
    auctionState,
    players,
    teams,
    currentPlayer,
    soldPlayers,
    size = 'default',
    showBackground = true,
    theme = 'premium',
    animationSpeed = 'normal',
    teamFlipDuration = 8000,
    showStats = true,
    showRecentSold = true,
    maxRecentSold = 5,
    teamsPerPage = 10
}) => {
    const [showCelebration, setShowCelebration] = useState(false);
    const [previousStatus, setPreviousStatus] = useState(auctionState.currentAuctionStatus);
    const [animationSpeedClass, setAnimationSpeedClass] = useState('animation-speed-normal');

    // Set animation speed class
    useEffect(() => {
        setAnimationSpeedClass(`animation-speed-${animationSpeed}`);
    }, [animationSpeed]);

    // Handle sold celebration animation
    useEffect(() => {
        if (auctionState.currentAuctionStatus === 'Sold' && previousStatus !== 'Sold') {
            setShowCelebration(true);
            setTimeout(() => {
                setShowCelebration(false);
            }, 3000); // Show for 3 seconds
        }
        setPreviousStatus(auctionState.currentAuctionStatus);
    }, [auctionState.currentAuctionStatus, previousStatus]);

    // Adjust flip duration based on animation speed
    const adjustedFlipDuration =
        animationSpeed === 'slow' ? teamFlipDuration * 1.5 :
        animationSpeed === 'fast' ? teamFlipDuration * 0.75 :
        teamFlipDuration;

    // Check if auction is stopped
    const isAuctionStopped = tournament?.status === 'Stopped';

    return (
        <div className={`w-full h-full relative overflow-hidden ${animationSpeedClass}`}>
            {/* Background Effects */}
            {showBackground && (
                <BackgroundEffects theme={theme} showBackground={showBackground} />
            )}

            {/* Main Content Container */}
            <div className="relative z-10 w-full h-full p-6 flex flex-col gap-4">
                {/* Tournament Header */}
                <div className="bg-gradient-to-r from-cyan-900/80 via-blue-900/80 to-purple-900/80 backdrop-blur-sm rounded-2xl border-2 border-cyan-500 p-3">
                    <div className="flex items-center justify-between">
                        {/* Tournament Info */}
                        <div className="flex items-center gap-3">
                            {tournament?.logoURL && (
                                <img
                                    src={tournament.logoURL}
                                    alt={tournament.name}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
                                />
                            )}
                            <div>
                                <h1 className="text-2xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] tracking-wide">
                                    {tournament?.name || 'AUCTION OVERVIEW'}
                                </h1>
                                <div className="flex items-center gap-3 text-xs text-cyan-300 mt-1">
                                    <span>Budget: {tournament?.budgetPerTeam.toLocaleString()}</span>
                                    <span>•</span>
                                    <span>Squad: {tournament?.squadSize}</span>
                                    <span>•</span>
                                    <span>Base: {tournament?.basePricePerPlayer.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center gap-3">
                            {isAuctionStopped ? (
                                <>
                                    <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pause-pulse" />
                                    <span className="text-xl font-bold text-yellow-400 uppercase tracking-wide">
                                        PAUSED
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse" />
                                    <span className="text-xl font-bold text-green-400 uppercase tracking-wide">
                                        LIVE
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Row: Player and Bidding */}
                <div className="grid grid-cols-2 gap-4">
                    <PlayerShowcase player={currentPlayer} tournament={tournament} size={size} />
                    <LiveBiddingPanel auctionState={auctionState} tournament={tournament} player={currentPlayer} size={size} />
                </div>

                {/* Middle Row: Teams Overview */}
                <div className="flex-1 min-h-0">
                    <TeamsOverviewFlip
                        teams={teams}
                        tournament={tournament}
                        auctionState={auctionState}
                        teamsPerPage={teamsPerPage}
                        flipDuration={adjustedFlipDuration}
                    />
                </div>

                {/* Bottom Row: Stats and Recent Sold */}
                <div className="grid grid-cols-2 gap-4">
                    {showStats && (
                        <AuctionStats players={players} soldPlayers={soldPlayers} />
                    )}
                    {showRecentSold && (
                        <RecentSoldPlayers
                            soldPlayers={soldPlayers}
                            teams={teams}
                            tournament={tournament}
                            maxRecent={maxRecentSold}
                        />
                    )}
                    {/* Fill space if one is hidden */}
                    {!showStats && showRecentSold && <div />}
                    {showStats && !showRecentSold && <div />}
                </div>
            </div>

            {/* Sold Celebration Overlay */}
            <SoldCelebration show={showCelebration} />

            {/* Grayscale Overlay when Auction Stopped */}
            {isAuctionStopped && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-8xl mb-4">⏸️</div>
                        <h2 className="text-4xl font-bold text-yellow-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                            AUCTION PAUSED
                        </h2>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuctionOverviewLED;
