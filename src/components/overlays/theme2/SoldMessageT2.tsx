'use client';

import React from 'react';
import { Player, Team } from '@/types';

interface Props {
  player: Player;
  team: Team;
  finalPrice: number;
  exiting: boolean;
}

const SoldMessageT2: React.FC<Props> = ({ exiting }) => (
  <>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');`}</style>
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Varela Round', sans-serif",
      background: 'rgba(0,0,0,0.35)',
      opacity: exiting ? 0 : 1,
      transition: exiting ? 'opacity 0.5s ease-out' : 'opacity 0.3s ease-in',
    }}>
    </div>
  </>
);

export default SoldMessageT2;
