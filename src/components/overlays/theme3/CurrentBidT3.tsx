'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AuctionState, Team, Tournament, Player } from '@/types';
import { getClassBasePrice } from '@/lib/playerClassUtils';

export type BidPanelPhase = 'live' | 'sold' | 'unsold';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';
const LABEL_STYLE: React.CSSProperties = {
  fontFamily: DISPLAY_FONT,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--t3-bar-text-muted, var(--t3-text-secondary))',
};

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
  reducedMotion?: boolean;
  layout?: 'bar' | 'fullscreen' | 'portrait-footer';
}

function BidLabelRow({
  label,
  showLiveDot,
  highlight,
}: {
  label: string;
  showLiveDot?: boolean;
  highlight?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      {showLiveDot && (
        <span
          className="t3bid-dot"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--t3-bar-gold, var(--t3-accent))',
            flexShrink: 0,
          }}
        />
      )}
      <span
        style={{
          ...LABEL_STYLE,
          color: highlight
            ? 'var(--t3-bar-text, var(--t3-text-primary))'
            : LABEL_STYLE.color,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function BidAmountRow({
  amount,
  fontSize,
  color,
  popping,
  delta,
  strikethrough,
  highlighted,
}: {
  amount: string;
  fontSize: number;
  color: string;
  popping?: boolean;
  delta?: number | null;
  strikethrough?: boolean;
  highlighted?: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span
        className={`${popping ? 't3bid-pop' : ''}${highlighted ? ' t3bid-amount-live' : ''}`}
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize,
          fontWeight: 700,
          lineHeight: 1,
          color,
          textDecoration: strikethrough ? 'line-through' : 'none',
          transition: 'color 0.3s ease',
          textShadow: highlighted
            ? '0 0 12px rgba(255,255,255,0.45), 0 2px 8px rgba(0,0,0,0.4)'
            : '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {amount}
      </span>
      {delta != null && delta > 0 && (
        <span
          className="t3bid-delta"
          style={{
            position: 'absolute',
            right: 0,
            top: -4,
            fontFamily: DISPLAY_FONT,
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--t3-bar-gold, var(--t3-accent))',
          }}
        >
          +{delta.toLocaleString('en-IN')}
        </span>
      )}
    </div>
  );
}

function CompactBaseRow({
  amount,
  entering,
  amountFontSize = 18,
}: {
  amount: string;
  entering?: boolean;
  amountFontSize?: number;
}) {
  return (
    <div
      className={entering ? 't3bid-base-compact-enter' : 't3bid-base-compact'}
      style={{ marginTop: 4 }}
    >
      <span style={{ ...LABEL_STYLE, fontSize: 11, letterSpacing: '0.1em' }}>BASE · </span>
      <span
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: amountFontSize,
          fontWeight: 700,
          lineHeight: 1,
          color: 'var(--t3-bar-text-muted, var(--t3-text-secondary))',
        }}
      >
        {amount}
      </span>
    </div>
  );
}

function TeamRow({
  name,
  logoURL,
  logoSize = 28,
}: {
  name: string;
  logoURL?: string;
  logoSize?: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      {logoURL && (
        <img
          src={logoURL}
          alt=""
          style={{ width: logoSize, height: logoSize, objectFit: 'contain', borderRadius: 4 }}
        />
      )}
      <span
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--t3-bar-text-muted, var(--t3-text-secondary))',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </span>
    </div>
  );
}

function teamInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function SoldTeamPanel({
  team,
  soldAmount,
  reducedMotion,
  nameFontSize = 24,
  subFontSize = 16,
  logoSize = 36,
}: {
  team: Team;
  soldAmount: string;
  reducedMotion?: boolean;
  nameFontSize?: number;
  subFontSize?: number;
  logoSize?: number;
}) {
  return (
    <div className={reducedMotion ? undefined : 't3bid-sold-team-enter'}>
      <span style={{ ...LABEL_STYLE, marginBottom: 6, display: 'block' }}>Bought By</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
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
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.12)',
              fontFamily: DISPLAY_FONT,
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--t3-bar-text, var(--t3-text-primary))',
            }}
          >
            {teamInitials(team.name)}
          </div>
        )}
        <span
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: nameFontSize,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--t3-bar-text, var(--t3-text-primary))',
            lineHeight: 1.1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            flex: 1,
          }}
        >
          {team.name}
        </span>
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: DISPLAY_FONT,
          fontSize: subFontSize,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--t3-success, #6EC49A)',
        }}
      >
        Sold For · {soldAmount}
      </div>
    </div>
  );
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
  reducedMotion = false,
  layout = 'bar',
}) => {
  const isFullscreen = layout === 'fullscreen';
  const isPortraitFooter = layout === 'portrait-footer';
  const bidFontSize = isFullscreen ? 72 : isPortraitFooter ? 30 : 46;
  const soldTeamFontSize = isFullscreen ? 36 : isPortraitFooter ? 18 : 24;
  const soldSubFontSize = isFullscreen ? 22 : isPortraitFooter ? 14 : 16;
  const compactBaseFontSize = isFullscreen ? 24 : isPortraitFooter ? 13 : 18;
  const teamRowLogoSize = isFullscreen ? 48 : isPortraitFooter ? 22 : 28;
  const basePrice = getClassBasePrice(tournament, currentPlayer);
  const baseFormatted = basePrice.toLocaleString('en-IN');
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

  const primaryText = 'var(--t3-bar-text, var(--t3-text-primary))';
  const mutedText = 'var(--t3-bar-text-muted, var(--t3-text-secondary))';

  let content: React.ReactNode;

  if (phase === 'sold') {
    const soldAmount = (soldPrice ?? auctionState.currentBid ?? basePrice).toLocaleString('en-IN');
    content = soldTeam ? (
      <SoldTeamPanel
        team={soldTeam}
        soldAmount={soldAmount}
        reducedMotion={reducedMotion}
        nameFontSize={soldTeamFontSize}
        subFontSize={soldSubFontSize}
        logoSize={teamRowLogoSize}
      />
    ) : (
      <>
        <BidLabelRow label="Sold For" />
        <BidAmountRow amount={soldAmount} fontSize={bidFontSize} color="var(--t3-success, #6EC49A)" />
      </>
    );
  } else if (phase === 'unsold') {
    content = (
      <>
        <BidLabelRow label="Unsold" />
        <BidAmountRow
          amount={baseFormatted}
          fontSize={bidFontSize}
          color={mutedText}
          strikethrough
        />
      </>
    );
  } else if (showDual) {
    const bidAmount = (hasBid ? auctionState.currentBid : basePrice).toLocaleString('en-IN');
    content = (
      <div className={dualEntering ? 't3bid-dual-stack-enter' : undefined}>
        <BidLabelRow label="Current Bid" showLiveDot={isBidding} highlight={isBidding} />
        <BidAmountRow
          amount={bidAmount}
          fontSize={bidFontSize}
          color={primaryText}
          popping={bidPopping}
          delta={bidDelta}
          highlighted={isBidding}
        />
        <CompactBaseRow
          amount={baseFormatted}
          entering={dualEntering && !reducedMotion}
          amountFontSize={compactBaseFontSize}
        />
        {teamName && <TeamRow name={teamName} logoSize={teamRowLogoSize} />}
      </div>
    );
  } else {
    content = (
      <div className="t3bid-base-hero">
        <BidLabelRow label="Base Price" />
        <BidAmountRow amount={baseFormatted} fontSize={bidFontSize} color={primaryText} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes t3bidAmountHighlight {
          0%, 100% {
            text-shadow: 0 0 10px rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.45);
          }
          50% {
            text-shadow: 0 0 22px rgba(255,255,255,0.85), 0 0 8px rgba(255,255,255,0.55), 0 2px 10px rgba(0,0,0,0.5);
          }
        }
        .t3bid-amount-live {
          animation: t3bidAmountHighlight 1.4s ease-in-out infinite;
        }
        @keyframes t3bidCurrentEnter {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes t3bidBaseCompactEnter {
          from { opacity: 0; max-height: 0; transform: translateY(-6px); }
          to   { opacity: 1; max-height: 28px; transform: translateY(0); }
        }
        .t3bid-dual-stack-enter {
          animation: t3bidCurrentEnter 350ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .t3bid-base-compact-enter {
          animation: t3bidBaseCompactEnter 350ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
          overflow: hidden;
        }
        .t3bid-base-compact {
          overflow: hidden;
        }
        .t3bid-base-hero {
          transition: opacity 280ms ease, transform 280ms ease;
        }
        @keyframes t3bidSoldTeamEnter {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .t3bid-sold-team-enter {
          animation: t3bidSoldTeamEnter 350ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
        }
        @media (prefers-reduced-motion: reduce) {
          .t3bid-dual-stack-enter,
          .t3bid-base-compact-enter,
          .t3bid-amount-live,
          .t3bid-sold-team-enter {
            animation: none !important;
          }
        }
      `}</style>
      <div
        className={isBidding && phase === 'live' ? 't3bid-glow' : ''}
        style={{
          width: isPortraitFooter ? '100%' : isFullscreen ? '100%' : 320,
          height: isPortraitFooter ? 'auto' : isFullscreen ? 'auto' : '100%',
          flexShrink: isPortraitFooter || isFullscreen ? undefined : 0,
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
          zIndex: 2,
          boxSizing: 'border-box',
          background: isPortraitFooter
            ? 'transparent'
            : isFullscreen
              ? 'rgba(0,0,0,0.35)'
              : 'rgba(0,0,0,0.25)',
          borderLeft: isPortraitFooter || isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.08)',
          borderTop: isPortraitFooter ? '1px solid rgba(255,255,255,0.1)' : 'none',
          borderRadius: isFullscreen ? 12 : 0,
          overflow: 'hidden',
        }}
      >
        {!isPortraitFooter && (
        <div
          style={{
            width: isFullscreen ? 6 : 4,
            flexShrink: 0,
            background:
              phase === 'sold'
                ? 'var(--t3-success, #6EC49A)'
                : phase === 'unsold'
                  ? 'var(--t3-danger, #D87070)'
                  : 'var(--t3-bar-gold, var(--t3-accent))',
          }}
        />
        )}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: isPortraitFooter
              ? '10px 0 0'
              : isFullscreen
                ? '28px 32px'
                : '0 18px',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {content}
        </div>
      </div>
    </>
  );
};

export { CurrentBidT3 as CurrentBidPanelT3 };

/** Compact bid row for portrait player card footer (Custom Theme 3 large). */
export function CurrentBidFooterT3(
  props: Omit<CurrentBidPanelT3Props, 'layout'>,
) {
  return <CurrentBidT3 {...props} layout="portrait-footer" />;
}

export default CurrentBidT3;
