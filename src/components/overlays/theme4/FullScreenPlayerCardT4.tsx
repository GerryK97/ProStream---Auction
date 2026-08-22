'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AuctionState, Player, Team, Tournament } from '@/types';
import { getClassConfig } from '@/lib/playerClassUtils';
import { optimizeImage } from '@/lib/imageOptimization';
import ResilientImage from '../shared/ResilientImage';
import CurrentBidPanelT4, { type BidPanelPhaseT4 } from './CurrentBidPanelT4';
import SoldDetailsSectionT4 from './SoldDetailsSectionT4';
import UnsoldDetailsSectionT4 from './UnsoldDetailsSectionT4';
import {
  buildPlayerCardLoopItemsT4,
  PlayerCardLoopSectionT4,
} from './playerCardLoopItemsT4';
import {
  FS_CARD_T4_CANVAS_W,
  FS_CARD_T4_DEFAULT_ASPECT,
  FS_CARD_T4_ENTER_MS,
  FS_CARD_T4_EXIT_MS,
  FS_CARD_T4_GOLD_RAIL_W,
  FS_CARD_T4_PANEL_LEFT_INSET,
  FS_CARD_T4_PANEL_PADDING,
  FS_CARD_T4_SOLD_HOLD_MS,
  FS_CARD_T4_TOP_STRIP_H,
  FS_CARD_T4_UNSOLD_HOLD_MS,
  fsCardT4NameFontSize,
  fsCardT4StatSlotHeight,
  getFullScreenCardT4Height,
  getFullScreenPhotoT4Box,
} from './fullScreenPlayerCardT4Layout';

const LABEL_FONT = 'var(--t4-font-label, "Oswald", "Arial Narrow", sans-serif)';
const NAME_FONT = 'var(--t4-font-name, "Bebas Neue", "Oswald", Impact, sans-serif)';

type CardPhase =
  | 'entering'
  | 'livePending'
  | 'liveBidding'
  | 'soldReveal'
  | 'unsoldReveal'
  | 'exiting';

