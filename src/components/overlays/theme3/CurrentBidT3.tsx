'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AuctionState, Team, Tournament, Player } from '@/types';
import { getClassBasePrice } from '@/lib/playerClassUtils';
import {
  PORTRAIT_BASE_AMOUNT_SIZE,
  PORTRAIT_BASE_LABEL_SIZE,
  PORTRAIT_BID_FONT_SIZE,
} from './customPortraitPlayerCardT3Layout';
import {
  FS_BASE_AMOUNT_SIZE,
  FS_BASE_LABEL_SIZE,
  FS_BID_CAPTION_SIZE,
  FS_BID_FONT_SIZE,
  FS_BID_LABEL_SIZE,
  FS_BID_PANEL_MIN_HEIGHT,
} from './fullScreenPlayerCardT3Layout';
import {
  BAR_BASE_AMOUNT_SIZE,
  BAR_BASE_LABEL_SIZE,
  BAR_BID_CAPTION_SIZE,
  BAR_BID_FONT_SIZE,
  BAR_BID_LABEL_SIZE,
  PLAYER_BAR_T3_BID_WIDTH,
} from './theme3Layout';

export type BidPanelPhase = 'live' | 'sold' | 'unsold';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';
/** Soft metallic gold for live Current Bid amount. */
const SHINE_GOLD = '#E8C84A';

/** Space only before the last three digits — e.g. 410 000 (no lakh gaps). */
function formatAmountSpace(value: number): string {
  const raw = Math.round(Math.abs(value)).toString();
  if (raw.length <= 3) return value < 0 ? `-${raw}` : raw;
  const withSpace = `${raw.slice(0, -3)} ${raw.slice(-3)}`;
  return value < 0 ? `-${withSpace}` : withSpace;
}
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
  compact,
  fontSize,
}: {
  label: string;
  showLiveDot?: boolean;
  highlight?: boolean;
  compact?: boolean;
  fontSize?: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 6 : 8, marginBottom: compact ? 1 : 4 }}>
      {showLiveDot && (
        <span
          className="t3bid-dot"
          style={{
            width: fontSize && fontSize > 14 ? 10 : 8,
            height: fontSize && fontSize > 14 ? 10 : 8,
            borderRadius: '50%',
            background: 'var(--t3-bar-gold, var(--t3-accent))',
            flexShrink: 0,
          }}
        />
      )}
      <span
        style={{
          ...LABEL_STYLE,
          fontSize: fontSize ?? LABEL_STYLE.fontSize,
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
          +{formatAmountSpace(delta)}
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

/**
 * Base Price block.
 * - Small bar: bordered card with accent underline.
 * - Full Screen (roomy): plain typography matching Current Bid caption (no box / underline).
 */
function BasePriceBoxed({
  amount,
  labelSize,
  amountSize,
  entering,
  roomy,
  grow,
}: {
  amount: string;
  labelSize: number;
  amountSize: number;
  entering?: boolean;
  roomy?: boolean;
  /** Stretch wider when Base is the only live price (pre-bid). */
  grow?: boolean;
}) {
  const plain = !!roomy;

  return (
    <div
      className={entering ? 't3bid-base-compact-enter' : 't3bid-base-compact'}
      style={{
        flex: grow ? '1 1 auto' : '0 0 auto',
        alignSelf: 'stretch',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: plain ? 'flex-start' : 'center',
        alignItems: 'flex-start',
        gap: plain ? 6 : 4,
        padding: plain ? '2px 4px' : '8px 10px',
        minWidth: 0,
        maxWidth: grow ? '48%' : plain ? '40%' : '34%',
        overflow: 'visible',
        boxSizing: 'border-box',
        ...(plain
          ? {
              border: 'none',
              borderRadius: 0,
              background: 'transparent',
              boxShadow: 'none',
            }
          : {
              border: '1.5px solid #0a0a0f',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.22)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
            }),
      }}
    >
      <span
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: labelSize,
          fontWeight: plain ? 700 : 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: plain
            ? 'var(--t3-bar-text, #F0F0F8)'
            : 'var(--t3-bar-gold, var(--t3-accent, #00898c))',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Base Price
      </span>
      <span
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: amountSize,
          fontWeight: plain ? 800 : 700,
          lineHeight: 0.9,
          color: 'var(--t3-bar-text, #F0F0F8)',
          textShadow: '0 2px 8px rgba(0,0,0,0.45)',
          whiteSpace: 'nowrap',
          flex: plain ? 1 : undefined,
          display: plain ? 'flex' : undefined,
          alignItems: plain ? 'center' : undefined,
          minHeight: 0,
        }}
      >
        {amount}
      </span>
      {!plain && (
        <span
          style={{
            display: 'block',
            height: 3,
            width: '100%',
            minWidth: 64,
            marginTop: 2,
            borderRadius: 1,
            background: 'var(--t3-bar-gold, var(--t3-accent, #00898c))',
            opacity: 0.9,
          }}
        />
      )}
    </div>
  );
}

