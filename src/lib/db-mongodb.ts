// MongoDB database operations using Mongoose
import { connectToDatabase } from './mongodb';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { Tournament, Team, Player } from '@/types';

// Helper function to generate IDs
const generateId = (prefix: string) =>
  `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

// Tournament operations
export const tournamentDB = {
  getAll: async (): Promise<Tournament[]> => {
    await connectToDatabase();
    return await TournamentModel.find().lean() as any;
  },

  getById: async (id: string): Promise<Tournament | null> => {
    await connectToDatabase();
    return await TournamentModel.findOne({ _id: id }).lean() as any;
  },

  create: async (data: Omit<Tournament, '_id' | 'status'>): Promise<Tournament> => {
    await connectToDatabase();
    const newTournament = {
      _id: generateId('t'),
      ...data,
      status: 'Draft' as const,
    };
    const doc = await TournamentModel.create(newTournament);
    return doc.toObject();
  },

  update: async (id: string, data: Partial<Omit<Tournament, '_id'>>): Promise<Tournament | null> => {
    await connectToDatabase();
    const updated = await TournamentModel.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    ).lean();
    return updated as any;
  },

  delete: async (id: string): Promise<boolean> => {
    await connectToDatabase();
    const result = await TournamentModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },
};

// Team operations
export const teamDB = {
  getAll: async (): Promise<Team[]> => {
    await connectToDatabase();
    return await TeamModel.find().lean() as any;
  },

  getById: async (id: string): Promise<Team | null> => {
    await connectToDatabase();
    return await TeamModel.findOne({ _id: id }).lean() as any;
  },

  create: async (
    data: Omit<Team, '_id' | 'tournamentId' | 'initialBudget' | 'currentBalance' | 'playersPurchased'>
  ): Promise<Team> => {
    await connectToDatabase();
    const newTeam: Team = {
      _id: generateId('team'),
      tournamentId: 't1', // Default tournament
      initialBudget: 10000000,
      currentBalance: 10000000,
      playersPurchased: [],
      ...data,
      // Provide default logo if not provided
      logoURL: data.logoURL || `https://placehold.co/100x100/374151/F3F4F6/png?text=${encodeURIComponent(data.name.charAt(0))}`,
    };
    const doc = await TeamModel.create(newTeam);
    return doc.toObject();
  },

  update: async (id: string, data: Partial<Omit<Team, '_id' | 'tournamentId'>>): Promise<Team | null> => {
    await connectToDatabase();
    const updated = await TeamModel.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    ).lean();
    return updated as any;
  },

  delete: async (id: string): Promise<boolean> => {
    await connectToDatabase();
    const result = await TeamModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },
};

// Player operations
export const playerDB = {
  getAll: async (): Promise<Player[]> => {
    await connectToDatabase();
    return await PlayerModel.find().lean() as any;
  },

  getById: async (id: string): Promise<Player | null> => {
    await connectToDatabase();
    return await PlayerModel.findOne({ _id: id }).lean() as any;
  },

  create: async (
    data: Omit<Player, '_id' | 'tournamentId' | 'isSold' | 'finalPrice' | 'winningTeamId'>
  ): Promise<Player> => {
    await connectToDatabase();
    const newPlayer: Player = {
      _id: generateId('p'),
      tournamentId: 't1', // Default tournament
      isSold: false,
      ...data,
      // Provide default image if not provided
      imageURL: data.imageURL || `https://placehold.co/100x100/374151/F3F4F6/png?text=No+Image`,
    };
    const doc = await PlayerModel.create(newPlayer);
    return doc.toObject();
  },

  update: async (id: string, data: Partial<Omit<Player, '_id' | 'tournamentId'>>): Promise<Player | null> => {
    await connectToDatabase();
    const updated = await PlayerModel.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    ).lean();
    return updated as any;
  },

  delete: async (id: string): Promise<boolean> => {
    await connectToDatabase();
    const result = await PlayerModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },
};

