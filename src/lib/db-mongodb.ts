// MongoDB database operations using Mongoose
import { connectToDatabase } from './mongodb';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { addAssignedTournament, getAssignedTournaments } from '@/lib/pg/user-queries';
import { OverlayConfigModel, OverlaySceneModel, OverlayHistoryModel, OverlayAnalyticsModel } from '@/models/OverlayConfig';
import { Tournament, Team, Player, OverlayConfig, OverlayScene, OverlayHistory } from '@/types';
import { canAccessTournament, canAccessTeam, canAccessPlayer } from './permissions';

// Helper function to generate IDs
const generateId = (prefix: string) =>
  `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

// Helper function to generate tournament player ID (globally unique)
const generateTournamentPlayerId = async (): Promise<string> => {
  return generateId('p');
};

// Helper function to generate sequential player number within tournament
// Returns "001", "002", "003", etc. (unique per tournament)
// Uses aggregation pipeline for better performance with large datasets
const generatePlayerNo = async (tournamentId: string): Promise<string> => {
  await connectToDatabase();

  console.log(`[generatePlayerNo] Generating playerNo for tournament: ${tournamentId}`);

  // Use aggregation pipeline to find max playerNo efficiently
  const result = await PlayerModel.aggregate([
    { $match: { tournamentId, playerNo: { $exists: true } } },
    { $project: { playerNo: 1 } },
    { $sort: { playerNo: -1 } },
    { $limit: 1 },
  ]);

  console.log(`[generatePlayerNo] Found existing players:`, result);

  let nextNumber = 1;

  if (result.length > 0 && result[0].playerNo) {
    // Extract number from playerNo (e.g., "001" -> 1, "099" -> 99)
    const match = result[0].playerNo.match(/^\d+$/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
    console.log(`[generatePlayerNo] Highest playerNo found: ${result[0].playerNo}, next will be: ${nextNumber}`);
  } else {
    console.log(`[generatePlayerNo] No existing players found, starting at: 001`);
  }

  // Pad with leading zeros (001, 002, ... 099, 100, ...)
  const playerNo = nextNumber.toString().padStart(3, '0');
  console.log(`[generatePlayerNo] Generated playerNo: ${playerNo} for tournament: ${tournamentId}`);

  return playerNo;
};

// Tournament operations
export const tournamentDB = {
  getAll: async (): Promise<Tournament[]> => {
    await connectToDatabase();
    return await TournamentModel.find().lean() as any;
  },

  /**
   * Get all tournaments accessible to a user based on their role and permissions
   * Admin: sees all tournaments
   * Tournament: sees tournaments assigned through Postgres
   * Player/Audience: no tournament access (empty array)
   */
  getAllForUser: async (
    userId: string,
    userRole: string,
    assignedTournaments: string[] = []
  ): Promise<Tournament[]> => {
    await connectToDatabase();

    // Admin sees all tournaments
    if (userRole === 'Admin') {
      return await TournamentModel.find().lean() as any;
    }

    // All non-admin roles: only tournaments explicitly assigned to user in Postgres
    const allowedTournamentIds = assignedTournaments.length > 0
      ? assignedTournaments
      : await getAssignedTournaments(userId);

    const tournaments = await TournamentModel.find({
      _id: { $in: allowedTournamentIds },
    }).lean() as any;

    return tournaments;
  },

  getById: async (id: string): Promise<Tournament | null> => {
    await connectToDatabase();
    return await TournamentModel.findOne({ _id: id }).lean() as any;
  },

  create: async (data: Omit<Tournament, '_id' | 'status'>, createdBy?: string): Promise<Tournament> => {
    await connectToDatabase();
    const newTournament = {
      _id: generateId('t'),
      ...data,
      status: 'Draft' as const,
      ...(createdBy && { createdBy }),
    };
    const doc = await TournamentModel.create(newTournament);
    return doc.toObject();
  },

  grantUserAccess: async (userId: string, tournamentId: string): Promise<boolean> => {
    const updated = await addAssignedTournament(userId, tournamentId);
    return updated !== null;
  },

  update: async (id: string, data: Partial<Omit<Tournament, '_id'>>): Promise<Tournament | null> => {
    await connectToDatabase();
    const updated = await TournamentModel.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { returnDocument: 'after' }
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

  /**
   * Get all teams accessible to a user within specific tournaments
   * Admin: sees all teams
   * Others: see teams they created OR teams in tournaments they have access to
   */
  getAllForUser: async (
    userId: string,
    userRole: string,
    accessibleTournamentIds: string[] = []
  ): Promise<Team[]> => {
    await connectToDatabase();

    // Admin sees all teams
    if (userRole === 'Admin') {
      return await TeamModel.find().lean() as any;
    }

    // Build query: teams created by user OR teams in accessible tournaments
    const teams = await TeamModel.find({
      $or: [
        { createdBy: userId },
        { tournamentId: { $in: accessibleTournamentIds } },
      ],
    }).lean() as any;

    return teams;
  },

  getById: async (id: string): Promise<Team | null> => {
    await connectToDatabase();
    return await TeamModel.findOne({ _id: id }).lean() as any;
  },

  create: async (
    data: { name: string; shortCode: string; ownerName: string; logoURL?: string; tournamentId: string },
    createdBy?: string
  ): Promise<Team> => {
    await connectToDatabase();

    // Fetch tournament to get budget
    const tournament = await TournamentModel.findOne({ _id: data.tournamentId }).lean() as Tournament | null;
    if (!tournament) throw new Error('Tournament not found');

    const newTeam: Team = {
      _id: generateId('team'),
      tournamentId: data.tournamentId,
      name: data.name,
      shortCode: data.shortCode,
      ownerName: data.ownerName,
      logoURL: data.logoURL || `https://placehold.co/100x100/374151/F3F4F6/png?text=${encodeURIComponent(data.name.charAt(0))}`,
      initialBudget: tournament.budgetPerTeam,
      currentBalance: tournament.budgetPerTeam,
      playersPurchased: [],
      ...(createdBy && { createdBy }),
    };
    const doc = await TeamModel.create(newTeam);
    return doc.toObject();
  },

  update: async (id: string, data: Partial<Omit<Team, '_id'>>): Promise<Team | null> => {
    await connectToDatabase();
    const updated = await TeamModel.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { returnDocument: 'after' }
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

  /**
   * Get all players accessible to a user within specific tournaments
   * Admin: sees all players
   * Others: see players they created OR players in tournaments they have access to
   */
  getAllForUser: async (
    userId: string,
    userRole: string,
    accessibleTournamentIds: string[] = []
  ): Promise<Player[]> => {
    await connectToDatabase();

    // Admin sees all players
    if (userRole === 'Admin') {
      return await PlayerModel.find().lean() as any;
    }

    // Build query: players created by user OR players in accessible tournaments
    const players = await PlayerModel.find({
      $or: [
        { createdBy: userId },
        { tournamentId: { $in: accessibleTournamentIds } },
      ],
    }).lean() as any;

    return players;
  },

  getById: async (id: string): Promise<Player | null> => {
    await connectToDatabase();
    return await PlayerModel.findOne({ _id: id }).lean() as any;
  },

  create: async (
    data: { name: string; position?: string; currentClub?: string; photoURL?: string; secondaryImageURL?: string; playerClass?: string; age?: number; battingStyle?: string; bowlingStyle?: string; stats?: Record<string, any>; tournamentId: string },
    createdBy?: string
  ): Promise<Player> => {
    await connectToDatabase();
    const playerId = await generateTournamentPlayerId();
    const playerNo = (data as any).playerNo || await generatePlayerNo(data.tournamentId);
    const newPlayer: Player = {
      _id: playerId,
      playerNo,
      tournamentId: data.tournamentId,
      name: data.name,
      position: data.position,
      currentClub: data.currentClub,
      ...(data.photoURL && { photoURL: data.photoURL }),
      ...(data.secondaryImageURL && { secondaryImageURL: data.secondaryImageURL }),
      playerClass: data.playerClass,
      ...(data.age !== undefined && { age: data.age }),
      ...(data.battingStyle && { battingStyle: data.battingStyle }),
      ...(data.bowlingStyle && { bowlingStyle: data.bowlingStyle }),
      ...(data.stats && Object.keys(data.stats).length > 0 && { stats: data.stats }),
      isSold: false,
      ...(createdBy && { createdBy }),
    };
    const doc = await PlayerModel.create(newPlayer);
    return doc.toObject();
  },

  update: async (id: string, data: Partial<Omit<Player, '_id'>>): Promise<Player | null> => {
    await connectToDatabase();
    const updated = await PlayerModel.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { returnDocument: 'after' }
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
    console.log('ðŸŒ± Seeding database with initial data...');

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
      },
    ]);

    // Seed Players
    await PlayerModel.insertMany([
      { _id: '001', playerNo: '001', tournamentId: 't1', name: 'Shadow', position: 'Batsman', currentClub: 'Wariyapola CC', isSold: false },
      { _id: '002', playerNo: '002', tournamentId: 't1', name: 'Vortex', position: 'Bowler', currentClub: 'Chilaw CC', isSold: false },
      { _id: '003', playerNo: '003', tournamentId: 't1', name: 'Blitz', position: 'All-rounder', currentClub: 'Matara CC', isSold: false },
      { _id: '004', playerNo: '004', tournamentId: 't1', name: 'Rogue', position: 'Wicket-keeper', currentClub: 'Galle CC', isSold: false },
    ]);

    console.log('âœ… Database seeded successfully!');
  }
};