/** Shared stub body: caption + amount (transparent, no panel fill). */
function PriceStubBody({
  caption,
  amount,
  amountSize,
  captionSize = 11,
  amountColor,
  align = 'left',
  popping,
  highlighted,
  delta,
  /** Scale the amount to fill the available column height. */
  fillHeight,
}: {
  caption: string;
  amount: string;
  amountSize: number;
  captionSize?: number;
  amountColor?: string;
  align?: 'left' | 'right';
  popping?: boolean;
  highlighted?: boolean;
  delta?: number | null;
  fillHeight?: boolean;
}) {
  const isRight = align === 'right';
  const isShineGold = amountColor === SHINE_GOLD;
  const resolvedAmountColor =
    amountColor ?? 'var(--t3-bar-text, #F0F0F8)';
  const liveClass = highlighted
    ? isShineGold
      ? ' t3bid-amount-live-gold'
      : ' t3bid-amount-live'
    : '';
  return (
    <div
      style={{
        // Right-aligned Current Bid hugs content width so the whole block sits on the right.
        flex: isRight ? '0 1 auto' : '1 1 auto',
        minWidth: 0,
        minHeight: 0,
        height: fillHeight ? '100%' : undefined,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: fillHeight ? 'flex-start' : 'center',
        alignItems: isRight ? 'flex-end' : 'flex-start',
        gap: fillHeight ? 6 : 2,
        padding: '2px 4px',
        boxSizing: 'border-box',
        textAlign: isRight ? 'right' : 'left',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <span
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: captionSize,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--t3-bar-text, #F0F0F8)',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {caption}
      </span>
      <span
        className={`${popping ? 't3bid-pop' : ''}${liveClass}`}
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: amountSize,
          fontWeight: 800,
          lineHeight: 0.9,
          color: isShineGold ? SHINE_GOLD : resolvedAmountColor,
          filter: isShineGold
            ? 'drop-shadow(0 0 4px rgba(232,200,74,0.35))'
            : undefined,
          textShadow: isShineGold
            ? '0 0 6px rgba(232,200,74,0.35)'
            : highlighted
              ? '0 0 14px rgba(var(--t3-accent-rgb, 0,137,140), 0.55), 0 2px 8px rgba(0,0,0,0.4)'
              : '0 2px 8px rgba(0,0,0,0.45)',
          whiteSpace: 'nowrap',
          display: fillHeight ? 'flex' : 'block',
          flex: fillHeight ? 1 : undefined,
          alignItems: fillHeight ? 'center' : undefined,
          maxWidth: '100%',
          overflow: 'visible',
          minHeight: 0,
        }}
      >
        {amount}
      </span>
      {delta != null && delta > 0 && (
        <span
          className="t3bid-delta"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            fontFamily: DISPLAY_FONT,
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--t3-bar-gold, var(--t3-accent))',
          }}
        >
          +{formatAmountSpace(delta)}
        </span>
      )}
    </div>
  );
}

/** Two-column live bid: Base Price (left, compact) separated from Current Bid (right). */
function TwoColumnLiveBidRow({
  bidAmount,
  baseAmount,
  isBidding,
  bidPopping,
  bidDelta,
  teamName,
  teamLogoSize,
  entering,
  bidFontSize,
  bidLabelSize,
  bidCaptionSize,
  baseLabelSize,
  baseAmountSize,
  roomy,
  teamFontSize,
}: {
  bidAmount: string;
  baseAmount: string;
  isBidding: boolean;
  bidPopping: boolean;
  bidDelta: number | null;
  teamName: string;
  teamLogoSize: number;
  entering?: boolean;
  bidFontSize: number;
  bidLabelSize?: number;
  bidCaptionSize?: number;
  baseLabelSize: number;
  baseAmountSize: number;
  roomy?: boolean;
  teamFontSize?: number;
}) {
  const captionSize =
    bidCaptionSize
    ?? (bidLabelSize && bidLabelSize < 16 ? 13 : BAR_BID_CAPTION_SIZE);

  return (
    <div
      className={entering ? 't3bid-dual-stack-enter' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        gap: roomy ? 10 : 2,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          gap: roomy ? 18 : 10,
          flex: 1,
          minHeight: 0,
        }}
      >
        <BasePriceBoxed
          amount={baseAmount}
          labelSize={baseLabelSize}
          amountSize={baseAmountSize}
          entering={entering}
          roomy={roomy}
        />

        {/* Current Bid — pack to the right on Full Screen; Small keeps left flow */}
        <div
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            alignSelf: 'stretch',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: roomy ? 'flex-end' : 'flex-start',
            alignItems: 'stretch',
            minHeight: 0,
            paddingLeft: 2,
            overflow: 'visible',
          }}
        >
          <PriceStubBody
            caption="Current Bid"
            amount={bidAmount}
            amountSize={bidFontSize}
            captionSize={captionSize}
            amountColor={SHINE_GOLD}
            align={roomy ? 'right' : 'left'}
            popping={bidPopping}
            highlighted={isBidding}
            delta={bidDelta}
            fillHeight
          />
        </div>
      </div>

      {teamName && (
        <TeamRow name={teamName} logoSize={teamLogoSize} fontSize={teamFontSize} />
      )}
    </div>
  );
}