// Initialize database with seed data if empty
export const seedDatabase = async () => {
  await connectToDatabase();

  const tournamentsCount = await TournamentModel.countDocuments();
  if (tournamentsCount === 0) {
    console.log('🌱 Seeding database with initial data...');

    // Seed Tournaments
    await TournamentModel.insertMany([
      {
        _id: 't1',
        name: 'LPL 2025',
        year: 2025,
        company: 'Default Company',
        budgetPerTeam: 500000,
        squadSize: 5,
        basePricePerPlayer: 5000,
        logoURL: 'https://placehold.co/64x64/E01A36/FFFFFF/png?text=LPL',
        status: 'Completed',
      },
      {
        _id: 't2',
        name: 'IPL 2025',
        year: 2025,
        company: 'Default Company',
        budgetPerTeam: 500000,
        squadSize: 10,
        basePricePerPlayer: 5000,
        logoURL: 'https://placehold.co/64x64/004B8D/FFFFFF/png?text=IPL',
        status: 'Draft',
      },
      {
        _id: 't3',
        name: 'ipl 2025',
        year: 2025,
        company: 'Default Company',
        budgetPerTeam: 500000,
        squadSize: 4,
        basePricePerPlayer: 5000,
        logoURL: 'https://placehold.co/64x64/004B8D/FFFFFF/png?text=ipl',
        status: 'Draft',
      },
    ]);

    // Seed Teams
    await TeamModel.insertMany([
      {
        _id: 'team1',
        tournamentId: 't1',
        name: 'Wariyapola',
        shortCode: 'WCC',
        ownerName: 'Masan',
        initialBudget: 10000000,
        currentBalance: 8500000,
        playersPurchased: ['p1'],
        logoURL: 'https://placehold.co/64/E879F9/111827/png?text=W',
        primaryColor: '#FF0000',
        secondaryColor: '#0000FF',
      },
      {
        _id: 'team2',
        tournamentId: 't1',
        name: 'Chilaw',
        shortCode: 'CCC',
        ownerName: 'Sandun',
        initialBudget: 10000000,
        currentBalance: 7500000,
        playersPurchased: ['p2'],
        logoURL: 'https://placehold.co/64/F472B6/111827/png?text=C',
        primaryColor: '#00FF00',
        secondaryColor: '#FFFF00',
      },
      {
        _id: 'team3',
        tournamentId: 't1',
        name: 'Matara',
        shortCode: 'MCC',
        ownerName: 'Kumar',
        initialBudget: 10000000,
        currentBalance: 9200000,
        playersPurchased: ['p3'],
        logoURL: 'https://placehold.co/64/A78BFA/111827/png?text=M',
        primaryColor: '#0000FF',
        secondaryColor: '#FF0000',
      },
      {
        _id: 'team4',
        tournamentId: 't1',
        name: 'Galle',
        shortCode: 'GCC',
        ownerName: 'Madu',
        initialBudget: 10000000,
        currentBalance: 6800000,
        playersPurchased: ['p4'],
        logoURL: 'https://placehold.co/64/FBBF24/111827/png?text=G',
        primaryColor: '#FFFF00',
        secondaryColor: '#00FF00',
      },
      {
        _id: 'team5',
        tournamentId: 't1',
        name: 'Colombo',
        shortCode: 'COL',
        ownerName: 'Kumara',
        initialBudget: 10000000,
        currentBalance: 10000000,
        playersPurchased: [],
        logoURL: 'https://placehold.co/64/34D399/111827/png?text=CO',
        primaryColor: '#34D399',
        secondaryColor: '#06B6D4',
      },
      {
        _id: 'team6',
        tournamentId: 't1',
        name: 'Mannar',
        shortCode: 'MAN',
        ownerName: 'Kuyil',
        initialBudget: 10000000,
        currentBalance: 10000000,
        playersPurchased: [],
        logoURL: 'https://placehold.co/64/60A5FA/111827/png?text=MA',
        primaryColor: '#60A5FA',
        secondaryColor: '#818CF8',
      },
      {
        _id: 'team7',
        tournamentId: 't1',
        name: 'Jaffna',
        shortCode: 'JCC',
        ownerName: 'Kili',
        initialBudget: 10000000,
        currentBalance: 10000000,
        playersPurchased: [],
        logoURL: 'https://placehold.co/64/F43F5E/111827/png?text=J',
        primaryColor: '#F43F5E',
        secondaryColor: '#EC4899',
      },
      {
        _id: 'team8',
        tournamentId: 't1',
        name: 'Puttalam',
        shortCode: 'PCC',
        ownerName: 'Nimal',
        initialBudget: 10000000,
        currentBalance: 10000000,
        playersPurchased: [],
        logoURL: 'https://placehold.co/64/8B5CF6/111827/png?text=P',
        primaryColor: '#8B5CF6',
        secondaryColor: '#D946EF',
      },
    ]);

    // Seed Players
    await PlayerModel.insertMany([
      {
        _id: 'p1',
        tournamentId: 't1',
        name: 'Shadow',
        stats: { matchesPlayed: 50, totalScore: 1200, totalWickets: 5 },
        imageURL: 'https://picsum.photos/seed/shadow/200',
        isSold: false,
      },
      {
        _id: 'p2',
        tournamentId: 't1',
        name: 'Vortex',
        stats: { matchesPlayed: 65, totalScore: 850, totalWickets: 75 },
        imageURL: 'https://picsum.photos/seed/vortex/200',
        isSold: false,
      },
      {
        _id: 'p3',
        tournamentId: 't1',
        name: 'Blitz',
        stats: { matchesPlayed: 45, totalScore: 1500, totalWickets: 10 },
        imageURL: 'https://picsum.photos/seed/blitz/200',
        isSold: false,
      },
      {
        _id: 'p4',
        tournamentId: 't1',
        name: 'Rogue',
        stats: { matchesPlayed: 55, totalScore: 980, totalWickets: 30 },
        imageURL: 'https://picsum.photos/seed/rogue/200',
        isSold: false,
      },
    ]);

    console.log('✅ Database seeded successfully!');
  }
};
