// In-memory database (for development)
// Replace with actual database connection in production

import { Tournament, Team, Player } from '@/types';

// Mock data storage
let tournaments: Tournament[] = [
  { _id: 't1', name: 'LPL 2025', year: 2025, budgetPerTeam: 500000, squadSize: 5, basePricePerPlayer: 5000, logoURL: 'https://placehold.co/64x64/E01A36/FFFFFF/png?text=LPL', status: 'Completed' },
  { _id: 't2', name: 'IPL 2025', year: 2025, budgetPerTeam: 500000, squadSize: 10, basePricePerPlayer: 5000, logoURL: 'https://placehold.co/64x64/004B8D/FFFFFF/png?text=IPL', status: 'Draft' },
  { _id: 't3', name: 'ipl 2025', year: 2025, budgetPerTeam: 500000, squadSize: 4, basePricePerPlayer: 5000, logoURL: 'https://placehold.co/64x64/004B8D/FFFFFF/png?text=ipl', status: 'Draft' },
];

let teams: Team[] = [
  { _id: 'team1', tournamentId: 't1', name: 'Wariyapola', shortCode: 'WCC', ownerName: 'Masan', initialBudget: 10000000, currentBalance: 8500000, playersPurchased: ['p1'], logoURL: 'https://placehold.co/64/E879F9/111827/png?text=W' },
  { _id: 'team2', tournamentId: 't1', name: 'Chilaw', shortCode: 'CCC', ownerName: 'Sandun', initialBudget: 10000000, currentBalance: 7500000, playersPurchased: ['p2'], logoURL: 'https://placehold.co/64/F472B6/111827/png?text=C' },
  { _id: 'team3', tournamentId: 't1', name: 'Matara', shortCode: 'MCC', ownerName: 'Kumar', initialBudget: 10000000, currentBalance: 9200000, playersPurchased: ['p3'], logoURL: 'https://placehold.co/64/A78BFA/111827/png?text=M' },
  { _id: 'team4', tournamentId: 't1', name: 'Galle', shortCode: 'GCC', ownerName: 'Madu', initialBudget: 10000000, currentBalance: 6800000, playersPurchased: ['p4'], logoURL: 'https://placehold.co/64/FBBF24/111827/png?text=G' },
  { _id: 'team5', tournamentId: 't1', name: 'Colombo', shortCode: 'COL', ownerName: 'Kumara', initialBudget: 10000000, currentBalance: 10000000, playersPurchased: [], logoURL: 'https://placehold.co/64/34D399/111827/png?text=CO' },
  { _id: 'team6', tournamentId: 't1', name: 'Mannar', shortCode: 'MAN', ownerName: 'Kuyil', initialBudget: 10000000, currentBalance: 10000000, playersPurchased: [], logoURL: 'https://placehold.co/64/60A5FA/111827/png?text=MA' },
  { _id: 'team7', tournamentId: 't1', name: 'Jaffna', shortCode: 'JCC', ownerName: 'Kili', initialBudget: 10000000, currentBalance: 10000000, playersPurchased: [], logoURL: 'https://placehold.co/64/F43F5E/111827/png?text=J' },
  { _id: 'team8', tournamentId: 't1', name: 'Puttalam', shortCode: 'PCC', ownerName: 'Nimal', initialBudget: 10000000, currentBalance: 10000000, playersPurchased: [], logoURL: 'https://placehold.co/64/8B5CF6/111827/png?text=P' },
];

let players: Player[] = [
  { _id: 'p1', tournamentId: 't1', name: 'Shadow', photoURL: 'https://picsum.photos/seed/shadow/200', isSold: false },
  { _id: 'p2', tournamentId: 't1', name: 'Vortex', photoURL: 'https://picsum.photos/seed/vortex/200', isSold: false },
  { _id: 'p3', tournamentId: 't1', name: 'Blitz', photoURL: 'https://picsum.photos/seed/blitz/200', isSold: false },
  { _id: 'p4', tournamentId: 't1', name: 'Rogue', photoURL: 'https://picsum.photos/seed/rogue/200', isSold: false }
];

// Helper function to generate IDs
const generateId = (prefix: string) => `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

// Tournament operations
export const tournamentDB = {
  getAll: () => tournaments,
  getById: (id: string) => tournaments.find(t => t._id === id),
  create: (data: Omit<Tournament, '_id' | 'status'>) => {
    const newTournament: Tournament = {
      _id: generateId('t'),
      ...data,
      status: 'Draft'
    };
    tournaments.push(newTournament);
    return newTournament;
  },
  update: (id: string, data: Partial<Omit<Tournament, '_id'>>) => {
    const index = tournaments.findIndex(t => t._id === id);
    if (index === -1) return null;
    tournaments[index] = { ...tournaments[index], ...data };
    return tournaments[index];
  },
  delete: (id: string) => {
    const index = tournaments.findIndex(t => t._id === id);
    if (index === -1) return false;
    tournaments.splice(index, 1);
    return true;
  }
};

// Team operations
export const teamDB = {
  getAll: () => teams,
  getById: (id: string) => teams.find(t => t._id === id),
  create: (data: Omit<Team, '_id' | 'tournamentId' | 'initialBudget' | 'currentBalance' | 'playersPurchased'>) => {
    const newTeam: Team = {
      _id: generateId('team'),
      tournamentId: 't1', // Default tournament
      initialBudget: 10000000,
      currentBalance: 10000000,
      playersPurchased: [],
      ...data,
    };
    teams.push(newTeam);
    return newTeam;
  },
  update: (id: string, data: Partial<Omit<Team, '_id' | 'tournamentId'>>) => {
    const index = teams.findIndex(t => t._id === id);
    if (index === -1) return null;
    teams[index] = { ...teams[index], ...data };
    return teams[index];
  },
  delete: (id: string) => {
    const index = teams.findIndex(t => t._id === id);
    if (index === -1) return false;
    teams.splice(index, 1);
    return true;
  }
};

// Player operations
export const playerDB = {
  getAll: () => players,
  getById: (id: string) => players.find(p => p._id === id),
  create: (data: Omit<Player, '_id' | 'tournamentId' | 'isSold' | 'finalPrice' | 'winningTeamId'>) => {
    const newPlayer: Player = {
      _id: generateId('p'),
      tournamentId: 't1', // Default tournament
      isSold: false,
      ...data,
    };
    players.push(newPlayer);
    return newPlayer;
  },
  update: (id: string, data: Partial<Omit<Player, '_id' | 'tournamentId'>>) => {
    const index = players.findIndex(p => p._id === id);
    if (index === -1) return null;
    players[index] = { ...players[index], ...data };
    return players[index];
  },
  delete: (id: string) => {
    const index = players.findIndex(p => p._id === id);
    if (index === -1) return false;
    players.splice(index, 1);
    return true;
  }
};
