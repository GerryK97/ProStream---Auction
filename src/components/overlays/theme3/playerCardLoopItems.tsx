'use client';

import React, { useEffect, useState } from 'react';
import type { Player, Tournament } from '@/types';
import { getClassConfig } from '@/lib/playerClassUtils';
import {
  FS_CARD_LOOP_FADE_MS,
  FS_CARD_LOOP_INTERVAL_MS,
} from './fullScreenPlayerCardT3Layout';

const DISPLAY_FONT = 'var(--t3-font-display, "Saira Extra Condensed", sans-serif)';

export interface PlayerCardLoopItem {
  label: string;
  color?: string;
}

export function buildPlayerCardLoopItems(
  player: Player,
  tournament: Tournament | null,
): PlayerCardLoopItem[] {
  const items: PlayerCardLoopItem[] = [];

  if (player.playerClass) {
    const cfg = getClassConfig(tournament, player.playerClass);
    items.push({
      label: `CLASS · ${player.playerClass.toUpperCase()}`,
      color: cfg?.color,
    });
  }
  if (player.position) {
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

export function PlayerCardLoopSection({
  items,
  active,
  reducedMotion,
  fontSize = 20,
}: {
  items: PlayerCardLoopItem[];
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

    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex(i => (i + 1) % items.length);
        setFading(false);
      }, FS_CARD_LOOP_FADE_MS);
    }, FS_CARD_LOOP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [active, items.length, reducedMotion]);

  const item = items[index] ?? items[0];

  return (
    <span
      style={{
        fontFamily: DISPLAY_FONT,
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: item.color ?? 'var(--t3-text-secondary)',
        opacity: fading ? 0 : 1,
        transition: reducedMotion ? 'none' : `opacity ${FS_CARD_LOOP_FADE_MS}ms ease`,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        display: 'block',
      }}
    >
      {item.label}
    </span>
  );
}
