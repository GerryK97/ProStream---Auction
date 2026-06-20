'use client';

import React from 'react';
import { Team, Tournament } from '@/types';
import { Theme3Placeholder } from './Theme3Placeholder';

interface Props {
  teams: Team[];
  tournament: Tournament | null;
  isExiting?: boolean;
}

const TeamSummaryT3: React.FC<Props> = () => (
  <Theme3Placeholder name="TeamSummaryT3" />
);

export default TeamSummaryT3;