// Overlay Configuration operations
export const overlayConfigDB = {
  getAll: async (): Promise<OverlayConfig[]> => {
    await connectToDatabase();
    return await OverlayConfigModel.find().lean() as any;
  },

  getAllForUser: async (
    userId: string,
    userRole: string,
    tournamentId?: string | null
  ): Promise<OverlayConfig[]> => {
    await connectToDatabase();

    // Admin sees all overlays
    if (userRole === 'Admin') {
      const query = tournamentId ? { tournamentId } : {};
      return await OverlayConfigModel.find(query).lean() as any;
    }

    // Build query: overlays created by user OR global templates
    const query: any = {
      $or: [
        { createdBy: userId },
        { isTemplate: true, tournamentId: null }, // Global templates
      ],
    };

    // If tournamentId provided, also include overlays for that tournament
    if (tournamentId) {
      query.$or.push({ tournamentId });
    }

    return await OverlayConfigModel.find(query).lean() as any;
  },

  getById: async (id: string): Promise<OverlayConfig | null> => {
    await connectToDatabase();
    return await OverlayConfigModel.findOne({ _id: id }).lean() as any;
  },

  getByType: async (overlayType: string): Promise<OverlayConfig[]> => {
    await connectToDatabase();
    return await OverlayConfigModel.find({ overlayType }).lean() as any;
  },

  getByCategory: async (category: string): Promise<OverlayConfig[]> => {
    await connectToDatabase();
    return await OverlayConfigModel.find({ category }).lean() as any;
  },

  getTemplates: async (): Promise<OverlayConfig[]> => {
    await connectToDatabase();
    return await OverlayConfigModel.find({ isTemplate: true }).lean() as any;
  },

  create: async (
    data: Omit<OverlayConfig, '_id' | 'createdAt' | 'updatedAt' | 'version'>,
    createdBy: string
  ): Promise<OverlayConfig> => {
    await connectToDatabase();
    const newConfig: any = {
      _id: generateId('overlay'),
      ...data,
      createdBy,
      version: 1,
      viewCount: 0,
    };
    const doc = await OverlayConfigModel.create(newConfig);
    return doc.toObject();
  },

  update: async (id: string, data: Partial<Omit<OverlayConfig, '_id'>>, userId: string): Promise<OverlayConfig | null> => {
    await connectToDatabase();

    // Get current version
    const current = await OverlayConfigModel.findOne({ _id: id }).lean() as any;
    if (!current) return null;

    // Save to history before updating
    await OverlayHistoryModel.create({
      _id: generateId('history'),
      overlayConfigId: id,
      version: current.version || 1,
      changes: data,
      changedBy: userId,
      changedAt: new Date(),
    });

    // Update with incremented version
    const updated = await OverlayConfigModel.findOneAndUpdate(
      { _id: id },
      {
        $set: { ...data, updatedAt: new Date() },
        $inc: { version: 1 }
      },
      { returnDocument: 'after' }
    ).lean();

    return updated as any;
  },

  delete: async (id: string): Promise<boolean> => {
    await connectToDatabase();
    const result = await OverlayConfigModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },

  duplicate: async (id: string, createdBy: string): Promise<OverlayConfig | null> => {
    await connectToDatabase();
    const original = await OverlayConfigModel.findOne({ _id: id }).lean() as any;
    if (!original) return null;

    const newConfig: any = {
      ...original,
      _id: generateId('overlay'),
      name: `${original.name} (Copy)`,
      createdBy,
      parentConfigId: id,
      version: 1,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const doc = await OverlayConfigModel.create(newConfig);
    return doc.toObject();
  },

  incrementViewCount: async (id: string): Promise<void> => {
    await connectToDatabase();
    await OverlayConfigModel.updateOne(
      { _id: id },
      {
        $inc: { viewCount: 1 },
        $set: { lastUsedAt: new Date() }
      }
    );
  },

  lock: async (id: string, locked: boolean): Promise<OverlayConfig | null> => {
    await connectToDatabase();
    const updated = await OverlayConfigModel.findOneAndUpdate(
      { _id: id },
      { $set: { isLocked: locked } },
      { returnDocument: 'after' }
    ).lean();
    return updated as any;
  },
};

// Overlay Scene operations
export const overlaySceneDB = {
  getAll: async (): Promise<OverlayScene[]> => {
    await connectToDatabase();
    return await OverlaySceneModel.find().lean() as any;
  },

  getById: async (id: string): Promise<OverlayScene | null> => {
    await connectToDatabase();
    return await OverlaySceneModel.findOne({ _id: id }).lean() as any;
  },

  create: async (data: Omit<OverlayScene, '_id' | 'createdAt' | 'updatedAt'>): Promise<OverlayScene> => {
    await connectToDatabase();
    const newScene: any = {
      _id: generateId('scene'),
      ...data,
    };
    const doc = await OverlaySceneModel.create(newScene);
    return doc.toObject();
  },

  update: async (id: string, data: Partial<Omit<OverlayScene, '_id'>>): Promise<OverlayScene | null> => {
    await connectToDatabase();
    const updated = await OverlaySceneModel.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { returnDocument: 'after' }
    ).lean();
    return updated as any;
  },

  delete: async (id: string): Promise<boolean> => {
    await connectToDatabase();
    const result = await OverlaySceneModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },
};

// Overlay History operations
export const overlayHistoryDB = {
  getByConfigId: async (overlayConfigId: string): Promise<OverlayHistory[]> => {
    await connectToDatabase();
    return await OverlayHistoryModel.find({ overlayConfigId })
      .sort({ version: -1 })
      .lean() as any;
  },

  getByVersion: async (overlayConfigId: string, version: number): Promise<OverlayHistory | null> => {
    await connectToDatabase();
    return await OverlayHistoryModel.findOne({ overlayConfigId, version }).lean() as any;
  },
};
