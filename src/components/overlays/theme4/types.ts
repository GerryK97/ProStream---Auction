import type { OverlaySettings } from '../OverlayWrapper';
import type { AuctionState, Player, Team, Tournament } from '@/types';
import type { WheelSpinEvent } from '@/types/pusher-events';

/** Shared props for Theme 4 overlay orchestrators. */
export interface Theme4ContentProps {
  soldPlayers: Player[];
  teams: Team[];
  players: Player[];
  currentPlayer: Player | undefined;
  tournament: Tournament | null;
  auctionState: AuctionState;
  overlaySettings: OverlaySettings;
  wheelSpinData: WheelSpinEvent | null;
}
