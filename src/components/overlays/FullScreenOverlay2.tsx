'use client';

import OverlayWrapper from './OverlayWrapper';
import FullScreen2T2Content from './theme2/FullScreenAltT2Content';
import FullScreenAltT3Content from './theme3/FullScreenAltT3Content';
import FullScreenAltT4Content from './theme4/FullScreenAltT4Content';
import { FullScreenAltT1Content } from './theme1/FullScreenAltT1Content';

// ─── Public export ────────────────────────────────────────────────────────────

export default function FullScreenOverlay2({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: 'var(--overlay-bg-fullscreen)' }}>
      <OverlayWrapper tournamentId={tournamentId} overlayType="fullscreen2">
        {(data) => {
          if (data.tournament?.overlayTheme === 'theme4') {
            return <FullScreenAltT4Content {...data} />;
          }
          if (data.tournament?.overlayTheme === 'theme3') {
            return <FullScreenAltT3Content {...data} />;
          }
          if (data.tournament?.overlayTheme === 'theme2') {
            return <FullScreen2T2Content {...data} />;
          }
          return (
            <FullScreenAltT1Content
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
