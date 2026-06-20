'use client';

import React from 'react';
import { Tournament } from '@/types';
import { Theme3Placeholder } from './Theme3Placeholder';

interface Props {
  tournament: Tournament | null;
  overrideLabel?: string;
  size?: 'small' | 'medium' | 'large';
}

const RestingTimeT3: React.FC<Props> = () => (
  <Theme3Placeholder name="RestingTimeT3" />
);

export default RestingTimeT3;
