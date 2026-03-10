'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Team, Tournament, AuctionState } from '@/types';
import TeamCard from './TeamCard';
import PageIndicator from './PageIndicator';

interface TeamsOverviewFlipProps {
    teams: Team[];
    tournament: Tournament | null;
    auctionState: AuctionState;
    teamsPerPage?: number;
    flipDuration?: number; // in milliseconds
}

/**
 * Teams overview with auto-flip pagination for >10 teams
 * Displays teams in 2 rows x 5 columns grid per page
 */
const TeamsOverviewFlip: React.FC<TeamsOverviewFlipProps> = ({
    teams,
    tournament,
    auctionState,
    teamsPerPage = 10,
    flipDuration = 8000
}) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [progress, setProgress] = useState(0);
    const startTimeRef = useRef<number>(Date.now());
    const animationFrameRef = useRef<number | undefined>(undefined);

    // Calculate pagination
    const totalPages = Math.ceil(teams.length / teamsPerPage);
    const startIndex = currentPage * teamsPerPage;
    const endIndex = Math.min(startIndex + teamsPerPage, teams.length);
    const currentTeams = teams.slice(startIndex, endIndex);

    // Split into two rows (5 teams each)
    const row1 = currentTeams.slice(0, 5);
    const row2 = currentTeams.slice(5, 10);

    // Update progress bar
    useEffect(() => {
        if (totalPages <= 1) return;

        const updateProgress = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min((elapsed / flipDuration), 1);
            setProgress(newProgress);

            if (newProgress < 1) {
                animationFrameRef.current = requestAnimationFrame(updateProgress);
            }
        };

        startTimeRef.current = Date.now();
        animationFrameRef.current = requestAnimationFrame(updateProgress);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [currentPage, flipDuration, totalPages]);

    // Auto-flip logic
    useEffect(() => {
        if (totalPages <= 1) return; // No flipping needed

        const timer = setInterval(() => {
            setIsAnimating(true);
            setProgress(0);

            // After animation starts, change page
            setTimeout(() => {
                setCurrentPage((prev) => (prev + 1) % totalPages);
                setIsAnimating(false);
                startTimeRef.current = Date.now();
            }, 1000); // Match animation duration
        }, flipDuration);

        return () => clearInterval(timer);
    }, [totalPages, flipDuration]);

    return (
        <div className="bg-neutral-800/80 backdrop-blur-sm rounded-2xl border-2 border-purple-500 p-4 relative overflow-hidden">
            {/* Header */}
            <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-purple-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-1">
                    TEAMS OVERVIEW
                </h3>
                <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full" />
            </div>

            {/* Teams Grid */}
            <div
                className={`transition-all duration-1000 gpu-accelerated ${
                    isAnimating ? 'animate-team-page-exit' : ''
                }`}
                key={currentPage}
            >
                {/* Row 1 */}
                <div className="grid grid-cols-5 gap-3 mb-3">
                    {row1.map((team, index) => (
                        <TeamCard
                            key={team._id}
                            team={team}
                            tournament={tournament}
                            delay={index * 80}
                            isWinning={auctionState.winningTeamId === team._id}
                            currentBid={auctionState.currentBid}
                        />
                    ))}
                    {/* Fill empty slots in row 1 */}
                    {Array.from({ length: Math.max(0, 5 - row1.length) }, (_, i) => (
                        <div key={`empty-row1-${i}`} className="invisible" />
                    ))}
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-5 gap-3">
                    {row2.map((team, index) => (
                        <TeamCard
                            key={team._id}
                            team={team}
                            tournament={tournament}
                            delay={(index + 5) * 80}
                            isWinning={auctionState.winningTeamId === team._id}
                            currentBid={auctionState.currentBid}
                        />
                    ))}
                    {/* Fill empty slots in row 2 */}
                    {Array.from({ length: Math.max(0, 5 - row2.length) }, (_, i) => (
                        <div key={`empty-row2-${i}`} className="invisible" />
                    ))}
                </div>
            </div>

            {/* Page Indicator */}
            {totalPages > 1 && (
                <PageIndicator
                    currentPage={currentPage}
                    totalPages={totalPages}
                    progress={progress}
                />
            )}

            {/* No Teams Message */}
            {teams.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-neutral-400 text-lg">No teams available</p>
                </div>
            )}
        </div>
    );
};

export default TeamsOverviewFlip;
