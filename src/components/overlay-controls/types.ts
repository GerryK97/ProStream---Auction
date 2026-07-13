import type { Dispatch, SetStateAction, MutableRefObject } from 'react';

export type OverlayThemeId = 'standard' | 'premium' | 'neon' | 'theme2' | 'theme3';

export type OverlaySize = 'large' | 'small';
export type TickerMode = 'all' | 'sold' | 'available';
export type DisplayMode =
    | 'standard'
    | 'sold-summary'
    | 'team-summary'
    | 'team-wise-summary'
    | 'team-wise-image'
    | 'resting'
    | 'top10-summary'
    | 'custom-ticker'
    | 'wheel-spin';
export type TeamCardSize = 'small' | 'medium' | 'large';
export type TeamCardPosition = 'top-right' | 'bottom-right';
export type BidCardPosition = 'top' | 'right' | 'left';
export type SoldMessagePosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export type SendOverlaySettings = (
    size: OverlaySize,
    mode: TickerMode,
    dm?: DisplayMode,
    hideCard?: boolean,
    line1?: string,
    line2?: string,
    soldMsgPos?: SoldMessagePosition,
) => Promise<void> | void;

export interface TeamOption {
    _id: string;
    name: string;
}

export interface OverlayControlsProps {
    // Display mode
    displayMode: DisplayMode;
    setDisplayMode: Dispatch<SetStateAction<DisplayMode>>;
    overlayTheme?: OverlayThemeId;

    // Player card
    overlaySize: OverlaySize;
    setOverlaySize: Dispatch<SetStateAction<OverlaySize>>;
    hidePremiumCard: boolean;
    setHidePremiumCard: Dispatch<SetStateAction<boolean>>;
    autoSwitch: boolean;
    setAutoSwitch: Dispatch<SetStateAction<boolean>>;
    autoSwitchDuration: number;
    setAutoSwitchDuration: Dispatch<SetStateAction<number>>;
    autoSwitchTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;

    // Team cards
    hideTeamCards: boolean;
    setHideTeamCards: Dispatch<SetStateAction<boolean>>;
    hideTeamCardsRef: MutableRefObject<boolean>;
    teamCardSize: TeamCardSize;
    setTeamCardSize: Dispatch<SetStateAction<TeamCardSize>>;
    teamCardSizeRef: MutableRefObject<TeamCardSize>;
    teamCardPosition: TeamCardPosition;
    setTeamCardPosition: Dispatch<SetStateAction<TeamCardPosition>>;
    teamCardPositionRef: MutableRefObject<TeamCardPosition>;

    // Ticker
    tickerMode: TickerMode;
    setTickerMode: Dispatch<SetStateAction<TickerMode>>;
    hideTickerCustom: boolean;
    setHideTickerCustom: Dispatch<SetStateAction<boolean>>;
    hideTickerCustomRef: MutableRefObject<boolean>;
    hideTickerFullscreen: boolean;
    setHideTickerFullscreen: Dispatch<SetStateAction<boolean>>;
    hideTickerFullscreenRef: MutableRefObject<boolean>;

    // Custom ticker
    customTickerLine1: string;
    setCustomTickerLine1: Dispatch<SetStateAction<string>>;
    customTickerLine2: string;
    setCustomTickerLine2: Dispatch<SetStateAction<string>>;

    // Team-wise
    teamWiseTeamId: string | null;
    setTeamWiseTeamId: Dispatch<SetStateAction<string | null>>;
    teamWiseTeamIdRef: MutableRefObject<string | null>;
    teams: TeamOption[];

    // Bid card position
    bidCardPosition: BidCardPosition;
    setBidCardPosition: Dispatch<SetStateAction<BidCardPosition>>;
    bidCardPositionRef: MutableRefObject<BidCardPosition>;

    // Positioning
    soldMessagePosition: SoldMessagePosition;
    setSoldMessagePosition: Dispatch<SetStateAction<SoldMessagePosition>>;
    soldMessagePositionRef: MutableRefObject<SoldMessagePosition>;
    bidCardTop: number;
    setBidCardTop: Dispatch<SetStateAction<number>>;
    bidCardTopRef: MutableRefObject<number>;
    bidCardLeft: number;
    setBidCardLeft: Dispatch<SetStateAction<number>>;
    bidCardLeftRef: MutableRefObject<number>;

    // Network sync
    sendOverlaySettings: SendOverlaySettings;
}
