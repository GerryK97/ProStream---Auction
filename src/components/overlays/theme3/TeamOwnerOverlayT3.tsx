'use client';

import React, { useEffect, useState } from 'react';
import { TeamWiseImageBackgroundT3 } from './TeamWiseImageBackgroundT3';
import { getClassBasePrice, getClassConfig, getMinClassBasePrice } from '@/lib/playerClassUtils';
import { getEnabledTeamOfficials } from '@/lib/teamOfficials';
import type { AuctionState, Player, Team, Tournament } from '@/types';

const DARK = '#2a2f35';
const GOLD = '#b9aa62';
const WHITE = '#ffffff';
const MUTED = '#cccccc';
const GREEN = '#20c997';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
  @keyframes t3OwnerIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

export interface TeamOwnerOverlayT3Props {
  tournament: Tournament | null;
  players: Player[];
  teams: Team[];
  isConnected: boolean;
  tournamentId: string;
  auctionState: AuctionState;
  paletteCssVars?: React.CSSProperties;
}

const formatCurrency = (amount: number) => amount.toLocaleString('en-IN');

/** Live current-player + bid strip — tournament-wide, always on for Team Owners. */
function LiveBiddingStrip({ currentPlayer, currentBid }: {
  currentPlayer: Player | null;
  currentBid: number;
}) {
  if (!currentPlayer) {
    return (
      <div
        style={{
          margin: '12px 16px 0',
          padding: '10px 14px',
          borderRadius: 10,
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: 'uppercase',
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(185,170,98,0.28)',
          color: MUTED,
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
      style={{
        margin: '12px 16px 0',
        padding: '10px 14px',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(185,170,98,0.12)',
        border: `1px solid ${GOLD}`,
        boxShadow: '0 0 16px rgba(185,170,98,0.2)',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: DARK,
          border: `2px solid ${GOLD}`,
        }}
      >
        {currentPlayer.photoURL ? (
          <img
            src={currentPlayer.photoURL}
            alt={currentPlayer.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{initials}</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: GOLD, lineHeight: 1, marginBottom: 4 }}>
          Now Bidding
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: WHITE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.15 }}>
          {currentPlayer.name}
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: MUTED, lineHeight: 1, marginBottom: 4 }}>
          Current Bid
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: GOLD, lineHeight: 1.15 }}>
          {formatCurrency(currentBid)}
        </div>
      </div>
    </div>
  );
}

function TeamSelectorBar({ teams, selectedTeamId, onSelect }: {
  teams: Team[];
  selectedTeamId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        padding: '14px 16px',
        background: 'rgba(0,0,0,0.72)',
        borderBottom: `2px solid ${GOLD}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: MUTED,
          marginBottom: 8,
        }}
      >
        Select Your Team
      </label>
      <select
        value={selectedTeamId ?? ''}
        onChange={e => onSelect(e.target.value)}
        style={{
          width: '100%',
          borderRadius: 8,
          padding: '12px 14px',
          fontSize: 15,
          fontWeight: 600,
          appearance: 'none',
          background: 'rgba(255,255,255,0.06)',
          color: WHITE,
          border: `1.5px solid ${GOLD}`,
          fontFamily: 'Montserrat, sans-serif',
          outline: 'none',
        }}
      >
        <option value="" style={{ color: DARK }}>— Select Your Team —</option>
        {teams.map(t => (
          <option key={t._id} value={t._id} style={{ color: DARK }}>
            {t.name} ({t.shortCode})
          </option>
        ))}
      </select>
    </div>
  );
}

function StatTile({ label, value, tone = 'default' }: {
  label: string;
  value: string;
  tone?: 'default' | 'highlight' | 'success' | 'danger';
}) {
  const valueColor =
    tone === 'highlight' ? GOLD
    : tone === 'success' ? GREEN
    : tone === 'danger' ? 'var(--t3-danger, #ef4444)'
    : WHITE;

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: '12px 10px',
        borderRadius: 8,
        background: 'rgba(0,0,0,0.35)',
        border: `1px solid rgba(185,170,98,0.35)`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: MUTED }}>
        {label}
      </div>
      <div style={{ marginTop: 6, fontSize: 17, fontWeight: 700, color: valueColor, lineHeight: 1.2 }}>
        {value}
      </div>
    </div>
  );
}

function TeamLogoBadge({ team, size = 56 }: { team: Team; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        flexShrink: 0,
        border: `2px solid ${GOLD}`,
        background: 'rgba(255,255,255,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}
    >
      {team.logoURL ? (
        <img src={team.logoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <span style={{ fontSize: size * 0.32, fontWeight: 800, color: GOLD }}>
          {team.shortCode?.slice(0, 2) ?? '?'}
        </span>
      )}
    </div>
  );
}

function PlayerThumb({ player }: { player: Player }) {
  const src = player.photoURL?.trim() || player.secondaryImageURL?.trim() || '';
  const initials = player.name.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();

  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 8,
        flexShrink: 0,
        border: `2px solid ${GOLD}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {src ? (
        <img src={src} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{initials || '?'}</span>
      )}
    </div>
  );
}

