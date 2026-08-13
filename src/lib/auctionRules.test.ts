import { strict as assert } from 'node:assert';
import { getTeamAuctionCapacity } from './auctionRules';
import type { Team, Tournament } from '@/types';

const team = {
  currentBalance: 1_000,
  playersPurchased: ['one'],
} as Team;

const classTournament = {
  squadSize: 3,
  basePricePerPlayer: 100,
  basePriceStrategy: 'player-class-based',
  usePlayerClasses: true,
  playerClasses: [
    { code: 'A', name: 'A', basePrice: 500, color: '#000', order: 1 },
    { code: 'B', name: 'B', basePrice: 200, color: '#000', order: 2 },
  ],
} as Tournament;

assert.deepEqual(getTeamAuctionCapacity(team, classTournament), {
  remainingSlots: 2,
  maxBid: 800,
  isSquadFull: false,
});

assert.equal(getTeamAuctionCapacity(team, {
  ...classTournament,
  basePriceStrategy: 'tournament-level',
  basePricePerPlayer: 300,
} as Tournament).maxBid, 700);

assert.deepEqual(getTeamAuctionCapacity(team, classTournament, 3), {
  remainingSlots: 0,
  maxBid: 0,
  isSquadFull: true,
});

assert.equal(getTeamAuctionCapacity({ ...team, currentBalance: -10 }, classTournament).maxBid, 0);

console.log('auctionRules tests passed');
