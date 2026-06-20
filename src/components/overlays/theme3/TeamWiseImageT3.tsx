'use client';

import React from 'react';
import { Player, Team, Tournament } from '@/types';
import { Theme3Placeholder } from './Theme3Placeholder';

interface Props {
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  teamId: string;
  isExiting?: boolean;
}

const TeamWiseImageT3: React.FC<Props> = () => (
  <Theme3Placeholder name="TeamWiseImageT3" />
);

export default TeamWiseImageT3;
