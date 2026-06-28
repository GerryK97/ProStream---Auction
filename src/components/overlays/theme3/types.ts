import type { OverlaySettings } from '../OverlayWrapper';
import type { AuctionState, Player, Team, Tournament } from '@/types';
import type { WheelSpinEvent } from '@/types/pusher-events';

type DisplayMode = OverlaySettings['displayMode'];

/** Theme 3 Team Imagery panel — triggered only by Team Imagery (`team-wise-image`). */
export function isTheme3TeamImageryMode(mode: DisplayMode): boolean {
  return mode === 'team-wise-image';
}

/** Shared props for Theme 3 overlay orchestrators (fullscreen, custom, alt). */
export interface Theme3ContentProps {
  soldPlayers: Player[];
  teams: Team[];
  players: Player[];
  currentPlayer: Player | undefined;
  tournament: Tournament | null;
  auctionState: AuctionState;
  overlaySettings: OverlaySettings;
  wheelSpinData: WheelSpinEvent | null;
}
