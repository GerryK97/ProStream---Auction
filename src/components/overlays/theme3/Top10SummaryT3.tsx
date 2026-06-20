'use client';

import React from 'react';
import { Player, Team, Tournament } from '@/types';
import { Theme3Placeholder } from './Theme3Placeholder';

interface Props {
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  isExiting?: boolean;
}

const Top10SummaryT3: React.FC<Props> = () => (
  <Theme3Placeholder name="Top10SummaryT3" />
);

export default Top10SummaryT3;