function SectionHeader({ label, count, variant = 'gold' }: {
  label: string;
  count: number;
  variant?: 'gold' | 'dark';
}) {
  const isGold = variant === 'gold';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: isGold ? GOLD : 'rgba(0,0,0,0.45)',
        color: isGold ? DARK : WHITE,
        borderBottom: isGold ? undefined : `1px solid rgba(204,204,204,0.25)`,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          padding: '2px 10px',
          borderRadius: 999,
          background: isGold ? 'rgba(42,47,53,0.12)' : 'rgba(255,255,255,0.1)',
        }}
      >
        {count}
      </span>
    </div>
  );
}

function BoughtPlayerRow({ player }: { player: Player }) {
  const meta = [player.position, player.playerClass].filter(Boolean).join(' · ');
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid rgba(204,204,204,0.35)',
        color: WHITE,
      }}
    >
      <PlayerThumb player={player} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.name}
        </div>
        {meta && (
          <div style={{ marginTop: 3, fontSize: 11, fontWeight: 500, letterSpacing: 1, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
            {meta}
          </div>
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: GOLD, flexShrink: 0 }}>
        {player.isIconic ? 'ICONIC' : formatCurrency(player.finalPrice ?? 0)}
      </div>
    </div>
  );
}

function PendingPlayerRow({ player, tournament }: { player: Player; tournament: Tournament | null }) {
  const classConfig = getClassConfig(tournament, player.playerClass);
  const basePrice = getClassBasePrice(tournament, player);
  const meta = [player.position, player.currentClub].filter(Boolean).join(' · ');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid rgba(204,204,204,0.25)',
        color: WHITE,
      }}
    >
      <PlayerThumb player={player} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{player.name}</span>
          {player.playerClass && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                letterSpacing: 1,
                background: classConfig?.color ? `${classConfig.color}22` : 'rgba(255,255,255,0.08)',
                color: classConfig?.color ?? MUTED,
                border: `1px solid ${classConfig?.color ?? 'rgba(255,255,255,0.2)'}`,
              }}
            >
              {player.playerClass}
            </span>
          )}
        </div>
        {meta && (
          <div style={{ marginTop: 3, fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
            {meta}
          </div>
        )}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: MUTED, flexShrink: 0 }}>
        {formatCurrency(basePrice)}
      </div>
    </div>
  );
}

