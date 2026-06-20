export type AuctionLayoutMode = 'wide' | 'compact' | 'focused';

export type AuctionWorkspaceTab = 'auction' | 'available' | 'teams' | 'results';

export type AuctionSectionKey = 'availablePlayers' | 'auctionPanel' | 'teams' | 'results';

export interface AuctionSectionVisibility {
    availablePlayers: boolean;
    auctionPanel: boolean;
    teams: boolean;
    results: boolean;
}

export const DEFAULT_SECTION_VISIBILITY: AuctionSectionVisibility = {
    availablePlayers: true,
    auctionPanel: true,
    teams: true,
    results: true,
};

export const SECTION_TOGGLE_LABELS: Record<AuctionSectionKey, string> = {
    availablePlayers: 'Available',
    auctionPanel: 'Auction',
    teams: 'Teams',
    results: 'Results',
};

export const AUCTION_TAB_STORAGE_KEY = 'auctionWorkspaceTab';
export const AUCTION_SECTIONS_STORAGE_KEY = 'auctionSectionVisibility';
