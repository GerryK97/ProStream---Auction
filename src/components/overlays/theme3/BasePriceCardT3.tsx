'use client';

import React from 'react';
import { Theme3Placeholder } from './Theme3Placeholder';

interface Props {
  basePrice: number;
  size?: 'small' | 'medium' | 'large';
}

const BasePriceCardT3: React.FC<Props> = () => (
  <Theme3Placeholder name="BasePriceCardT3" />
);

export default BasePriceCardT3;
