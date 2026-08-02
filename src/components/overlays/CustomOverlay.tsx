'use client';

import OverlayWrapper from './OverlayWrapper';
import CustomT2Content from './theme2/CustomT2Content';
import CustomT3Content from './theme3/CustomT3Content';
import CustomT4Content from './theme4/CustomT4Content';
import { CustomT1Content } from './theme1/CustomT1Content';

// ─── Public export ────────────────────────────────────────────────────────────

export default function CustomOverlay({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent">
      <OverlayWrapper tournamentId={tournamentId} overlayType="custom">
        {(data) => {
          if (data.tournament?.overlayTheme === 'theme4') {
            return <CustomT4Content {...data} />;
          }
          if (data.tournament?.overlayTheme === 'theme3') {
            return <CustomT3Content {...data} />;
          }
          if (data.tournament?.overlayTheme === 'theme2') {
            return <CustomT2Content {...data} />;
          }
          return (
            <CustomT1Content
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
