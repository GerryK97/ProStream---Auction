'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePusherAuction } from '@/hooks/usePusherAuction';
import { Tournament, Player, Team, AuctionState } from '@/types';
import { OVERLAY_PALETTES } from '@/config/overlayPalettes';
import { getClassBasePrice, getClassConfig, getMinClassBasePrice } from '@/lib/playerClassUtils';
import { getEnabledTeamOfficials } from '@/lib/teamOfficials';

const formatCurrency = (amount: number) => amount.toLocaleString('en-IN');

/** Live current-player + bid strip — tournament-wide, always on for Team Owners. */
function LiveBiddingStrip({ currentPlayer, currentBid }: {
    currentPlayer: Player | null;
    currentBid: number;
}) {
    if (!currentPlayer) {
        return (
            <div
                className="mx-4 mt-3 px-3 py-2.5 rounded-xl text-center text-xs font-semibold uppercase tracking-widest"
                style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--overlay-border-accent-subtle)',
                    color: 'var(--overlay-text-muted)',
                    fontFamily: "'Rajdhani', sans-serif",
                }}
            >
                Waiting for next player
            </div>
        );
    }

    const initials = currentPlayer.name
        .split(' ')
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div
            className="mx-4 mt-3 rounded-xl overflow-hidden flex items-center gap-3 px-3 py-2.5"
            style={{
                background: 'rgba(var(--overlay-color-primary-rgb),0.12)',
                border: '1px solid var(--overlay-border-accent-strong)',
                boxShadow: '0 0 16px rgba(var(--overlay-color-primary-rgb),0.18)',
            }}
        >
            <div
                className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                style={{
                    background: 'var(--overlay-bg-photo)',
                    border: '2px solid var(--overlay-color-primary)',
                }}
            >
                {currentPlayer.photoURL ? (
                    <img
                        src={currentPlayer.photoURL}
                        alt={currentPlayer.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span
                        className="text-xs font-bold"
                        style={{ color: 'var(--overlay-color-primary)', fontFamily: "'Rajdhani', sans-serif" }}
                    >
                        {initials}
                    </span>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div
                    className="text-[10px] uppercase tracking-widest font-bold leading-none mb-1"
                    style={{ color: 'var(--overlay-color-primary)', fontFamily: "'Rajdhani', sans-serif" }}
                >
                    Now Bidding
                </div>
                <div
                    className="text-base font-bold truncate leading-tight"
                    style={{ color: 'var(--overlay-text-bright)', fontFamily: "'Rajdhani', sans-serif" }}
                >
                    {currentPlayer.name}
                </div>
            </div>

            <div className="flex-shrink-0 text-right">
                <div
                    className="text-[10px] uppercase tracking-widest font-bold leading-none mb-1"
                    style={{ color: 'var(--overlay-text-muted)', fontFamily: "'Rajdhani', sans-serif" }}
                >
                    Current Bid
                </div>
                <div
                    className="text-lg font-bold leading-tight"
                    style={{ color: 'var(--overlay-color-primary)', fontFamily: "'Rajdhani', sans-serif" }}
                >
                    {formatCurrency(currentBid)}
                </div>
            </div>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TeamSelectorBar({ teams, selectedTeamId, onSelect }: {
    teams: Team[];
    selectedTeamId: string | null;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="sticky top-0 z-10 px-4 py-3 border-b"
             style={{ background: 'var(--overlay-bg-panel)', borderColor: 'var(--overlay-border-accent-subtle)' }}>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-widest"
                   style={{ color: 'var(--overlay-text-muted)', fontFamily: "'Rajdhani', sans-serif" }}>
                Select Your Team
            </label>
            <select
                value={selectedTeamId ?? ''}
                onChange={e => onSelect(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-base font-semibold appearance-none"
                style={{
                    background: 'rgba(0,0,0,0.4)',
                    color: 'var(--overlay-text-bright)',
                    border: '1px solid var(--overlay-border-accent-strong)',
                    fontFamily: "'Rajdhani', sans-serif",
                    outline: 'none',
                }}
            >
                <option value="">— Select Your Team —</option>
                {teams.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.shortCode})</option>
                ))}
            </select>
        </div>
    );
}

function StatTile({ label, value, highlight, danger, squadFull }: {
    label: string;
    value: string;
    highlight?: boolean;
    danger?: boolean;
    squadFull?: boolean;
}) {
    const bgStyle = danger
        ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }
        : squadFull
        ? { background: 'rgba(0,197,76,0.1)', border: '1px solid rgba(0,197,76,0.3)' }
        : { background: 'rgba(0,0,0,0.25)', border: '1px solid var(--overlay-border-accent-subtle)' };

    const valueColor = danger
        ? 'var(--overlay-color-danger)'
        : squadFull
        ? 'var(--overlay-color-success)'
        : highlight
        ? 'var(--overlay-color-primary)'
        : 'var(--overlay-text-bright)';

    return (
        <div className="rounded-xl p-3 flex flex-col gap-1" style={bgStyle}>
            <span className="text-xs uppercase tracking-widest font-semibold"
                  style={{ color: 'var(--overlay-text-muted)', fontFamily: "'Rajdhani', sans-serif" }}>
                {label}
            </span>
            <span className="text-lg font-bold leading-tight"
                  style={{ color: valueColor, fontFamily: "'Rajdhani', sans-serif" }}>
                {value}
            </span>
        </div>
    );
}

