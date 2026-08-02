'use client';

import React, { useEffect, useState } from 'react';
import type { Player, Tournament } from '@/types';
import { getClassConfig } from '@/lib/playerClassUtils';
import {
  FS_CARD_T4_LOOP_FADE_MS,
  FS_CARD_T4_LOOP_INTERVAL_MS,
} from './fullScreenPlayerCardT4Layout';

const LABEL_FONT = 'var(--t4-font-label, "Oswald", "Arial Narrow", sans-serif)';

export interface PlayerCardLoopItemT4 {
  label: string;
  color?: string;
}

export function buildPlayerCardLoopItemsT4(
  player: Player,
  tournament: Tournament | null,
  options?: { includePosition?: boolean },
): PlayerCardLoopItemT4[] {
  const includePosition = options?.includePosition !== false;
  const items: PlayerCardLoopItemT4[] = [];

  if (player.playerClass) {
    const cfg = getClassConfig(tournament, player.playerClass);
    items.push({
      label: `CLASS · ${player.playerClass.toUpperCase()}`,
      color: cfg?.color,
    });
  }
  if (includePosition && player.position) {
    items.push({ label: `POSITION · ${player.position.toUpperCase()}` });
  }

  const statFields = tournament?.playerProfileFields?.statFields ?? [];
  for (const sf of statFields.slice(0, 2)) {
    const val = player.stats?.[sf.key];
    if (val != null && String(val).trim() !== '') {
      items.push({ label: `${sf.label.toUpperCase()} · ${String(val).toUpperCase()}` });
    }
  }

  if (items.length === 0) {
    items.push({
      label: tournament?.name?.toUpperCase() ?? 'LIVE AUCTION',
    });
  }

  return items;
}

export function PlayerCardLoopSectionT4({
  items,
  active,
  reducedMotion,
  fontSize = 20,
}: {
  items: PlayerCardLoopItemT4[];
  active: boolean;
  reducedMotion: boolean;
  fontSize?: number;
}) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [items]);

  useEffect(() => {
    if (!active || items.length <= 1 || reducedMotion) return;

    let fadeT: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setFading(true);
      fadeT = setTimeout(() => {
        setIndex(i => (i + 1) % items.length);
        setFading(false);
      }, FS_CARD_T4_LOOP_FADE_MS);
    }, FS_CARD_T4_LOOP_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (fadeT) clearTimeout(fadeT);
    };
  }, [active, items.length, reducedMotion]);

  const item = items[index] ?? items[0];
  if (!item) return null;

  return (
    <div
      style={{
        fontFamily: LABEL_FONT,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: item.color ?? 'rgba(240,216,120,0.85)',
        opacity: fading ? 0 : 1,
        transition: `opacity ${FS_CARD_T4_LOOP_FADE_MS}ms ease`,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {item.label}
    </div>
  );
}