function TeamRow({
  name,
  logoURL,
  logoSize = 28,
  fontSize = 13,
}: {
  name: string;
  logoURL?: string;
  logoSize?: number;
  fontSize?: number;
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
          fontSize,
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
  compactBar = false,
}: {
  team: Team;
  soldAmount: string;
  reducedMotion?: boolean;
  nameFontSize?: number;
  subFontSize?: number;
  logoSize?: number;
  /** High-contrast bar layout for mobile / OBS phone viewing. */
  compactBar?: boolean;
}) {
  if (compactBar) {
    return (
      <div
        className={reducedMotion ? undefined : 't3bid-sold-team-enter'}
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
          minWidth: 0,
          padding: '4px 2px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            alignSelf: 'flex-start',
            padding: '2px 10px',
            borderRadius: 4,
            background: 'var(--t3-success, #6EC49A)',
            border: '1.5px solid #0a0a0f',
          }}
        >
          <span
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#0a0a0f',
              lineHeight: 1.1,
            }}
          >
            Sold
          </span>
        </div>
        <div
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: Math.max(subFontSize, 36),
            fontWeight: 800,
            lineHeight: 0.9,
            color: 'var(--t3-success, #6EC49A)',
            textShadow: '0 0 10px rgba(110,196,154,0.4), 0 2px 6px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {soldAmount}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {team.logoURL ? (
            <img
              src={team.logoURL}
              alt=""
              style={{
                width: Math.max(logoSize, 40),
                height: Math.max(logoSize, 40),
                objectFit: 'contain',
                borderRadius: 6,
                flexShrink: 0,
                border: '2px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.08)',
              }}
            />
          ) : (
            <div
              style={{
                width: Math.max(logoSize, 40),
                height: Math.max(logoSize, 40),
                borderRadius: 6,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.12)',
                border: '2px solid rgba(255,255,255,0.35)',
                fontFamily: DISPLAY_FONT,
                fontSize: 16,
                fontWeight: 800,
                color: '#ffffff',
              }}
            >
              {teamInitials(team.name)}
            </div>
          )}
          <span
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: Math.max(nameFontSize, 22),
              fontWeight: 800,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              color: '#ffffff',
              lineHeight: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
              flex: 1,
              textShadow: '0 2px 6px rgba(0,0,0,0.45)',
            }}
          >
            {team.name}
          </span>
        </div>
      </div>
    );
  }

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
  const isBar = layout === 'bar';
  const bidFontSize = isFullscreen
    ? FS_BID_FONT_SIZE
    : isPortraitFooter
      ? PORTRAIT_BID_FONT_SIZE
      : BAR_BID_FONT_SIZE;
  const soldTeamFontSize = isFullscreen ? 44 : isPortraitFooter ? 14 : 26;
  const soldSubFontSize = isFullscreen ? 28 : isPortraitFooter ? 11 : 40;
  const teamRowLogoSize = isFullscreen ? 56 : isPortraitFooter ? 18 : 44;
  const fsLabelSize = isFullscreen ? FS_BID_CAPTION_SIZE : undefined;
  const basePrice = getClassBasePrice(tournament, currentPlayer);
  const baseFormatted = formatAmountSpace(basePrice);
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
    const soldAmount = formatAmountSpace(soldPrice ?? auctionState.currentBid ?? basePrice);
    content = soldTeam ? (
      <SoldTeamPanel
        team={soldTeam}
        soldAmount={soldAmount}
        reducedMotion={reducedMotion}
        nameFontSize={soldTeamFontSize}
        subFontSize={soldSubFontSize}
        logoSize={teamRowLogoSize}
        compactBar={isBar}
      />
    ) : (
      <>
        <BidLabelRow label="Sold For" fontSize={fsLabelSize} />
        <BidAmountRow amount={soldAmount} fontSize={bidFontSize} color="var(--t3-success, #6EC49A)" />
      </>
    );
  } else if (phase === 'unsold') {
    content = (
      <>
        <BidLabelRow label="Unsold" fontSize={fsLabelSize} />
        <BidAmountRow
          amount={baseFormatted}
          fontSize={bidFontSize}
          color={mutedText}
          strikethrough
        />
      </>
    );
  } else if (showDual) {
    const bidAmount = formatAmountSpace(hasBid ? auctionState.currentBid : basePrice);
    // Full Screen uses the same two-column Base + Current Bid layout as Custom Small.
    content = (
      <TwoColumnLiveBidRow
        bidAmount={bidAmount}
        baseAmount={baseFormatted}
        isBidding={isBidding}
        bidPopping={bidPopping}
        bidDelta={bidDelta}
        teamName={teamName}
        teamLogoSize={teamRowLogoSize}
        entering={dualEntering && !reducedMotion}
        bidFontSize={
          isFullscreen
            ? FS_BID_FONT_SIZE
            : isPortraitFooter
              ? PORTRAIT_BID_FONT_SIZE
              : BAR_BID_FONT_SIZE
        }
        bidLabelSize={
          isFullscreen ? FS_BID_LABEL_SIZE : isPortraitFooter ? 14 : BAR_BID_LABEL_SIZE
        }
        bidCaptionSize={
          isFullscreen ? FS_BID_CAPTION_SIZE : undefined
        }
        baseLabelSize={
          isFullscreen
            ? FS_BASE_LABEL_SIZE
            : isPortraitFooter
              ? PORTRAIT_BASE_LABEL_SIZE
              : BAR_BASE_LABEL_SIZE
        }
        baseAmountSize={
          isFullscreen
            ? FS_BASE_AMOUNT_SIZE
            : isPortraitFooter
              ? PORTRAIT_BASE_AMOUNT_SIZE
              : BAR_BASE_AMOUNT_SIZE
        }
        roomy={isFullscreen}
        teamFontSize={isFullscreen ? 20 : undefined}
      />
    );
  } else if (isFullscreen) {
    // Pre-bid: bordered Base Price card (same language as Custom Small), scaled up.
    content = (
      <div
        className="t3bid-base-hero"
        style={{
          display: 'flex',
          alignItems: 'stretch',
          height: '100%',
          minHeight: 120,
        }}
      >
        <BasePriceBoxed
          amount={baseFormatted}
          labelSize={FS_BASE_LABEL_SIZE}
          amountSize={FS_BASE_AMOUNT_SIZE}
          roomy
          grow
        />
      </div>
    );
  } else {
    content = (
      <div
        className="t3bid-base-hero"
        style={
          isPortraitFooter || isBar
            ? { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }
            : undefined
        }
      >
        <BidLabelRow label="Base Price" compact={isPortraitFooter || isBar} fontSize={fsLabelSize} />
        <div
          style={
            isPortraitFooter || isBar
              ? { flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-end' }
              : undefined
          }
        >
          <BidAmountRow
            amount={baseFormatted}
            fontSize={bidFontSize}
            color={primaryText}
          />
        </div>
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
        @keyframes t3bidAmountGoldShine {
          0%, 100% {
            filter: drop-shadow(0 0 3px rgba(232,200,74,0.35)) drop-shadow(0 2px 3px rgba(0,0,0,0.4));
          }
          50% {
            filter: drop-shadow(0 0 7px rgba(245,224,138,0.55)) drop-shadow(0 0 12px rgba(232,200,74,0.35)) drop-shadow(0 2px 3px rgba(0,0,0,0.4));
          }
        }
        .t3bid-amount-live-gold {
          animation: t3bidAmountGoldShine 1.4s ease-in-out infinite;
        }
        @keyframes t3bidCurrentEnter {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes t3bidBaseCompactEnter {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .t3bid-dual-stack-enter {
          animation: t3bidCurrentEnter 350ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .t3bid-base-compact-enter {
          animation: t3bidBaseCompactEnter 350ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
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
          .t3bid-amount-live-gold,
          .t3bid-sold-team-enter {
            animation: none !important;
          }
        }
      `}</style>
      <div
        className={isBidding && phase === 'live' ? 't3bid-glow' : ''}
        style={{
          width: isPortraitFooter ? '100%' : isFullscreen ? '100%' : PLAYER_BAR_T3_BID_WIDTH,
          height: isFullscreen ? FS_BID_PANEL_MIN_HEIGHT : '100%',
          flex: isPortraitFooter ? 1 : undefined,
          minHeight: isFullscreen
            ? FS_BID_PANEL_MIN_HEIGHT
            : isPortraitFooter || isBar
              ? 0
              : undefined,
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
          borderTop: 'none',
          borderRadius: isFullscreen ? 12 : 0,
          overflow: isBar ? 'visible' : 'hidden',
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
            justifyContent: isFullscreen || isPortraitFooter || isBar ? 'stretch' : 'center',
            padding: isPortraitFooter
              ? 0
              : isFullscreen
                ? '14px 24px'
                : '6px 10px 6px 6px',
            minWidth: 0,
            minHeight: 0,
            height: isFullscreen ? '100%' : undefined,
            overflow: isBar ? 'visible' : 'hidden',
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
