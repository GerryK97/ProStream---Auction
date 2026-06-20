'use client';

import OverlayWrapper from './OverlayWrapper';
import CustomT2Content from './theme2/CustomT2Content';
import CustomT3Content from './theme3/CustomT3Content';
import { CustomT1Content } from './theme1/CustomT1Content';
import { resolveOverlayThemeContent } from '@/lib/overlays/resolveOverlayThemeContent';

export default function CustomOverlay({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent">
      <OverlayWrapper tournamentId={tournamentId} overlayType="custom">
        {(data) =>
          resolveOverlayThemeContent(
            data.tournament?.overlayTheme,
            <CustomT1Content
              soldPlayers={data.soldPlayers}
              teams={data.teams}
              players={data.players}
              currentPlayer={data.currentPlayer}
              tournament={data.tournament}
              auctionState={data.auctionState}
              overlaySettings={data.overlaySettings}
              wheelSpinData={data.wheelSpinData}
            />,
            <CustomT2Content {...data} />,
            <CustomT3Content {...data} />,
          )
        }
      </OverlayWrapper>
    </div>
  );
}
