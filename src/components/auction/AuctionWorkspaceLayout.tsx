'use client';

import React from 'react';
import AuctionTabNav from './AuctionTabNav';
import type {
    AuctionLayoutMode,
    AuctionSectionVisibility,
    AuctionWorkspaceLayoutPreference,
    AuctionWorkspaceTab,
} from './types';
import { isTabLayoutMode } from './useAuctionLayoutMode';

export interface AuctionWorkspaceLayoutProps {
    layoutMode: AuctionLayoutMode;
    layoutPreference: AuctionWorkspaceLayoutPreference;
    activeTab: AuctionWorkspaceTab;
    onTabChange: (tab: AuctionWorkspaceTab) => void;
    sectionVisibility: AuctionSectionVisibility;
    classManager?: React.ReactNode;
    availablePlayers: React.ReactNode;
    auctionPanel: React.ReactNode;
    overlayPanel: React.ReactNode;
    teamsPanel: React.ReactNode;
    resultsPanel: React.ReactNode;
    errorOverlay?: React.ReactNode;
}

function DashboardLayout({
    sectionVisibility,
    classManager,
    availablePlayers,
    auctionPanel,
    overlayPanel,
    teamsPanel,
    resultsPanel,
    errorOverlay,
}: Pick<
    AuctionWorkspaceLayoutProps,
    | 'sectionVisibility'
    | 'classManager'
    | 'availablePlayers'
    | 'auctionPanel'
    | 'overlayPanel'
    | 'teamsPanel'
    | 'resultsPanel'
    | 'errorOverlay'
>) {
    const showLeft = sectionVisibility.availablePlayers;
    const showCenter = sectionVisibility.auctionPanel;
    const showRight = sectionVisibility.teams || sectionVisibility.results;
    const allHidden = !showLeft && !showCenter && !showRight;

    return (
        <div className="flex flex-col xl:flex-row gap-3 xl:gap-4 relative min-w-0">
            {showLeft && (
                <div className="xl:w-[22%] xl:shrink-0 flex flex-col gap-3 min-w-0">
                    {classManager}
                    {availablePlayers}
                </div>
            )}
            {showCenter && (
                <div className="xl:flex-1 flex flex-col gap-3 min-w-0">
                    {auctionPanel}
                    {overlayPanel}
                </div>
            )}
            {showRight && (
                <div className="xl:w-[22%] xl:shrink-0 flex flex-col gap-3 min-w-0">
                    {sectionVisibility.teams && teamsPanel}
                    {sectionVisibility.results && resultsPanel}
                </div>
            )}
            {allHidden && (
                <div
                    className="rounded-lg border border-[var(--border-primary)] p-8 text-center w-full"
                    style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-tertiary)' }}
                >
                    <p className="text-sm">All panels are hidden. Use the panel toggles in the header to show a section.</p>
                </div>
            )}
            {errorOverlay}
        </div>
    );
}

export default function AuctionWorkspaceLayout({
    layoutMode,
    layoutPreference,
    activeTab,
    onTabChange,
    sectionVisibility,
    classManager,
    availablePlayers,
    auctionPanel,
    overlayPanel,
    teamsPanel,
    resultsPanel,
    errorOverlay,
}: AuctionWorkspaceLayoutProps) {
    const useTabs = isTabLayoutMode(layoutMode) && layoutPreference === 'tabs';

    if (!useTabs) {
        return (
            <DashboardLayout
                sectionVisibility={sectionVisibility}
                classManager={classManager}
                availablePlayers={availablePlayers}
                auctionPanel={auctionPanel}
                overlayPanel={overlayPanel}
                teamsPanel={teamsPanel}
                resultsPanel={resultsPanel}
                errorOverlay={errorOverlay}
            />
        );
    }

    return (
        <div className="flex flex-col gap-3 min-w-0 relative">
            <AuctionTabNav activeTab={activeTab} onTabChange={onTabChange} variant="horizontal" />

            <div className="min-w-0" role="tabpanel">
                {activeTab === 'auction' && (
                    <div className="flex flex-col gap-3 min-w-0">
                        {auctionPanel}
                        {overlayPanel}
                    </div>
                )}
                {activeTab === 'available' && (
                    <div className="min-w-0">{availablePlayers}</div>
                )}
                {activeTab === 'teams' && (
                    <div className="min-w-0">{teamsPanel}</div>
                )}
                {activeTab === 'results' && (
                    <div className="min-w-0">{resultsPanel}</div>
                )}
            </div>

            {errorOverlay}
        </div>
    );
}
