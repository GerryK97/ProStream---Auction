'use client';

import React, { useEffect, useState } from 'react';
import type { Player, Tournament } from '@/types';
import { getClassConfig } from '@/lib/playerClassUtils';
import { optimizeImage } from '@/lib/imageOptimization';
import { PLAYER_BAR_T3_HEIGHT, PLAYER_BAR_T3_PHOTO_WIDTH } from './theme3Layout';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';

function resolvePlayerPhotoSrc(
  player: Player,
): string | null {
  const raw =
    player.photoURL?.trim() ||
    player.secondaryImageURL?.trim() ||
    '';
  if (!raw) return null;
  if (raw.startsWith('data:')) return raw;
  return optimizeImage(raw, {
    width: PLAYER_BAR_T3_PHOTO_WIDTH * 2,
    height: PLAYER_BAR_T3_HEIGHT * 2,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

interface PhotoProps {
  player: Player;
  soldCelebration?: boolean;
  barHeight?: number;
}

export function PlayerPhotoSection({
  player,
  soldCelebration,
  barHeight = PLAYER_BAR_T3_HEIGHT,
}: PhotoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const photoSrc = resolvePlayerPhotoSrc(player);

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
        width: PLAYER_BAR_T3_PHOTO_WIDTH,
        height: barHeight,
        flexShrink: 0,
        overflow: 'hidden',
        background: 'var(--t3-bar-bg-dark, var(--t3-bg-panel))',
        borderRight: '1px solid var(--t3-bar-gold, var(--t3-accent))',
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
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
            fontSize: 36,
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
}

export function PlayerIdentitySection({ player, tournament }: IdentityProps) {
  const classConfig = getClassConfig(tournament, player.playerClass);
  const playerNo = player.playerNo?.trim();
  const metaParts: string[] = [];
  if (player.playerClass) metaParts.push(player.playerClass.toUpperCase());
  if (player.position) metaParts.push(player.position.toUpperCase());

  return (
    <div style={{ minWidth: 0, flex: '0 1 340px', maxWidth: 340, paddingRight: 12, position: 'relative', zIndex: 2 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, minWidth: 0 }}>
        {playerNo && (
          <span
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 0.85,
              color: 'var(--t3-bar-gold, var(--t3-accent))',
              flexShrink: 0,
              textShadow: '0 2px 8px rgba(0,0,0,0.45)',
            }}
          >
            {playerNo}
          </span>
        )}
        <div
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 38,
            fontWeight: 700,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: 'var(--t3-bar-text, var(--t3-text-primary))',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            minWidth: 0,
            flex: 1,
          }}
        >
          {player.name}
        </div>
      </div>
      {metaParts.length > 0 && (
        <div
          style={{
            marginTop: 6,
            fontFamily: DISPLAY_FONT,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: classConfig?.color ?? 'var(--t3-bar-text-muted, var(--t3-text-secondary))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
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
