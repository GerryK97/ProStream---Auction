'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AuctionState, Player, Team, Tournament } from '@/types';
import { getClassConfig } from '@/lib/playerClassUtils';
import { optimizeImage } from '@/lib/imageOptimization';
import ResilientImage from '../shared/ResilientImage';
import { PlayerBarBackgroundT3 } from './PlayerBarBackgroundT3';
import CurrentBidPanelT3, { type BidPanelPhase } from './CurrentBidT3';
import { SoldDetailsSectionT3 } from './SoldDetailsSectionT3';
import UnsoldDetailsSectionT3 from './UnsoldDetailsSectionT3';
import { buildPlayerCardLoopItems, PlayerCardLoopSection } from './playerCardLoopItems';
import {
  FS_CARD_CANVAS_W,
  FS_CARD_ENTER_MS,
  FS_CARD_EXIT_MS,
  FS_CARD_GOLD_RAIL_W,
  FS_CARD_PANEL_PADDING,
  FS_CARD_PANEL_LEFT_INSET,
  FS_CARD_SOLD_HOLD_MS,
  FS_CARD_TOP_STRIP_H,
  FS_CARD_UNSOLD_HOLD_MS,
  fsCardNameFontSize,
  fsCardStatSlotHeight,
  getFullScreenCardHeight,
  getFullScreenPhotoWidth,
} from './fullScreenPlayerCardT3Layout';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';

type CardPhase =
  | 'entering'
  | 'livePending'
  | 'liveBidding'
  | 'soldReveal'
  | 'unsoldReveal'
  | 'exiting';

export interface FullScreenPlayerCardT3Props {
  currentPlayer: Player;
  auctionState: AuctionState;
  teams: Team[];
  tournament: Tournament | null;
  tickerVisible: boolean;
  visible: boolean;
  onDismissed?: () => void;
}

function resolveHeroPhoto(player: Player): string | null {
  const raw = player.photoURL?.trim() || player.secondaryImageURL?.trim() || '';
  if (!raw) return null;
  if (raw.startsWith('data:')) return raw;
  return optimizeImage(raw, {
    width: 1400,
    height: 1080,
    crop: 'fit',
    quality: 'auto',
    format: 'auto',
  });
}

function buildProfileFields(player: Player, tournament: Tournament | null) {
  const ppf = tournament?.playerProfileFields;
  const fields: Array<{ label: string; value: string | number; color?: string }> = [];

  if (ppf?.showAge) {
    fields.push({ label: 'Age', value: player.age ?? '—' });
  }
  fields.push({ label: 'Position', value: player.position || '—' });
  if (ppf?.showBattingStyle) {
    fields.push({ label: 'Batting', value: player.battingStyle || '—' });
  }
  if (ppf?.showBowlingStyle) {
    fields.push({ label: 'Bowling', value: player.bowlingStyle || '—' });
  }
  (ppf?.statFields ?? []).forEach(sf => {
    const raw = (player.stats as Record<string, unknown> | undefined)?.[sf.key];
    fields.push({
      label: sf.label,
      value: raw != null && String(raw).trim() !== '' ? String(raw) : '—',
    });
  });
  if (tournament?.usePlayerClasses && (tournament.playerClasses?.length ?? 0) > 0) {
    const cfg = getClassConfig(tournament, player.playerClass);
    fields.push({
      label: 'Class',
      value: player.playerClass || '—',
      color: cfg?.color,
    });
  }
  return fields;
}

