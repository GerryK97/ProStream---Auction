'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OverlayWrapper from '@/components/overlays/OverlayWrapper';
import PremiumPlayerCardOverlay from '@/components/overlays/PremiumPlayerCardOverlay';

function PremiumPlayerCardContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament') || undefined;

    // Extract all parameters with proper type conversion and defaults

    // Position
    const position = (searchParams.get('position') as 'center' | 'left' | 'right') || 'center';

    // Visibility parameters
    const showPlayerImage = searchParams.get('showPlayerImage') !== 'false';
    const showBackgroundText = searchParams.get('showBackgroundText') !== 'false';
    const showJerseyNumber = searchParams.get('showJerseyNumber') !== 'false';
    const showDecorativeBadges = searchParams.get('showDecorativeBadges') !== 'false';
    const showPlayerName = searchParams.get('showPlayerName') !== 'false';
    const showRoleLabel = searchParams.get('showRoleLabel') !== 'false';
    const showStatsSection = searchParams.get('showStatsSection') !== 'false';
    const showMatches = searchParams.get('showMatches') !== 'false';
    const showScore = searchParams.get('showScore') !== 'false';
    const showWickets = searchParams.get('showWickets') !== 'false';

    // Color parameters
    const gradientStart = searchParams.get('gradientStart') || '#ff5411';
    const gradientEnd = searchParams.get('gradientEnd') || '#ffcc00';
    const cardBackground = searchParams.get('cardBackground') || '#ffffff';
    const playerNameColor = searchParams.get('playerNameColor') || '#1e293b';
    const statValueColor = searchParams.get('statValueColor') || '#1e293b';
    const statLabelColor = searchParams.get('statLabelColor') || '#9ca3af';
    const jerseyBadgeGradientStart = searchParams.get('jerseyBadgeGradientStart') || '#ff5411';
    const jerseyBadgeGradientEnd = searchParams.get('jerseyBadgeGradientEnd') || '#ffcc00';
    const decorativeBadgeColor = searchParams.get('decorativeBadgeColor') || '#ffffff';
    const watermarkColor = searchParams.get('watermarkColor') || '#ffffff';

    // Layout parameters
    const cardSize = (searchParams.get('cardSize') as 'small' | 'medium' | 'large') || 'medium';
    const borderRadius = (searchParams.get('borderRadius') as 'none' | 'small' | 'medium' | 'large') || 'large';
    const opacity = parseInt(searchParams.get('opacity') || '100');

    // Content parameters
    const roleLabel = searchParams.get('roleLabel') || 'Player';
    const usePlayerNameAsWatermark = searchParams.get('usePlayerNameAsWatermark') !== 'false';
    const backgroundTextLine1 = searchParams.get('backgroundTextLine1') || '';
    const backgroundTextLine2 = searchParams.get('backgroundTextLine2') || '';

    return (
        <OverlayWrapper tournamentId={tournamentId}>
            {({ tournament, currentPlayer, teams }) => (
                <PremiumPlayerCardOverlay
                    currentPlayer={currentPlayer}
                    tournament={tournament}
                    teams={teams}
                    position={position}
                    // Visibility
                    showPlayerImage={showPlayerImage}
                    showBackgroundText={showBackgroundText}
                    showJerseyNumber={showJerseyNumber}
                    showDecorativeBadges={showDecorativeBadges}
                    showPlayerName={showPlayerName}
                    showRoleLabel={showRoleLabel}
                    showStatsSection={showStatsSection}
                    showMatches={showMatches}
                    showScore={showScore}
                    showWickets={showWickets}
                    // Colors
                    gradientStart={gradientStart}
                    gradientEnd={gradientEnd}
                    cardBackground={cardBackground}
                    playerNameColor={playerNameColor}
                    statValueColor={statValueColor}
                    statLabelColor={statLabelColor}
                    jerseyBadgeGradientStart={jerseyBadgeGradientStart}
                    jerseyBadgeGradientEnd={jerseyBadgeGradientEnd}
                    decorativeBadgeColor={decorativeBadgeColor}
                    watermarkColor={watermarkColor}
                    // Layout
                    cardSize={cardSize}
                    borderRadius={borderRadius}
                    opacity={opacity}
                    // Content
                    roleLabel={roleLabel}
                    usePlayerNameAsWatermark={usePlayerNameAsWatermark}
                    backgroundTextLine1={backgroundTextLine1}
                    backgroundTextLine2={backgroundTextLine2}
                />
            )}
        </OverlayWrapper>
    );
}

export default function PremiumPlayerCardOverlayPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PremiumPlayerCardContent />
        </Suspense>
    );
}
