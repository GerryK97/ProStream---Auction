'use client';

import React from 'react';
import type { AuctionState, Team, Tournament, Player } from '@/types';
import { getClassBasePrice } from '@/lib/playerClassUtils';

export type BidPanelPhase = 'live' | 'sold' | 'unsold';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';

interface CurrentBidPanelT3Props {
  auctionState: AuctionState;
  teams: Team[];
  tournament: Tournament | null;
  currentPlayer: Player;
  isBidding: boolean;
  bidPopping: boolean;
  bidDelta: number | null;
  phase: BidPanelPhase;
  soldPrice?: number;
  soldTeam?: Team;
}

const CurrentBidT3: React.FC<CurrentBidPanelT3Props> = ({
  auctionState,
  teams,
  tournament,
  currentPlayer,
  isBidding,
  bidPopping,
  bidDelta,
  phase,
  soldPrice,
  soldTeam,
}) => {
  const basePrice = getClassBasePrice(tournament, currentPlayer);
  const hasBid = auctionState.currentBid > 0;
  const teamName = hasBid && auctionState.winningTeamId
    ? teams.find(t => t._id === auctionState.winningTeamId)?.name ?? ''
    : '';

  let label = hasBid ? 'Current Bid' : 'Base Price';
  let displayAmount = (hasBid ? auctionState.currentBid : basePrice).toLocaleString('en-IN');
  let amountColor = isBidding
    ? 'var(--t3-bar-gold, #eda900)'
    : 'var(--t3-bar-text, #ffffff)';
  let showTeam = !!teamName;
  let teamDisplay = teamName;

  if (phase === 'sold') {
    label = 'Sold For';
    displayAmount = (soldPrice ?? auctionState.currentBid ?? basePrice).toLocaleString('en-IN');
    amountColor = 'var(--t3-success, #6EC49A)';
    showTeam = !!soldTeam;
    teamDisplay = soldTeam?.name ?? '';
  } else if (phase === 'unsold') {
    label = 'Unsold';
    displayAmount = basePrice.toLocaleString('en-IN');
    amountColor = 'var(--t3-bar-text-muted, #e0e0e0)';
  }

  return (
    <div
      className={isBidding && phase === 'live' ? 't3bid-glow' : ''}
      style={{
        width: 320,
        height: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
        zIndex: 2,
        boxSizing: 'border-box',
        background: 'rgba(0,0,0,0.35)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Gold left strip */}
      <div
        style={{
          width: 4,
          flexShrink: 0,
          background: phase === 'unsold'
            ? 'var(--t3-danger, #D87070)'
            : 'var(--t3-bar-gold, #eda900)',
        }}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          {isBidding && phase === 'live' && (
            <span
              className="t3bid-dot"
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--t3-bar-gold, #eda900)',
                flexShrink: 0,
              }}
            />
          )}
          <span
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--t3-bar-text-muted, #e0e0e0)',
            }}
          >
            {label}
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <span
            className={bidPopping && phase === 'live' ? 't3bid-pop' : ''}
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 46,
              fontWeight: 700,
              lineHeight: 1,
              color: amountColor,
              textDecoration: phase === 'unsold' ? 'line-through' : 'none',
              transition: 'color 0.3s ease',
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {displayAmount}
          </span>
          {bidDelta != null && bidDelta > 0 && phase === 'live' && (
            <span
              className="t3bid-delta"
              style={{
                position: 'absolute',
                right: 0,
                top: -4,
                fontFamily: DISPLAY_FONT,
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--t3-bar-gold, #eda900)',
              }}
            >
              +{bidDelta.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {showTeam && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            {soldTeam?.logoURL && phase === 'sold' && (
              <img
                src={soldTeam.logoURL}
                alt=""
                style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }}
              />
            )}
            <span
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--t3-bar-text-muted, #e0e0e0)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {phase === 'live' ? teamDisplay : teamDisplay}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export { CurrentBidT3 as CurrentBidPanelT3 };
export default CurrentBidT3;