function TeamOwnerDashboardT3({ tournament, players, teams, isConnected, tournamentId, auctionState }: Omit<TeamOwnerOverlayT3Props, 'paletteCssVars'>) {
  const STORAGE_KEY = `team-owner-selection-${tournamentId}`;

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY) ?? null;
  });

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

  const boughtPlayers = selectedTeam
    ? players
      .filter(p => p.isSold && p.winningTeamId === selectedTeam._id)
      .sort((a, b) => (b.finalPrice ?? 0) - (a.finalPrice ?? 0))
    : [];

  const pendingPlayers = players
    .filter(p => !p.isSold && !p.isUnsold)
    .sort((a, b) => (a.playerClass ?? '').localeCompare(b.playerClass ?? ''));

  const playersPurchasedCount = selectedTeam
    ? players.filter(p => p.isSold && String(p.winningTeamId) === String(selectedTeam._id)).length
    : 0;
  const squadSize = tournament?.squadSize ?? 0;
  const remainingSlots = Math.max(0, squadSize - playersPurchasedCount);
  const currentBalance = selectedTeam?.currentBalance ?? 0;
  const initialBudget = selectedTeam?.initialBudget ?? 0;
  const spent = initialBudget - currentBalance;
  const basePrice = getMinClassBasePrice(tournament);
  const maxBid = remainingSlots <= 1
    ? currentBalance
    : Math.max(0, currentBalance - (remainingSlots - 1) * basePrice);
  const isSquadFull = remainingSlots === 0;

  return (
    <div style={{ position: 'relative', minHeight: '100%', animation: 't3OwnerIn 420ms cubic-bezier(0.22,1,0.36,1) both' }}>
      <TeamSelectorBar teams={teams} selectedTeamId={selectedTeamId} onSelect={handleSelect} />

      <LiveBiddingStrip currentPlayer={currentPlayer} currentBid={currentBid} />

      {!isConnected && (
        <div
          style={{
            margin: '12px 16px 0',
            padding: '10px 14px',
            borderRadius: 8,
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            background: 'var(--t3-danger-soft, rgba(239,68,68,0.12))',
            color: 'var(--t3-danger, #ef4444)',
            border: '1px solid rgba(239,68,68,0.35)',
          }}
        >
          Reconnecting to live data...
        </div>
      )}

      {!selectedTeam ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.35 }}>🏏</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: MUTED, maxWidth: 280, lineHeight: 1.5 }}>
            Select your team above to view live auction statistics
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '18px 16px',
              borderBottom: '1px solid rgba(204,204,204,0.25)',
              background: 'rgba(0,0,0,0.28)',
            }}
          >
            <TeamLogoBadge team={selectedTeam} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: WHITE, textTransform: 'uppercase', letterSpacing: 1, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedTeam.name}
              </div>
              {getEnabledTeamOfficials(selectedTeam, tournament).length > 0 && (
                <div style={{ marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {getEnabledTeamOfficials(selectedTeam, tournament).map((o) => (
                    <div key={o.role} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {o.photoURL && (
                        <img src={o.photoURL} alt={o.name}
                             style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${GOLD}` }} />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: GOLD, textTransform: 'uppercase', lineHeight: 1 }}>{o.role}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: MUTED, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedTeam.shortCode && (
                <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, letterSpacing: 3, color: GOLD, textTransform: 'uppercase' }}>
                  {selectedTeam.shortCode}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, padding: '16px', background: 'rgba(0,0,0,0.18)' }}>
            <StatTile label="Balance" value={formatCurrency(currentBalance)} tone="success" />
            <StatTile
              label="Max Bid"
              value={isSquadFull ? 'Squad Full' : formatCurrency(maxBid)}
              tone={isSquadFull ? 'success' : maxBid > 0 ? 'highlight' : 'danger'}
            />
            <StatTile
              label="Squad"
              value={`${playersPurchasedCount}/${squadSize}`}
              tone={isSquadFull ? 'success' : 'default'}
            />
          </div>

          <div style={{ margin: '0 16px 16px', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
            <SectionHeader label="Players Bought" count={boughtPlayers.length} variant="gold" />
            <div style={{ background: 'rgba(0,0,0,0.32)' }}>
              {boughtPlayers.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 14, color: MUTED }}>
                  No players purchased yet
                </div>
              ) : (
                boughtPlayers.map(p => <BoughtPlayerRow key={p._id} player={p} />)
              )}
            </div>
          </div>

          <div style={{ margin: '0 16px 16px', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
            <SectionHeader label="Available Players" count={pendingPlayers.length} variant="dark" />
            <div style={{ background: 'rgba(0,0,0,0.32)' }}>
              {pendingPlayers.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 14, color: MUTED }}>
                  All players have been sold or passed on
                </div>
              ) : (
                pendingPlayers.map(p => (
                  <PendingPlayerRow key={p._id} player={p} tournament={tournament} />
                ))
              )}
            </div>
          </div>

          <div
            style={{
              margin: '0 16px 24px',
              padding: '14px 12px',
              borderRadius: 10,
              background: GOLD,
              color: DARK,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            }}
          >
            <FooterStat label="Spent" value={formatCurrency(spent)} />
            <FooterStat label="Balance" value={formatCurrency(currentBalance)} />
            <FooterStat label="Squad" value={`${playersPurchasedCount}/${squadSize}`} />
          </div>
        </>
      )}
    </div>
  );
}

function FooterStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 0 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.75 }}>
        {label}
      </div>
      <div style={{ marginTop: 4, fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </div>
    </div>
  );
}

function useViewportHeight() {
  const [height, setHeight] = useState(800);
  useEffect(() => {
    const update = () => setHeight(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return height;
}

export default function TeamOwnerOverlayT3({
  tournament,
  players,
  teams,
  isConnected,
  tournamentId,
  auctionState,
  paletteCssVars = {},
}: TeamOwnerOverlayT3Props) {
  const viewportHeight = useViewportHeight();

  return (
    <>
      <style>{CSS}</style>
      <div
        style={{
          ...paletteCssVars,
          minHeight: '100vh',
          width: '100%',
          position: 'relative',
          fontFamily: 'Montserrat, sans-serif',
          color: WHITE,
          overflowX: 'hidden',
        }}
      >
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <TeamWiseImageBackgroundT3 height={Math.max(viewportHeight - 15, 400)} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <header
            style={{
              background: WHITE,
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            }}
          >
            {tournament?.logoURL && (
              <img src={tournament.logoURL} alt="" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(42,47,53,0.65)', lineHeight: 1 }}>
                {tournament?.name ?? 'Loading...'}
              </div>
              <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700, textTransform: 'uppercase', color: DARK, lineHeight: 1.1 }}>
                Team Owner
              </div>
            </div>
            <a href="/" target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, opacity: 0.85, lineHeight: 0 }} title="ProStream">
              <img
                src="https://res.cloudinary.com/diitsd6nz/image/upload/v1760794476/ProSteam_logo_h9pb8b.png"
                alt="ProStream"
                style={{ height: 28, width: 'auto', objectFit: 'contain' }}
              />
            </a>
          </header>

          <TeamOwnerDashboardT3
            tournament={tournament}
            players={players}
            teams={teams}
            isConnected={isConnected}
            tournamentId={tournamentId}
            auctionState={auctionState}
          />
        </div>
      </div>
    </>
  );
}