function TeamHeaderCard({ team, tournament }: { team: Team; tournament: Tournament | null }) {
    const initials = team.shortCode?.slice(0, 2) ?? team.name.slice(0, 2).toUpperCase();
    const officials = getEnabledTeamOfficials(team, tournament);
    return (
        <div className="flex items-center gap-4 px-4 py-4 border-b"
             style={{ borderColor: 'var(--overlay-border-accent-subtle)' }}>
            {team.logoURL ? (
                <img
                    src={team.logoURL}
                    alt={team.name}
                    className="w-14 h-14 object-contain flex-shrink-0"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(var(--overlay-color-primary-rgb),0.4))' }}
                />
            ) : (
                <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold"
                     style={{
                         background: 'rgba(var(--overlay-color-primary-rgb),0.12)',
                         border: '2px solid rgba(var(--overlay-color-primary-rgb),0.5)',
                         color: 'var(--overlay-color-primary)',
                         fontFamily: "'Rajdhani', sans-serif",
                     }}>
                    {initials}
                </div>
            )}
            <div className="min-w-0">
                <div className="text-xl font-bold leading-tight truncate"
                     style={{ color: 'var(--overlay-color-primary)', fontFamily: "'Rajdhani', sans-serif", letterSpacing: 2 }}>
                    {team.name.toUpperCase()}
                </div>
                {officials.length > 0 && (
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {officials.map((o) => (
                            <div key={o.role} className="flex items-center gap-1.5 min-w-0">
                                {o.photoURL ? (
                                    <img src={o.photoURL} alt={o.name}
                                         className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                         style={{ border: '1px solid var(--overlay-color-primary)' }} />
                                ) : null}
                                <div className="min-w-0">
                                    <div className="text-[10px] uppercase tracking-wide leading-none"
                                         style={{ color: 'var(--overlay-color-primary)', fontFamily: "'Rajdhani', sans-serif" }}>
                                        {o.role}
                                    </div>
                                    <div className="text-sm leading-tight truncate"
                                         style={{ color: 'var(--overlay-text-muted)', fontFamily: "'Rajdhani', sans-serif" }}>
                                        {o.name}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function BoughtPlayerRow({ player }: { player: Player }) {
    const initials = player.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
    return (
        <div className="flex items-center gap-3 py-3 px-4 border-b last:border-b-0"
             style={{ borderColor: 'var(--overlay-border-accent-subtle)' }}>
            <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                 style={{
                     background: 'var(--overlay-bg-photo)',
                     border: '1.5px solid var(--overlay-color-primary)',
                 }}>
                {player.photoURL ? (
                    <img src={player.photoURL} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-xs font-bold"
                          style={{ color: 'var(--overlay-color-primary)', fontFamily: "'Rajdhani', sans-serif" }}>
                        {initials}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate"
                     style={{ color: 'var(--overlay-text-bright)', fontFamily: "'Rajdhani', sans-serif" }}>
                    {player.name}
                </div>
                {player.position && (
                    <div className="text-xs truncate"
                         style={{ color: 'var(--overlay-text-muted)', fontFamily: "'Rajdhani', sans-serif" }}>
                        {player.position}
                    </div>
                )}
            </div>
            <div className="text-sm font-bold flex-shrink-0"
                 style={{ color: 'var(--overlay-color-primary)', fontFamily: "'Rajdhani', sans-serif" }}>
                {player.isIconic ? 'ICONIC' : formatCurrency(player.finalPrice ?? 0)}
            </div>
        </div>
    );
}

function PendingPlayerRow({ player, tournament }: { player: Player; tournament: Tournament | null }) {
    const classConfig = getClassConfig(tournament, player.playerClass);
    const basePrice = getClassBasePrice(tournament, player);
    const initials = player.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
    return (
        <div className="flex items-center gap-3 py-3 px-4 border-b last:border-b-0"
             style={{ borderColor: 'var(--overlay-border-accent-subtle)' }}>
            <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                 style={{
                     background: 'var(--overlay-bg-photo)',
                     border: '1.5px solid var(--overlay-border-accent-subtle)',
                 }}>
                {player.photoURL ? (
                    <img src={player.photoURL} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-xs font-bold"
                          style={{ color: 'var(--overlay-text-muted)', fontFamily: "'Rajdhani', sans-serif" }}>
                        {initials}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold"
                          style={{ color: 'var(--overlay-text-bright)', fontFamily: "'Rajdhani', sans-serif" }}>
                        {player.name}
                    </span>
                    {player.playerClass && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                  background: classConfig?.color ? `${classConfig.color}22` : 'rgba(255,255,255,0.1)',
                                  color: classConfig?.color ?? 'var(--overlay-text-muted)',
                                  border: `1px solid ${classConfig?.color ?? 'rgba(255,255,255,0.2)'}`,
                                  fontFamily: "'Rajdhani', sans-serif",
                              }}>
                            {player.playerClass}
                        </span>
                    )}
                </div>
                {player.position && (
                    <div className="text-xs mt-0.5"
                         style={{ color: 'var(--overlay-text-muted)', fontFamily: "'Rajdhani', sans-serif" }}>
                        {player.position}
                    </div>
                )}
            </div>
            <div className="text-sm font-semibold flex-shrink-0"
                 style={{ color: 'var(--overlay-text-muted)', fontFamily: "'Rajdhani', sans-serif" }}>
                {formatCurrency(basePrice)}
            </div>
        </div>
    );
}

// ── Main dashboard ─────────────────────────────────────────────────────────

function TeamOwnerDashboard({ tournament, players, teams, isConnected, tournamentId, auctionState }: {
    tournament: Tournament | null;
    players: Player[];
    teams: Team[];
    isConnected: boolean;
    tournamentId: string;
    auctionState: AuctionState;
}) {
    const STORAGE_KEY = `team-owner-selection-${tournamentId}`;

    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(STORAGE_KEY) ?? null;
    });

    // Invalidate persisted team ID if team was deleted
    useEffect(() => {
        if (selectedTeamId && teams.length > 0 && !teams.some(t => t._id === selectedTeamId)) {
            setSelectedTeamId(null);
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [teams, selectedTeamId, STORAGE_KEY]);

    const handleSelect = (id: string) => {
        setSelectedTeamId(id || null);
        if (id) localStorage.setItem(STORAGE_KEY, id);
        else localStorage.removeItem(STORAGE_KEY);
    };

    const selectedTeam = teams.find(t => t._id === selectedTeamId) ?? null;
    const currentPlayer = auctionState.currentPlayerId
        ? players.find(p => p._id === auctionState.currentPlayerId) ?? null
        : null;
    const currentBid = auctionState.currentBid ?? 0;

    // Derived stats
    const boughtPlayers = selectedTeam
        ? players
            .filter(p => p.isSold && p.winningTeamId === selectedTeam._id)
            .sort((a, b) => (b.finalPrice ?? 0) - (a.finalPrice ?? 0))
        : [];

    const pendingPlayers = players
        .filter(p => !p.isSold && !p.isUnsold)
        .sort((a, b) => (a.playerClass ?? '').localeCompare(b.playerClass ?? ''));

    // Use live players array — always accurate, unaffected by playersPurchased array drift
    const playersPurchasedCount = selectedTeam
        ? players.filter(p => p.isSold && String(p.winningTeamId) === String(selectedTeam._id)).length
        : 0;
    const squadSize = tournament?.squadSize ?? 0;
    const remainingSlots = Math.max(0, squadSize - playersPurchasedCount);
    const currentBalance = selectedTeam?.currentBalance ?? 0;
    const basePrice = getMinClassBasePrice(tournament);

    // Max bid: with one slot left spend everything; otherwise reserve base price per remaining slot
    const maxBid = remainingSlots <= 1
        ? currentBalance
        : Math.max(0, currentBalance - (remainingSlots - 1) * basePrice);

    const isSquadFull = remainingSlots === 0;

    return (
        <div>
            <TeamSelectorBar teams={teams} selectedTeamId={selectedTeamId} onSelect={handleSelect} />

            <LiveBiddingStrip currentPlayer={currentPlayer} currentBid={currentBid} />

            {!isConnected && (
                <div className="mx-4 mt-3 px-3 py-2 rounded-lg text-xs text-center font-semibold"
                     style={{
                         background: 'rgba(239,68,68,0.12)',
                         color: 'var(--overlay-color-danger)',
                         border: '1px solid rgba(239,68,68,0.3)',
                         fontFamily: "'Rajdhani', sans-serif",
                     }}>
                    Reconnecting to live data...
                </div>
            )}

            {!selectedTeam ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="text-5xl mb-4" style={{ opacity: 0.35 }}>🏏</div>
                    <p className="text-base font-semibold"
                       style={{ color: 'var(--overlay-text-muted)', fontFamily: "'Rajdhani', sans-serif" }}>
                        Select your team above to view statistics
                    </p>
                </div>
            ) : (
                <div>
                    <TeamHeaderCard team={selectedTeam} tournament={tournament} />

                    {/* Stats tiles */}
                    <div className="grid grid-cols-3 gap-3 px-4 py-4">
                        <StatTile label="Balance" value={formatCurrency(currentBalance)} />
                        <StatTile
                            label="Max Bid"
                            value={isSquadFull ? 'Squad Full' : formatCurrency(maxBid)}
                            highlight={!isSquadFull && maxBid > 0}
                            danger={!isSquadFull && maxBid === 0}
                            squadFull={isSquadFull}
                        />
                        <StatTile
                            label="Squad"
                            value={`${playersPurchasedCount}/${squadSize}`}
                            highlight={!isSquadFull}
                            squadFull={isSquadFull}
                        />
                    </div>

                    {/* Players bought */}
                    <div className="mx-4 mb-4 rounded-xl overflow-hidden"
                         style={{ border: '1px solid var(--overlay-border-accent-subtle)', background: 'rgba(0,0,0,0.2)' }}>
                        <div className="px-4 py-2.5 border-b flex items-center justify-between"
                             style={{ borderColor: 'var(--overlay-border-accent-subtle)', background: 'rgba(0,0,0,0.2)' }}>
                            <span className="text-xs uppercase tracking-widest font-bold"
                                  style={{ color: 'var(--overlay-color-primary)', fontFamily: "'Rajdhani', sans-serif" }}>
                                Players Bought
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                  style={{
                                      background: 'rgba(var(--overlay-color-primary-rgb),0.15)',
                                      color: 'var(--overlay-color-primary)',
                                      fontFamily: "'Rajdhani', sans-serif",
                                  }}>
                                {boughtPlayers.length}
                            </span>
                        </div>
                        {boughtPlayers.length === 0 ? (
                            <div className="py-6 text-center text-sm"
                                 style={{ color: 'var(--overlay-text-muted)', fontFamily: "'Rajdhani', sans-serif" }}>
                                No players purchased yet
                            </div>
                        ) : (
                            boughtPlayers.map(p => <BoughtPlayerRow key={p._id} player={p} />)
                        )}
                    </div>

                    {/* Available / pending players */}
                    <div className="mx-4 mb-6 rounded-xl overflow-hidden"
                         style={{ border: '1px solid var(--overlay-border-accent-subtle)', background: 'rgba(0,0,0,0.2)' }}>
                        <div className="px-4 py-2.5 border-b flex items-center justify-between"
                             style={{ borderColor: 'var(--overlay-border-accent-subtle)', background: 'rgba(0,0,0,0.2)' }}>
                            <span className="text-xs uppercase tracking-widest font-bold"
                                  style={{ color: 'var(--overlay-text-subtle)', fontFamily: "'Rajdhani', sans-serif" }}>
                                Available Players
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                  style={{
                                      background: 'rgba(255,255,255,0.08)',
                                      color: 'var(--overlay-text-muted)',
                                      fontFamily: "'Rajdhani', sans-serif",
                                  }}>
                                {pendingPlayers.length}
                            </span>
                        </div>
                        {pendingPlayers.length === 0 ? (
                            <div className="py-6 text-center text-sm"
                                 style={{ color: 'var(--overlay-text-muted)', fontFamily: "'Rajdhani', sans-serif" }}>
                                All players have been sold or passed on
                            </div>
                        ) : (
                            pendingPlayers.map(p => (
                                <PendingPlayerRow key={p._id} player={p} tournament={tournament} />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Root export ────────────────────────────────────────────────────────────

export default function TeamOwnerOverlay({ tournamentId }: { tournamentId: string }) {
    const searchParams = useSearchParams();
    const urlToken = searchParams.get('token') ?? undefined;
    const requestedTheme = searchParams.get('theme');
    const requestedPalette = searchParams.get('palette');

    const { tournament, players, teams, isConnected, isRevoked, auctionState } = usePusherAuction(tournamentId, undefined, urlToken, 'team_owners');

    // Derive palette CSS vars — same URL override/fallback contract as OverlayWrapper
    const theme = requestedTheme && requestedTheme in OVERLAY_PALETTES
        ? requestedTheme as keyof typeof OVERLAY_PALETTES
        : tournament?.overlayTheme || 'standard';
    const paletteId = requestedPalette || tournament?.overlayPalette || 'default';
    const activePalette = OVERLAY_PALETTES[theme]?.find(p => p.id === paletteId)
        || OVERLAY_PALETTES[theme]?.[0]
        || { cssVars: {} };
    const effectiveTournament = tournament
        ? { ...tournament, overlayTheme: theme as Tournament['overlayTheme'], overlayPalette: activePalette.id }
        : tournament;

    if (isRevoked) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-black">
                <div className="text-center">
                    <p className="text-gray-500 text-lg font-medium">Access Revoked</p>
                    <p className="text-gray-700 text-sm mt-1">Contact your administrator</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen w-full"
            style={{
                ...activePalette.cssVars,
                background: 'var(--overlay-bg-fullscreen)',
                color: 'var(--overlay-text-bright)',
            }}
        >
            {/* Tournament header bar */}
            <div className="px-4 py-3 border-b flex items-center gap-3"
                 style={{ borderColor: 'var(--overlay-border-accent-subtle)', background: 'rgba(0,0,0,0.3)' }}>
                {effectiveTournament?.logoURL && (
                    <img src={effectiveTournament.logoURL} alt={effectiveTournament.name} className="w-7 h-7 object-contain flex-shrink-0" />
                )}
                <span className="text-sm font-bold uppercase tracking-widest truncate"
                      style={{ color: 'var(--overlay-color-primary)', fontFamily: "'Rajdhani', sans-serif" }}>
                    {effectiveTournament?.name ?? 'Loading...'}
                </span>
                <a href="/" target="_blank" rel="noopener noreferrer"
                   className="ml-auto flex-shrink-0"
                   style={{ opacity: 0.8, lineHeight: 0 }}
                   title="ProStream">
                    <img src="https://res.cloudinary.com/diitsd6nz/image/upload/v1760794476/ProSteam_logo_h9pb8b.png" alt="ProStream" className="h-7 w-auto object-contain" />
                </a>
            </div>

            <TeamOwnerDashboard
                tournament={effectiveTournament}
                players={players}
                teams={teams}
                isConnected={isConnected}
                tournamentId={tournamentId}
                auctionState={auctionState}
            />
        </div>
    );
}
