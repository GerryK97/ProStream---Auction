'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Player, Team } from '@/types';
import { imageOptimizers } from '@/lib/imageOptimization';

interface SoldPlayersFlipProps {
  soldPlayers: Player[];
  teams: Team[];
  itemsPerPage?: number;
  flipInterval?: number; // milliseconds
}

const formatCurrency = (amount: number) => amount.toLocaleString();

const SoldPlayersFlip: React.FC<SoldPlayersFlipProps> = ({
  soldPlayers,
  teams,
  itemsPerPage = 4,
  flipInterval = 8000,
}) => {
  const enriched = useMemo(() => {
    return soldPlayers
      .filter((player) => player.isSold)
      .slice()
      .reverse()
      .map((player) => ({
        player,
        team: teams.find((team) => team._id === player.winningTeamId) || null,
      }));
  }, [soldPlayers, teams]);

  const pages = useMemo(() => {
    if (enriched.length === 0) return [];
    const chunks: Array<typeof enriched> = [];
    for (let i = 0; i < enriched.length; i += itemsPerPage) {
      chunks.push(enriched.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [enriched, itemsPerPage]);

  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (pages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % pages.length);
    }, flipInterval);
    return () => clearInterval(timer);
  }, [pages.length, flipInterval]);

  if (enriched.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-pink-500/60 bg-neutral-900/60 p-6 text-center text-neutral-400">
        <p>No players sold yet</p>
      </div>
    );
  }

  const pageData = pages[currentPage] || [];

  return (
    <div className="relative h-full overflow-hidden rounded-3xl border border-pink-500/50 bg-neutral-900/70 p-4 backdrop-blur">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-pink-200">Latest Sales</p>
        <h3 className="text-2xl font-bold text-white">Sold Players</h3>
      </div>

      <div className="mt-4 space-y-3">
        {pageData.map(({ player, team }, index) => (
          <div
            key={`${player._id}-${index}`}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.35)] animate-slide-in-right"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex flex-1 items-center gap-3">
              {team?.logoURL && (
                <img
                  src={imageOptimizers.teamThumbnail(team.logoURL)}
                  alt={team.name}
                  className="h-10 w-10 rounded-full border border-white/30 object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{player.name}</p>
                <p className="text-xs text-neutral-300">{team?.name || 'Unknown Team'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">Amount</p>
              <p className="text-2xl font-bold text-pink-300">{formatCurrency(player.finalPrice || 0)}</p>
            </div>
          </div>
        ))}
      </div>

      {pages.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          {pages.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 w-6 rounded-full ${idx === currentPage ? 'bg-pink-400' : 'bg-white/10'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SoldPlayersFlip;
