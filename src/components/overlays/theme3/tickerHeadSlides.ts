import type { Tournament } from '@/types';

export type TickerHeadSlide =
  | { type: 'text'; id: string; label: string }
  | { type: 'logo'; id: string; src: string; kind: 'tournament' | 'streamer' };

export function buildTickerHeadSlides(
  modeLabel: string,
  tournament: Tournament | null,
): TickerHeadSlide[] {
  const slides: TickerHeadSlide[] = [];

  slides.push({ type: 'text', id: 'mode', label: modeLabel });

  const tournamentName = tournament?.name?.trim().toUpperCase();
  if (tournamentName && tournamentName !== modeLabel.trim().toUpperCase()) {
    slides.push({ type: 'text', id: 'tournament-name', label: tournamentName });
  }

  if (tournament?.logoURL?.trim()) {
    slides.push({
      type: 'logo',
      id: 'tournament-logo',
      src: tournament.logoURL.trim(),
      kind: 'tournament',
    });
  }

  if (tournament?.wheelCenterImageURL?.trim()) {
    slides.push({
      type: 'logo',
      id: 'streamer-logo',
      src: tournament.wheelCenterImageURL.trim(),
      kind: 'streamer',
    });
  }

  return slides;
}
