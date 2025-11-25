'use client';

import React from 'react';
import { TeamCardsOverlayBaseProps } from './teamCards/shared';
import TeamCardsOverlayNeon from './teamCards/TeamCardsOverlayNeon';
import TeamCardsOverlayEmber from './teamCards/TeamCardsOverlayEmber';
import TeamCardsOverlayMidnight from './teamCards/TeamCardsOverlayMidnight';

export type TeamCardsOverlayVariant = 'neon' | 'ember' | 'midnight';

export interface TeamCardsOverlayProps extends TeamCardsOverlayBaseProps {
    variant?: TeamCardsOverlayVariant;
}

const variantComponentMap: Record<TeamCardsOverlayVariant, React.FC<TeamCardsOverlayBaseProps>> = {
    neon: TeamCardsOverlayNeon,
    ember: TeamCardsOverlayEmber,
    midnight: TeamCardsOverlayMidnight
};

const TeamCardsOverlay: React.FC<TeamCardsOverlayProps> = ({ variant = 'neon', ...rest }) => {
    const Component = variantComponentMap[variant] ?? TeamCardsOverlayNeon;
    return <Component {...rest} />;
};

export default TeamCardsOverlay;