export interface FullScreenPlayerCardT4Props {
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
  // Preserve original aspect — limit longest edge only (no crop / no forced box).
  return optimizeImage(raw, {
    width: 1600,
    height: 1600,
    crop: 'limit',
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

export function FullScreenPlayerCardT4({
  currentPlayer,
  auctionState,
  teams,
  tournament,
  tickerVisible,
  visible,
  onDismissed,
}: FullScreenPlayerCardT4Props) {
  const [phase, setPhase] = useState<CardPhase>('entering');
  const [dismissed, setDismissed] = useState(false);
  const [bidPopping, setBidPopping] = useState(false);
  const [bidDelta, setBidDelta] = useState<number | null>(null);
  const [ripple, setRipple] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [enterActive, setEnterActive] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  /** naturalWidth / naturalHeight — drives photo box + details split. */
  const [imageAspect, setImageAspect] = useState(FS_CARD_T4_DEFAULT_ASPECT);

  const prevStatusRef = useRef(auctionState.currentAuctionStatus);
  const prevUnsoldRef = useRef(!!currentPlayer.isUnsold);
  const prevBidRef = useRef(auctionState.currentBid);
  const prevPlayerIdRef = useRef(currentPlayer._id);
  const prevAuctionPlayerIdRef = useRef(auctionState.currentPlayerId);
  const dismissedNotifiedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const enterRafRef = useRef(0);

  const cardHeight = getFullScreenCardT4Height(tickerVisible);
  const photoBox = getFullScreenPhotoT4Box(cardHeight, imageAspect);
  const photoWidth = photoBox.width;
  const panelWidth = FS_CARD_T4_CANVAS_W - photoWidth - FS_CARD_T4_GOLD_RAIL_W;
  const contentTop = FS_CARD_T4_TOP_STRIP_H;
  const contentH = cardHeight - FS_CARD_T4_TOP_STRIP_H;
  const photoSrc = resolveHeroPhoto(currentPlayer);
  const loopItems = useMemo(
    () => buildPlayerCardLoopItemsT4(currentPlayer, tournament, { includePosition: false }),
    [currentPlayer, tournament],
  );
  const profileFields = useMemo(
    () => buildProfileFields(currentPlayer, tournament),
    [currentPlayer, tournament],
  );

  const classConfig = getClassConfig(tournament, currentPlayer.playerClass);
  const classColor = classConfig?.color ?? 'var(--t4-bid-gold, #D4AF37)';
  const nameFontSize = fsCardT4NameFontSize(currentPlayer.name.length, panelWidth);
  const dorsalText = currentPlayer.playerNo ? `#${parseInt(currentPlayer.playerNo, 10)}` : '';
  const statSlotH = fsCardT4StatSlotHeight(profileFields.length, cardHeight - FS_CARD_T4_TOP_STRIP_H);
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
    setImageAspect(FS_CARD_T4_DEFAULT_ASPECT);
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

  useEffect(() => {
    if (!photoSrc) {
      setImageAspect(FS_CARD_T4_DEFAULT_ASPECT);
      setHeroReady(true);
      return;
    }
    let cancelled = false;
    setHeroReady(false);
    // Keep previous aspect while loading to avoid layout jump to square.
    const img = new Image();
    const applySize = () => {
      if (cancelled) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w > 0 && h > 0) {
        setImageAspect(w / h);
      }
      setHeroReady(true);
    };
    img.onload = applySize;
    img.onerror = () => {
      if (!cancelled) {
        setImageAspect(FS_CARD_T4_DEFAULT_ASPECT);
        setHeroReady(true);
      }
    };
    img.src = photoSrc;
    if (img.complete && img.naturalWidth > 0) applySize();
    return () => {
      cancelled = true;
    };
  }, [photoSrc, currentPlayer._id]);

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
        schedule(() => setPhase(livePhaseForStatus()), FS_CARD_T4_ENTER_MS);
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
      schedule(() => setDismissed(true), reducedMotion ? 0 : FS_CARD_T4_EXIT_MS);
      return;
    }
    setDismissed(false);
    dismissedNotifiedRef.current = false;
    setEnterActive(false);
    setHeroReady(!photoSrc);
    setImageAspect(FS_CARD_T4_DEFAULT_ASPECT);
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
        schedule(() => setDismissed(true), reducedMotion ? 0 : FS_CARD_T4_EXIT_MS);
      }, FS_CARD_T4_SOLD_HOLD_MS);
    }

    // mark-unsold clears currentPlayerId in the same update that sets isUnsold.
    // Enter unsold reveal whenever we see isUnsold outside reveal/exit — not only
    // on the false→true edge (remount / stage-player hold).
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
        schedule(() => setDismissed(true), reducedMotion ? 0 : FS_CARD_T4_EXIT_MS);
      }, FS_CARD_T4_UNSOLD_HOLD_MS);
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

  const bidPanelPhase: BidPanelPhaseT4 =
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
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Bebas+Neue&display=swap');
        @keyframes t4FsRipple {
          0%   { transform: translateX(-100%); opacity: 0.85; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes t4FsLiveDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.35; transform: scale(0.65); }
        }
        @keyframes t4FsSoldFlash {
          0% { opacity: 0; }
          20% { opacity: 0.55; }
          100% { opacity: 0; }
        }
        @keyframes t4FsUnsoldFlash {
          0% { opacity: 0; }
          18% { opacity: 0.55; }
          100% { opacity: 0; }
        }
        .t4fs-live-dot { animation: t4FsLiveDot 1.1s ease-in-out infinite; }
        .t4fs-sold-flash { animation: t4FsSoldFlash 0.7s ease-out both; }
        .t4fs-unsold-flash { animation: t4FsUnsoldFlash 0.7s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .t4fs-live-dot,
          .t4fs-sold-flash,
          .t4fs-unsold-flash { animation: none !important; }
        }
      `}</style>

      <div
        key={currentPlayer._id}
        data-t4-element="fullscreen-player-card"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: cardHeight,
          zIndex: 10,
          pointerEvents: 'none',
          overflow: 'hidden',
          background: 'var(--t4-gradient-canvas, var(--overlay-bg-fullscreen))',
          opacity: cardOpacity,
          transform: cardTransform,
          transition: reducedMotion
            ? 'opacity 0.15s ease, transform 0.15s ease'
            : isEntering || hideUntilPopulated
              ? `opacity ${FS_CARD_T4_ENTER_MS}ms ease, transform ${FS_CARD_T4_ENTER_MS}ms cubic-bezier(0.22,1,0.36,1)`
              : `opacity ${FS_CARD_T4_EXIT_MS}ms ease, transform ${FS_CARD_T4_EXIT_MS}ms cubic-bezier(0.4,0,0.2,1)`,
          filter: showUnsoldOverlay ? 'saturate(0.45) brightness(0.88)' : undefined,
        }}
      >
        {/* Soft navy wash */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 70% at 70% 40%, rgba(20,40,80,0.35) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        {ripple && !reducedMotion && (
          <div
            style={{
              position: 'absolute',
              top: FS_CARD_T4_TOP_STRIP_H,
              left: 0,
              right: 0,
              height: 3,
              background: 'var(--t4-bid-gold, #D4AF37)',
              animation: 't4FsRipple 0.45s ease-out forwards',
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
            height: FS_CARD_T4_TOP_STRIP_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 40px',
            zIndex: 5,
            borderBottom: '1px solid rgba(212,175,55,0.25)',
            background:
              'linear-gradient(180deg, rgba(30,36,48,0.95) 0%, rgba(8,12,22,0.9) 100%)',
          }}
        >
          <span
            style={{
              fontFamily: LABEL_FONT,
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(243,226,160,0.85)',
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
                borderRadius: 4,
                background: 'rgba(212,175,55,0.15)',
                border: '1px solid rgba(212,175,55,0.55)',
              }}
            >
              <span
                className="t4fs-live-dot"
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--t4-success, #6EC49A)',
                }}
              />
              <span
                style={{
                  fontFamily: LABEL_FONT,
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  color: 'var(--t4-success, #6EC49A)',
                }}
              >
                LIVE
              </span>
            </div>
          )}
        </div>

        {/* Photo stage — full original image (contain), box sized to aspect */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: contentTop,
            width: photoWidth,
            height: contentH,
            overflow: 'hidden',
            background: 'var(--t4-bg-photo, #0A0C10)',
            zIndex: 2,
            transition: reducedMotion
              ? undefined
              : 'width 0.45s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {photoSrc ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: photoBox.top,
                width: photoBox.width,
                height: photoBox.height,
              }}
            >
              <ResilientImage
                src={photoSrc}
                alt={currentPlayer.name}
                onLoad={e => {
                  const el = e.currentTarget;
                  if (el.naturalWidth > 0 && el.naturalHeight > 0) {
                    setImageAspect(el.naturalWidth / el.naturalHeight);
                  }
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center center',
                  display: 'block',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(8,12,22,0.95)',
              }}
            >
              <span
                style={{
                  fontFamily: NAME_FONT,
                  fontSize: 140,
                  fontWeight: 700,
                  color: 'rgba(243,226,160,0.15)',
                }}
              >
                {initials}
              </span>
            </div>
          )}
          {/* Soft fade only at the rail edge — does not cover the player */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 28,
              background:
                'linear-gradient(90deg, transparent 0%, rgba(5,8,16,0.35) 100%)',
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
                borderRadius: 4,
                fontFamily: LABEL_FONT,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                zIndex: 3,
              }}
            >
              {currentPlayer.playerClass}
            </div>
          )}
        </div>

        {/* Gold rail */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: photoWidth,
            top: contentTop,
            width: FS_CARD_T4_GOLD_RAIL_W,
            height: contentH,
            background:
              'linear-gradient(180deg, #F3E2A0 0%, #D4AF37 40%, #B8860B 100%)',
            boxShadow: '0 0 18px rgba(212,175,55,0.45)',
            zIndex: 4,
            transition: reducedMotion
              ? undefined
              : 'left 0.45s cubic-bezier(0.22,1,0.36,1)',
          }}
        />

        {/* Info panel — fills remaining width beside the photo */}
        <div
          style={{
            position: 'absolute',
            left: photoWidth + FS_CARD_T4_GOLD_RAIL_W,
            top: contentTop,
            width: panelWidth,
            height: contentH,
            display: 'flex',
            flexDirection: 'column',
            background:
              'linear-gradient(160deg, rgba(18,24,40,0.98) 0%, rgba(6,10,18,0.98) 100%)',
            borderLeft: '1px solid rgba(212,175,55,0.15)',
            zIndex: 3,
            overflow: 'hidden',
            transition: reducedMotion
              ? undefined
              : 'width 0.45s cubic-bezier(0.22,1,0.36,1), left 0.45s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {dorsalText && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 24,
                fontFamily: NAME_FONT,
                fontSize: Math.round(panelWidth * 0.18),
                fontWeight: 700,
                lineHeight: 1,
                color: 'var(--t4-bid-gold, #D4AF37)',
                opacity: 0.12,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              {dorsalText}
            </div>
          )}

          <div
            style={{
              padding: `${FS_CARD_T4_PANEL_PADDING}px ${FS_CARD_T4_PANEL_PADDING}px 0 ${FS_CARD_T4_PANEL_LEFT_INSET}px`,
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontFamily: NAME_FONT,
                fontSize: nameFontSize,
                fontWeight: 700,
                lineHeight: 1.02,
                textTransform: 'uppercase',
                color: 'var(--t4-name-gold, #F0D878)',
                marginBottom: 16,
                wordBreak: 'break-word',
                textShadow: '0 2px 12px rgba(0,0,0,0.55)',
              }}
            >
              {currentPlayer.name}
            </div>

            <div style={{ marginBottom: 20, minHeight: 38 }}>
              {!showSoldOverlay && !showUnsoldOverlay && (
                <PlayerCardLoopSectionT4
                  items={loopItems}
                  active={loopActive}
                  reducedMotion={reducedMotion}
                  fontSize={28}
                />
              )}
            </div>

            <div
              style={{
                height: 2,
                background:
                  'linear-gradient(90deg, rgba(212,175,55,0.65), transparent)',
                marginBottom: 24,
              }}
            />

            {showSoldOverlay ? (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  paddingBottom: FS_CARD_T4_PANEL_PADDING,
                }}
              >
                <SoldDetailsSectionT4
                  soldTeam={soldTeam}
                  soldPrice={soldPrice}
                  reducedMotion={reducedMotion}
                />
              </div>
            ) : showUnsoldOverlay ? (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  paddingBottom: FS_CARD_T4_PANEL_PADDING,
                }}
              >
                <UnsoldDetailsSectionT4
                  currentPlayer={currentPlayer}
                  tournament={tournament}
                  reducedMotion={reducedMotion}
                />
              </div>
            ) : (
              <>
                {profileFields.length > 0 && (
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
                        <span
                          style={{
                            fontFamily: LABEL_FONT,
                            fontSize: 26,
                            fontWeight: 600,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.45)',
                          }}
                        >
                          {field.label}
                        </span>
                        <span
                          style={{
                            fontFamily: LABEL_FONT,
                            fontSize: Math.max(34, Math.round(statSlotH * 0.45)),
                            fontWeight: 700,
                            color: field.color ?? '#fff',
                            textAlign: 'right',
                          }}
                        >
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: 24,
                    paddingBottom: FS_CARD_T4_PANEL_PADDING,
                  }}
                >
                  <CurrentBidPanelT4
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
              </>
            )}
          </div>
        </div>

        {showSoldOverlay && !reducedMotion && (
          <div
            className="t4fs-sold-flash"
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 11,
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(110,196,154,0.35) 0%, transparent 70%)',
            }}
          />
        )}

        {showUnsoldOverlay && !reducedMotion && (
          <div
            className="t4fs-unsold-flash"
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 11,
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(232,90,90,0.4) 0%, transparent 70%)',
            }}
          />
        )}
      </div>
    </>
  );
}

export default FullScreenPlayerCardT4;
