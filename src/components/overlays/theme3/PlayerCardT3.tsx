'use client';

import React, { useEffect, useState } from 'react';
import type { Player, Tournament } from '@/types';
import { getClassConfig } from '@/lib/playerClassUtils';
import { optimizeImage } from '@/lib/imageOptimization';
import {
  PLAYER_BAR_T3_PHOTO_HEIGHT,
  PLAYER_BAR_T3_PHOTO_WIDTH,
} from './theme3Layout';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';

function resolvePlayerPhotoSrc(
  player: Player,
  width: number,
  height: number,
): string | null {
  const raw =
    player.photoURL?.trim() ||
    player.secondaryImageURL?.trim() ||
    '';
  if (!raw) return null;
  if (raw.startsWith('data:')) return raw;
  return optimizeImage(raw, {
    width: width * 2,
    height: height * 2,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

interface PhotoProps {
  player: Player;
  soldCelebration?: boolean;
  /** @deprecated Prefer photoHeight — kept for callers that still pass bar height. */
  barHeight?: number;
  photoWidth?: number;
  photoHeight?: number;
}

export function PlayerPhotoSection({
  player,
  soldCelebration,
  barHeight,
  photoWidth = PLAYER_BAR_T3_PHOTO_WIDTH,
  photoHeight,
}: PhotoProps) {
  const height = photoHeight ?? barHeight ?? PLAYER_BAR_T3_PHOTO_HEIGHT;
  const [imageFailed, setImageFailed] = useState(false);
  const photoSrc = resolvePlayerPhotoSrc(player, photoWidth, height);

  useEffect(() => {
    setImageFailed(false);
  }, [player._id, player.photoURL, player.secondaryImageURL]);

  const initials = player.name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const showImage = !!photoSrc && !imageFailed;

  return (
    <div
      style={{
        width: photoWidth,
        height,
        flexShrink: 0,
        overflow: 'hidden',
        background: 'var(--t3-bar-bg-dark, var(--t3-bg-panel))',
        borderRight: '1px solid var(--t3-bar-gold, var(--t3-accent))',
        boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
        animation: soldCelebration ? 't3SoldCelebration 0.6s ease-out' : undefined,
        position: 'relative',
        zIndex: 2,
      }}
    >
      {showImage ? (
        <img
          src={photoSrc}
          alt=""
          referrerPolicy="no-referrer"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
          }}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: DISPLAY_FONT,
            fontSize: 42,
            fontWeight: 700,
            color: 'var(--t3-bar-gold, var(--t3-accent))',
          }}
        >
          {initials || '?'}
        </div>
      )}
    </div>
  );
}

interface IdentityProps {
  player: Player;
  tournament: Tournament | null;
  /** Stretch to fill available row width (small player bar). */
  expand?: boolean;
}

export function PlayerIdentitySection({ player, tournament, expand = false }: IdentityProps) {
  const classConfig = getClassConfig(tournament, player.playerClass);
  const playerNo = player.playerNo?.trim();
  const metaParts: string[] = [];
  if (player.playerClass) metaParts.push(player.playerClass.toUpperCase());
  if (player.position) metaParts.push(player.position.toUpperCase());

  const noSize = expand ? 72 : 52;
  const nameSize = expand ? 58 : 38;
  const metaSize = expand ? 24 : 18;

  return (
    <div
      style={{
        minWidth: 0,
        flex: expand ? '1 1 auto' : '0 1 340px',
        maxWidth: expand ? 'none' : 340,
        width: expand ? '100%' : undefined,
        height: expand ? '100%' : undefined,
        paddingRight: expand ? 20 : 12,
        paddingTop: expand ? 10 : 0,
        paddingBottom: expand ? 8 : 0,
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: expand ? 'flex-end' : undefined,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: expand ? 14 : 12,
          minWidth: 0,
          width: '100%',
          flex: expand ? 1 : undefined,
          minHeight: expand ? 0 : undefined,
        }}
      >
        {playerNo && (
          <span
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: noSize,
              fontWeight: 700,
              lineHeight: 0.85,
              color: 'var(--t3-bar-gold, var(--t3-accent))',
              flexShrink: 0,
              textShadow: '0 2px 8px rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'flex-end',
              height: expand ? '100%' : undefined,
            }}
          >
            {playerNo}
          </span>
        )}
        <div
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: nameSize,
            fontWeight: 700,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: 'var(--t3-bar-text, var(--t3-text-primary))',
            lineHeight: 0.85,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            minWidth: 0,
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            height: expand ? '100%' : undefined,
          }}
        >
          {player.name}
        </div>
      </div>
      {metaParts.length > 0 && (
        <div
          style={{
            marginTop: expand ? 4 : 6,
            flexShrink: 0,
            fontFamily: DISPLAY_FONT,
            fontSize: metaSize,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: classConfig?.color ?? 'var(--t3-bar-text-muted, var(--t3-text-secondary))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
            lineHeight: 1,
          }}
        >
          {metaParts.join(' · ')}
        </div>
      )}
    </div>
  );
}

export { PLAYER_BAR_T3_PHOTO_WIDTH as PHOTO_SIZE };

const PlayerCardT3: React.FC<{ player: Player; tournament: Tournament | null }> = ({
  player,
  tournament,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <PlayerPhotoSection player={player} />
    <PlayerIdentitySection player={player} tournament={tournament} />
  </div>
);

export default PlayerCardT3;