export function FullScreenPlayerCardT3({
  currentPlayer,
  auctionState,
  teams,
  tournament,
  tickerVisible,
  visible,
  onDismissed,
}: FullScreenPlayerCardT3Props) {
  const [phase, setPhase] = useState<CardPhase>('entering');
  const [dismissed, setDismissed] = useState(false);
  const [bidPopping, setBidPopping] = useState(false);
  const [bidDelta, setBidDelta] = useState<number | null>(null);
  const [ripple, setRipple] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  /** Whole-card enter gate — card stays hidden until hero is ready, then animates in populated. */
  const [enterActive, setEnterActive] = useState(false);
  const [heroReady, setHeroReady] = useState(false);

  const prevStatusRef = useRef(auctionState.currentAuctionStatus);
  const prevUnsoldRef = useRef(!!currentPlayer.isUnsold);
  const prevBidRef = useRef(auctionState.currentBid);
  const prevPlayerIdRef = useRef(currentPlayer._id);
  const prevAuctionPlayerIdRef = useRef(auctionState.currentPlayerId);
  const dismissedNotifiedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const enterRafRef = useRef(0);

  const cardHeight = getFullScreenCardHeight(tickerVisible);
  const photoWidth = getFullScreenPhotoWidth(cardHeight);
  const panelWidth = FS_CARD_CANVAS_W - photoWidth;
  const photoSrc = resolveHeroPhoto(currentPlayer);
  const loopItems = useMemo(
    () => buildPlayerCardLoopItems(currentPlayer, tournament, { includePosition: false }),
    [currentPlayer, tournament],
  );
  const profileFields = useMemo(
    () => buildProfileFields(currentPlayer, tournament),
    [currentPlayer, tournament],
  );

  const classConfig = getClassConfig(tournament, currentPlayer.playerClass);
  const classColor = classConfig?.color ?? 'var(--t3-accent)';
  const nameFontSize = fsCardNameFontSize(currentPlayer.name.length);
  const dorsalText = currentPlayer.playerNo ? `#${parseInt(currentPlayer.playerNo, 10)}` : '';
  const statSlotH = fsCardStatSlotHeight(profileFields.length, cardHeight - FS_CARD_TOP_STRIP_H);
  const isBidding = auctionState.currentAuctionStatus === 'Bidding';

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  };

  const livePhaseForStatus = (): CardPhase =>
    auctionState.currentAuctionStatus === 'Bidding' ? 'liveBidding' : 'livePending';

  const resetForLivePlayer = () => {
    prevPlayerIdRef.current = currentPlayer._id;
    prevAuctionPlayerIdRef.current = auctionState.currentPlayerId;
    prevStatusRef.current = auctionState.currentAuctionStatus;
    prevUnsoldRef.current = !!currentPlayer.isUnsold;
    prevBidRef.current = auctionState.currentBid;
    dismissedNotifiedRef.current = false;
    setDismissed(false);
    setEnterActive(false);
    setHeroReady(!photoSrc);
    setPhase('entering');
    clearTimers();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Prefetch hero so the enter animation reveals a complete profile, not an empty shell.
  useEffect(() => {
    if (!photoSrc) {
      setHeroReady(true);
      return;
    }
    let cancelled = false;
    setHeroReady(false);
    const img = new Image();
    const markReady = () => {
      if (!cancelled) setHeroReady(true);
    };
    img.onload = markReady;
    img.onerror = markReady;
    img.src = photoSrc;
    if (img.complete) markReady();
    return () => {
      cancelled = true;
    };
  }, [photoSrc, currentPlayer._id]);

  // Start the whole-card enter only after the hero (or initials fallback) is ready.
  useEffect(() => {
    if (phase !== 'entering') {
      setEnterActive(true);
      return;
    }
    if (!heroReady) {
      setEnterActive(false);
      return;
    }

    clearTimers();
    if (enterRafRef.current) cancelAnimationFrame(enterRafRef.current);

    if (reducedMotion) {
      setEnterActive(true);
      setPhase(livePhaseForStatus());
      return;
    }

    setEnterActive(false);
    enterRafRef.current = requestAnimationFrame(() => {
      enterRafRef.current = requestAnimationFrame(() => {
        setEnterActive(true);
        schedule(() => setPhase(livePhaseForStatus()), FS_CARD_ENTER_MS);
      });
    });

    return () => {
      if (enterRafRef.current) cancelAnimationFrame(enterRafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, heroReady, reducedMotion, currentPlayer._id]);

  useEffect(() => {
    if (!visible) {
      setPhase('exiting');
      schedule(() => setDismissed(true), reducedMotion ? 0 : FS_CARD_EXIT_MS);
      return;
    }
    setDismissed(false);
    dismissedNotifiedRef.current = false;
    setEnterActive(false);
    setHeroReady(!photoSrc);
    setPhase('entering');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    const auctionPlayerId = auctionState.currentPlayerId;
    const playerChanged =
      auctionPlayerId !== prevAuctionPlayerIdRef.current ||
      currentPlayer._id !== prevPlayerIdRef.current;

    if (playerChanged && auctionPlayerId) {
      resetForLivePlayer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionState.currentPlayerId, currentPlayer._id, reducedMotion]);

  useEffect(() => {
    const status = auctionState.currentAuctionStatus;
    if (
      dismissed &&
      status !== 'Sold' &&
      (status === 'Pending' || status === 'Bidding')
    ) {
      resetForLivePlayer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionState.currentAuctionStatus, dismissed, reducedMotion]);

  useEffect(() => {
    const status = auctionState.currentAuctionStatus;

    if (status === 'Bidding' && phase !== 'soldReveal' && phase !== 'unsoldReveal' && phase !== 'exiting') {
      setPhase('liveBidding');
    }

    if (status === 'Sold' && prevStatusRef.current !== 'Sold') {
      prevStatusRef.current = 'Sold';
      setPhase('soldReveal');
      clearTimers();
      schedule(() => {
        setPhase('exiting');
        schedule(() => setDismissed(true), reducedMotion ? 0 : FS_CARD_EXIT_MS);
      }, FS_CARD_SOLD_HOLD_MS);
    }

    // mark-unsold clears currentPlayerId in the same update that sets isUnsold.
    if (
      currentPlayer.isUnsold &&
      phase !== 'unsoldReveal' &&
      phase !== 'exiting' &&
      phase !== 'soldReveal'
    ) {
      prevUnsoldRef.current = true;
      setPhase('unsoldReveal');
      clearTimers();
      schedule(() => {
        setPhase('exiting');
        schedule(() => setDismissed(true), reducedMotion ? 0 : FS_CARD_EXIT_MS);
      }, FS_CARD_UNSOLD_HOLD_MS);
      return;
    }

    if (!currentPlayer.isUnsold) {
      prevUnsoldRef.current = false;
    }
  }, [auctionState.currentAuctionStatus, currentPlayer.isUnsold, phase, reducedMotion]);

  useEffect(() => {
    if (
      auctionState.currentBid !== prevBidRef.current &&
      auctionState.currentBid > 0 &&
      auctionState.currentAuctionStatus === 'Bidding'
    ) {
      const delta = auctionState.currentBid - prevBidRef.current;
      prevBidRef.current = auctionState.currentBid;
      setBidDelta(delta > 0 ? delta : null);
      setBidPopping(true);
      setRipple(true);
      const popT = setTimeout(() => setBidPopping(false), 350);
      const deltaT = setTimeout(() => setBidDelta(null), 600);
      const rippleT = setTimeout(() => setRipple(false), 400);
      return () => {
        clearTimeout(popT);
        clearTimeout(deltaT);
        clearTimeout(rippleT);
      };
    }
    prevBidRef.current = auctionState.currentBid;
  }, [auctionState.currentBid, auctionState.currentAuctionStatus]);

  useEffect(() => {
    if (dismissed && !dismissedNotifiedRef.current) {
      dismissedNotifiedRef.current = true;
      onDismissed?.();
    }
  }, [dismissed, onDismissed]);

  useEffect(() => () => clearTimers(), []);

  if (!visible || dismissed) return null;

  const bidPanelPhase: BidPanelPhase =
    phase === 'soldReveal' ? 'sold'
    : phase === 'unsoldReveal' ? 'unsold'
    : 'live';

  const soldTeam = teams.find(
    t => t._id === (currentPlayer.winningTeamId ?? auctionState.winningTeamId),
  );
  const soldPrice = currentPlayer.finalPrice ?? auctionState.currentBid;
  const loopActive = phase === 'livePending' || phase === 'liveBidding';
  const showSoldOverlay = phase === 'soldReveal';
  const showUnsoldOverlay = phase === 'unsoldReveal';
  const isExiting = phase === 'exiting';
  const isEntering = phase === 'entering';
  // Stay fully transparent until hero is ready (and the enter transition has started),
  // so viewers never see an empty chrome shell before the populated profile.
  const hideUntilPopulated =
    isEntering && (!heroReady || (!enterActive && !reducedMotion));

  const cardTransform = isExiting
    ? 'scale(0.97) translateY(-24px)'
    : hideUntilPopulated
      ? 'scale(0.985) translateY(36px)'
      : 'scale(1) translateY(0)';

  const cardOpacity = isExiting || hideUntilPopulated ? 0 : 1;

  const initials = currentPlayer.name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Saira+Extra+Condensed:wght@600;700;800&display=swap');
        @keyframes t3FsRipple {
          0%   { transform: translateX(-100%); opacity: 0.85; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes t3FsLiveDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.35; transform: scale(0.65); }
        }
        @keyframes t3FsUnsoldFlash {
          0% { opacity: 0; }
          18% { opacity: 0.55; }
          100% { opacity: 0; }
        }
        .t3fs-live-dot { animation: t3FsLiveDot 1.1s ease-in-out infinite; }
        .t3fs-unsold-flash { animation: t3FsUnsoldFlash 0.7s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .t3fs-live-dot,
          .t3fs-unsold-flash { animation: none !important; }
        }
      `}</style>

      <div
        key={currentPlayer._id}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: cardHeight,
          zIndex: 10,
          pointerEvents: 'none',
          overflow: 'hidden',
          background: 'var(--t3-gradient-canvas, var(--overlay-bg-fullscreen))',
          opacity: cardOpacity,
          transform: cardTransform,
          // Enter uses the longer enter curve so the populated profile rises in as one unit.
          transition: reducedMotion
            ? 'opacity 0.15s ease, transform 0.15s ease'
            : isEntering || hideUntilPopulated
              ? `opacity ${FS_CARD_ENTER_MS}ms ease, transform ${FS_CARD_ENTER_MS}ms cubic-bezier(0.22,1,0.36,1)`
              : `opacity ${FS_CARD_EXIT_MS}ms ease, transform ${FS_CARD_EXIT_MS}ms cubic-bezier(0.4,0,0.2,1)`,
          filter: showUnsoldOverlay ? 'saturate(0.45) brightness(0.88)' : undefined,
        }}
      >
        <PlayerBarBackgroundT3
          animateSkew={isBidding && loopActive}
          reducedMotion={reducedMotion}
        />

        {ripple && !reducedMotion && (
          <div
            style={{
              position: 'absolute',
              top: FS_CARD_TOP_STRIP_H,
              left: 0,
              right: 0,
              height: 3,
              background: 'var(--t3-bar-gold, var(--t3-accent))',
              animation: 't3FsRipple 0.45s ease-out forwards',
              zIndex: 8,
            }}
          />
        )}

        {/* Top strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: FS_CARD_TOP_STRIP_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 40px',
            zIndex: 5,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.28)',
          }}
        >
          <span
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--t3-text-secondary)',
            }}
          >
            {tournament?.name ?? 'Live Auction'}
          </span>
          {isBidding && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 20px',
                borderRadius: 999,
                background: 'rgba(var(--t3-accent-rgb, 0,137,140), 0.18)',
                border: '1px solid rgba(var(--t3-accent-rgb, 0,137,140), 0.45)',
              }}
            >
              <span className="t3fs-live-dot" style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--t3-success, #6EC49A)' }} />
              <span style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--t3-success, #6EC49A)' }}>LIVE</span>
            </div>
          )}
        </div>

        {/* Hero photo */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: FS_CARD_TOP_STRIP_H,
            width: photoWidth,
            height: cardHeight - FS_CARD_TOP_STRIP_H,
            overflow: 'hidden',
            background: 'var(--t3-bg-photo, #101018)',
            zIndex: 2,
          }}
        >
          {photoSrc ? (
            <ResilientImage
              src={photoSrc}
              alt={currentPlayer.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center center', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--t3-bg-panel)' }}>
              <span style={{ fontFamily: DISPLAY_FONT, fontSize: 140, fontWeight: 800, color: 'rgba(255,255,255,0.15)' }}>{initials}</span>
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent 55%, rgba(0,0,0,0.55) 100%)',
              pointerEvents: 'none',
            }}
          />
          {currentPlayer.playerClass && (
            <div
              style={{
                position: 'absolute',
                bottom: 32,
                left: 32,
                background: classColor,
                color: '#fff',
                padding: '12px 26px',
                borderRadius: 6,
                fontFamily: DISPLAY_FONT,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {currentPlayer.playerClass}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div
          style={{
            position: 'absolute',
            left: photoWidth,
            top: FS_CARD_TOP_STRIP_H,
            width: panelWidth,
            height: cardHeight - FS_CARD_TOP_STRIP_H,
            background: 'var(--t3-bg-panel, #202020)',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-16px 0 48px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 48, bottom: 48, width: FS_CARD_GOLD_RAIL_W, background: 'var(--t3-bar-gold, var(--t3-accent))', borderRadius: '0 3px 3px 0' }} />

          {dorsalText && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 24,
                fontFamily: DISPLAY_FONT,
                fontSize: Math.round(panelWidth * 0.18),
                fontWeight: 800,
                lineHeight: 1,
                color: 'var(--t3-bar-gold, var(--t3-accent))',
                opacity: 0.12,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              {dorsalText}
            </div>
          )}

          <div style={{ padding: `${FS_CARD_PANEL_PADDING}px ${FS_CARD_PANEL_PADDING}px 0 ${FS_CARD_PANEL_LEFT_INSET}px`, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: nameFontSize,
                fontWeight: 800,
                lineHeight: 1.02,
                textTransform: 'uppercase',
                color: 'var(--t3-text-primary)',
                marginBottom: 16,
                wordBreak: 'break-word',
              }}
            >
              {currentPlayer.name}
            </div>

            <div style={{ marginBottom: 20, minHeight: 38 }}>
              {!showSoldOverlay && !showUnsoldOverlay && (
                <PlayerCardLoopSection
                  items={loopItems}
                  active={loopActive}
                  reducedMotion={reducedMotion}
                  fontSize={30}
                />
              )}
            </div>

            <div style={{ height: 2, background: 'rgba(255,255,255,0.1)', marginBottom: 24 }} />

            {!showSoldOverlay && !showUnsoldOverlay && profileFields.length > 0 && (
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {profileFields.map(field => (
                  <div
                    key={field.label}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 16,
                      minHeight: statSlotH,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      padding: '8px 0',
                    }}
                  >
                    <span style={{ fontFamily: DISPLAY_FONT, fontSize: 30, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3-text-muted)' }}>
                      {field.label}
                    </span>
                    <span
                      style={{
                        fontFamily: DISPLAY_FONT,
                        fontSize: Math.max(38, Math.round(statSlotH * 0.5)),
                        fontWeight: 700,
                        color: field.color ?? 'var(--t3-text-primary)',
                        textAlign: 'right',
                      }}
                    >
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {showSoldOverlay && (
              <SoldDetailsSectionT3
                reducedMotion={reducedMotion}
                barHeight={cardHeight - FS_CARD_TOP_STRIP_H - 180}
              />
            )}

            {showUnsoldOverlay && (
              <UnsoldDetailsSectionT3
                currentPlayer={currentPlayer}
                tournament={tournament}
                reducedMotion={reducedMotion}
              />
            )}

            <div style={{ marginTop: 'auto', paddingTop: 24, paddingBottom: FS_CARD_PANEL_PADDING }}>
              <CurrentBidPanelT3
                auctionState={auctionState}
                teams={teams}
                tournament={tournament}
                currentPlayer={currentPlayer}
                isBidding={isBidding}
                bidPopping={bidPopping}
                bidDelta={bidDelta}
                phase={bidPanelPhase}
                soldPrice={soldPrice}
                soldTeam={soldTeam}
                reducedMotion={reducedMotion}
                layout="fullscreen"
              />
            </div>
          </div>
        </div>

        {showUnsoldOverlay && !reducedMotion && (
          <div
            className="t3fs-unsold-flash"
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 11,
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(216,112,112,0.4) 0%, transparent 70%)',
            }}
          />
        )}
      </div>
    </>
  );
}

export default FullScreenPlayerCardT3;
