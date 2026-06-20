'use client';

import OverlayWrapper from './OverlayWrapper';
import FullScreenT2Content from './theme2/FullScreenT2Content';
import FullScreenT3Content from './theme3/FullScreenT3Content';
import { FullScreenT1Content } from './theme1/FullScreenT1Content';

// ─── Public export ────────────────────────────────────────────────────────────

export default function FullScreenOverlay({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: 'var(--overlay-bg-fullscreen)' }}>
      <OverlayWrapper tournamentId={tournamentId} overlayType="fullscreen">
        {(data) => {
          if (data.tournament?.overlayTheme === 'theme3') {
            return <FullScreenT3Content {...data} />;
          }
          if (data.tournament?.overlayTheme === 'theme2') {
            return <FullScreenT2Content {...data} />;
          }
          return (
            <FullScreenT1Content
              soldPlayers={data.soldPlayers}
              teams={data.teams}
              players={data.players}
              currentPlayer={data.currentPlayer}
              tournament={data.tournament}
              auctionState={data.auctionState}
              overlaySettings={data.overlaySettings}
              wheelSpinData={data.wheelSpinData}
            />
          );
        }}
      </OverlayWrapper>
    </div>
  );
}
