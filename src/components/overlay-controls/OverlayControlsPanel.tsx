'use client';

import React, { useState } from 'react';
import DisplayModeTabs from './DisplayModeTabs';
import PlayerCardGroup from './PlayerCardGroup';
import TeamCardsGroup from './TeamCardsGroup';
import TickerGroup from './TickerGroup';
import PositioningDisclosure from './PositioningDisclosure';
import CustomTickerModal from './CustomTickerModal';
import type { OverlayControlsProps } from './types';

export default function OverlayControlsPanel(props: OverlayControlsProps) {
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [showTickerModal, setShowTickerModal] = useState(false);

    const {
        displayMode, setDisplayMode,
        overlaySize, setOverlaySize,
        hidePremiumCard, setHidePremiumCard,
        autoSwitch, setAutoSwitch,
        autoSwitchDuration, setAutoSwitchDuration,
        autoSwitchTimerRef,
        hideTeamCards, setHideTeamCards, hideTeamCardsRef,
        teamCardSize, setTeamCardSize, teamCardSizeRef,
        teamCardPosition, setTeamCardPosition, teamCardPositionRef,
        tickerMode, setTickerMode,
        hideTickerCustom, setHideTickerCustom, hideTickerCustomRef,
        hideTickerFullscreen, setHideTickerFullscreen, hideTickerFullscreenRef,
        customTickerLine1, setCustomTickerLine1,
        customTickerLine2, setCustomTickerLine2,
        teamWiseTeamId, setTeamWiseTeamId, teamWiseTeamIdRef,
        teams,
        soldMessagePosition, setSoldMessagePosition, soldMessagePositionRef,
        bidCardTop, setBidCardTop,
        bidCardLeft, setBidCardLeft,
        sendOverlaySettings,
    } = props;

    const isStandard = displayMode === 'standard';

    return (
        <div
            className="rounded-lg p-5 border flex-1 min-h-0"
            style={{
                backgroundColor: 'var(--surface-secondary)',
                borderColor: 'var(--border-primary)',
            }}
        >
            <h3 className="font-bold text-sm uppercase tracking-widest mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Overlay Controls
            </h3>

            <DisplayModeTabs
                displayMode={displayMode}
                setDisplayMode={setDisplayMode}
                overlaySize={overlaySize}
                tickerMode={tickerMode}
                sendOverlaySettings={sendOverlaySettings}
                teamWiseTeamId={teamWiseTeamId}
                setTeamWiseTeamId={setTeamWiseTeamId}
                teamWiseTeamIdRef={teamWiseTeamIdRef}
                teams={teams}
                onOpenCustomTickerModal={() => setShowTickerModal(true)}
            />

            <div
                className="transition-all duration-200"
                aria-disabled={!isStandard}
                style={{
                    filter: isStandard ? 'none' : 'blur(1.5px)',
                    opacity: isStandard ? 1 : 0.55,
                    pointerEvents: isStandard ? 'auto' : 'none',
                }}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <PlayerCardGroup
                        overlaySize={overlaySize}
                        setOverlaySize={setOverlaySize}
                        hidePremiumCard={hidePremiumCard}
                        setHidePremiumCard={setHidePremiumCard}
                        autoSwitch={autoSwitch}
                        setAutoSwitch={setAutoSwitch}
                        autoSwitchDuration={autoSwitchDuration}
                        setAutoSwitchDuration={setAutoSwitchDuration}
                        autoSwitchTimerRef={autoSwitchTimerRef}
                        tickerMode={tickerMode}
                        displayMode={displayMode}
                        sendOverlaySettings={sendOverlaySettings}
                    />
                    <TeamCardsGroup
                        hideTeamCards={hideTeamCards}
                        setHideTeamCards={setHideTeamCards}
                        hideTeamCardsRef={hideTeamCardsRef}
                        teamCardSize={teamCardSize}
                        setTeamCardSize={setTeamCardSize}
                        teamCardSizeRef={teamCardSizeRef}
                        teamCardPosition={teamCardPosition}
                        setTeamCardPosition={setTeamCardPosition}
                        teamCardPositionRef={teamCardPositionRef}
                        overlaySize={overlaySize}
                        tickerMode={tickerMode}
                        sendOverlaySettings={sendOverlaySettings}
                    />
                </div>
                <div className="mt-4">
                    <TickerGroup
                        tickerMode={tickerMode}
                        setTickerMode={setTickerMode}
                        hideTickerCustom={hideTickerCustom}
                        setHideTickerCustom={setHideTickerCustom}
                        hideTickerCustomRef={hideTickerCustomRef}
                        hideTickerFullscreen={hideTickerFullscreen}
                        setHideTickerFullscreen={setHideTickerFullscreen}
                        hideTickerFullscreenRef={hideTickerFullscreenRef}
                        overlaySize={overlaySize}
                        sendOverlaySettings={sendOverlaySettings}
                    />
                </div>
            </div>

            <PositioningDisclosure
                open={advancedOpen}
                onToggle={() => setAdvancedOpen(v => !v)}
                soldMessagePosition={soldMessagePosition}
                setSoldMessagePosition={setSoldMessagePosition}
                soldMessagePositionRef={soldMessagePositionRef}
                bidCardTop={bidCardTop}
                setBidCardTop={setBidCardTop}
                bidCardLeft={bidCardLeft}
                setBidCardLeft={setBidCardLeft}
                overlaySize={overlaySize}
                tickerMode={tickerMode}
                displayMode={displayMode}
                hidePremiumCard={hidePremiumCard}
                customTickerLine1={customTickerLine1}
                customTickerLine2={customTickerLine2}
                sendOverlaySettings={sendOverlaySettings}
            />

            <CustomTickerModal
                open={showTickerModal}
                onClose={() => setShowTickerModal(false)}
                customTickerLine1={customTickerLine1}
                setCustomTickerLine1={setCustomTickerLine1}
                customTickerLine2={customTickerLine2}
                setCustomTickerLine2={setCustomTickerLine2}
                overlaySize={overlaySize}
                tickerMode={tickerMode}
                displayMode={displayMode}
                hidePremiumCard={hidePremiumCard}
                sendOverlaySettings={sendOverlaySettings}
            />
        </div>
    );
}
