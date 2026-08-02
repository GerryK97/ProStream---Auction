'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AuctionState, Player, Team, Tournament } from '@/types';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import { formatT4Amount } from './frame15PlayerCardT4Layout';
import {
  FS_BASE_T4_AMOUNT_SIZE,
  FS_BID_T4_CAPTION_SIZE,
  FS_BID_T4_FONT_SIZE,
  FS_BID_T4_LABEL_SIZE,
  FS_BID_T4_PANEL_MIN_HEIGHT,
  FS2_BASE_T4_AMOUNT_SIZE,
  FS2_BID_T4_FONT_SIZE,
  FS2_BID_T4_LABEL_SIZE,
} from './fullScreenPlayerCardT4Layout';

export type BidPanelPhaseT4 = 'live' | 'sold' | 'unsold';

const LABEL_FONT = 'var(--t4-font-label, "Oswald", "Arial Narrow", sans-serif)';
const NAME_FONT = 'var(--t4-font-name, "Bebas Neue", "Oswald", Impact, sans-serif)';
const GOLD = 'var(--t4-bid-gold, #D4AF37)';
const SUCCESS = 'var(--t4-success, #6EC49A)';

export interface CurrentBidPanelT4Props {
  auctionState: AuctionState;
  teams: Team[];
  tournament: Tournament | null;
  currentPlayer: Player;
  isBidding: boolean;
  bidPopping: boolean;
  bidDelta: number | null;
  phase: BidPanelPhaseT4;
  soldPrice?: number;
  soldTeam?: Team;
  reducedMotion?: boolean;
  layout?: 'bar' | 'fullscreen';
}

function teamInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function PanelChrome({
  label,
  children,
  compact,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        flex: 1,
        borderRadius: compact ? 4 : 6,
        overflow: 'hidden',
        border: '1px solid var(--t4-panel-edge, rgba(212,175,55,0.28))',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          background: 'var(--t4-panel-header)',
          padding: compact ? '6px 10px' : '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--t4-panel-edge, rgba(212,175,55,0.28))',
        }}
      >
        <span
          style={{
            fontFamily: LABEL_FONT,
            fontSize: compact ? FS2_BID_T4_LABEL_SIZE : FS_BID_T4_LABEL_SIZE,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--t4-label, #0A0C12)',
            lineHeight: 1,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          background: 'var(--t4-panel-body)',
          padding: compact ? '10px 12px' : '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: compact ? 56 : undefined,
          boxShadow: 'inset 0 1px 0 var(--t4-panel-edge-soft, rgba(255,255,255,0.12))',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function AmountText({
  amount,
  fontSize,
  color,
  popping,
  strikethrough,
}: {
  amount: string;
  fontSize: number;
  color: string;
  popping?: boolean;
  strikethrough?: boolean;
}) {
  return (
    <span
      className={popping ? 't4bid-pop' : undefined}
      style={{
        fontFamily: LABEL_FONT,
        fontSize,
        fontWeight: 700,
        lineHeight: 1,
        color,
        textDecoration: strikethrough ? 'line-through' : 'none',
        textShadow: '0 2px 8px rgba(0,0,0,0.55)',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {amount}
    </span>
  );
}

function SoldTeamBlock({
  team,
  soldAmount,
  compact,
}: {
  team: Team;
  soldAmount: string;
  compact?: boolean;
}) {
  const logoSize = compact ? 36 : 56;
  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: compact ? 10 : 14,
          marginBottom: compact ? 8 : 12,
        }}
      >
        {team.logoURL ? (
          <img
            src={team.logoURL}
            alt=""
            style={{
              width: logoSize,
              height: logoSize,
              objectFit: 'contain',
              borderRadius: 4,
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: logoSize,
              height: logoSize,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: LABEL_FONT,
              fontWeight: 700,
              fontSize: compact ? 14 : 18,
              color: '#fff',
            }}
          >
            {teamInitials(team.name)}
          </div>
        )}
        <span
          style={{
            fontFamily: NAME_FONT,
            fontSize: compact ? 22 : 40,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#F0D878',
            lineHeight: 1.05,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {team.name}
        </span>
      </div>
      <div
        style={{
          fontFamily: LABEL_FONT,
          fontSize: compact ? 14 : 24,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: SUCCESS,
        }}
      >
        Sold For · {soldAmount}
      </div>
    </div>
  );
}

const CurrentBidPanelT4: React.FC<CurrentBidPanelT4Props> = ({
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
  reducedMotion = false,
  layout = 'bar',
}) => {
  const isFullscreen = layout === 'fullscreen';
  const compact = !isFullscreen;

  const basePrice = getClassBasePrice(tournament, currentPlayer);
  const baseFormatted = formatT4Amount(basePrice);
  const hasBid = auctionState.currentBid > 0;
  const showDual = phase === 'live' && (hasBid || isBidding);
  const teamName =
    hasBid && auctionState.winningTeamId
      ? teams.find(t => t._id === auctionState.winningTeamId)?.name ?? ''
      : '';

  const prevShowDualRef = useRef(showDual);
  const [dualEntering, setDualEntering] = useState(false);

  useEffect(() => {
    if (showDual && !prevShowDualRef.current && !reducedMotion) {
      setDualEntering(true);
      const t = setTimeout(() => setDualEntering(false), 350);
      prevShowDualRef.current = showDual;
      return () => clearTimeout(t);
    }
    prevShowDualRef.current = showDual;
    if (!showDual) setDualEntering(false);
  }, [showDual, reducedMotion]);

  const bidFont = isFullscreen ? FS_BID_T4_FONT_SIZE : FS2_BID_T4_FONT_SIZE;
  const baseAmountSize = isFullscreen ? FS_BASE_T4_AMOUNT_SIZE : FS2_BASE_T4_AMOUNT_SIZE;
  const captionSize = isFullscreen ? FS_BID_T4_CAPTION_SIZE : FS2_BID_T4_LABEL_SIZE;

  let content: React.ReactNode;

  if (phase === 'sold') {
    const soldAmount = formatT4Amount(soldPrice ?? auctionState.currentBid ?? basePrice);
    content = soldTeam ? (
      <SoldTeamBlock team={soldTeam} soldAmount={soldAmount} compact={compact} />
    ) : (
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div
          style={{
            fontFamily: LABEL_FONT,
            fontSize: captionSize,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 8,
          }}
        >
          Sold For
        </div>
        <AmountText amount={soldAmount} fontSize={bidFont} color={SUCCESS} />
      </div>
    );
  } else if (phase === 'unsold') {
    content = (
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div
          style={{
            fontFamily: LABEL_FONT,
            fontSize: captionSize,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 8,
          }}
        >
          Unsold
        </div>
        <AmountText amount={baseFormatted} fontSize={bidFont} color="rgba(255,255,255,0.45)" strikethrough />
      </div>
    );
  } else if (showDual) {
    const bidAmount = formatT4Amount(hasBid ? auctionState.currentBid : basePrice);
    content = (
      <div
        className={dualEntering ? 't4bid-dual-enter' : undefined}
        style={{
          display: 'flex',
          flexDirection: isFullscreen ? 'row' : 'column',
          gap: isFullscreen ? 18 : 10,
          width: '100%',
          alignItems: 'stretch',
          minHeight: isFullscreen ? FS_BID_T4_PANEL_MIN_HEIGHT : undefined,
        }}
      >
        <PanelChrome label="Base Price" compact={compact}>
          <AmountText amount={baseFormatted} fontSize={baseAmountSize} color="var(--t4-base-amount, #fff)" />
        </PanelChrome>
        <PanelChrome label="Current Bid" compact={compact}>
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <AmountText
              amount={bidAmount}
              fontSize={isFullscreen ? Math.min(bidFont, 72) : bidFont}
              color={GOLD}
              popping={bidPopping}
            />
            {bidDelta != null && bidDelta > 0 && (
              <span
                className="t4bid-delta"
                style={{
                  position: 'absolute',
                  right: -4,
                  top: -10,
                  fontFamily: LABEL_FONT,
                  fontSize: compact ? 12 : 18,
                  fontWeight: 700,
                  color: GOLD,
                }}
              >
                +{formatT4Amount(bidDelta)}
              </span>
            )}
          </div>
        </PanelChrome>
      </div>
    );
  } else {
    content = (
      <PanelChrome label="Base Price" compact={compact}>
        <AmountText
          amount={baseFormatted}
          fontSize={isFullscreen ? baseAmountSize : bidFont}
          color="var(--t4-base-amount, #fff)"
        />
      </PanelChrome>
    );
  }

  return (
    <>
      <style>{`
        @keyframes t4BidPop {
          0% { transform: scale(1); }
          40% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes t4BidDelta {
          0% { opacity: 0; transform: translateY(6px); }
          20% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes t4BidDualEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .t4bid-pop { animation: t4BidPop 0.35s ease-out; display: inline-block; }
        .t4bid-delta { animation: t4BidDelta 0.6s ease-out forwards; }
        .t4bid-dual-enter { animation: t4BidDualEnter 0.35s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .t4bid-pop, .t4bid-delta, .t4bid-dual-enter { animation: none !important; }
        }
      `}</style>
      <div
        data-t4-element="current-bid-panel"
        data-t4-layout={layout}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: teamName && phase === 'live' ? 10 : 0,
          minHeight: isFullscreen ? FS_BID_T4_PANEL_MIN_HEIGHT : undefined,
        }}
      >
        {content}
        {teamName && phase === 'live' && showDual && (
          <div
            style={{
              fontFamily: LABEL_FONT,
              fontSize: isFullscreen ? 20 : 14,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(243,226,160,0.9)',
              textAlign: isFullscreen ? 'right' : 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {teamName}
          </div>
        )}
      </div>
    </>
  );
};

export { CurrentBidPanelT4 };
export default CurrentBidPanelT4;
