// MongoDB database operations using Mongoose
import { connectToDatabase } from './mongodb';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';
import { MasterTeamModel } from '@/models/MasterTeam';
import { MasterPlayerModel } from '@/models/MasterPlayer';
import { OverlayConfigModel, OverlaySceneModel, OverlayHistoryModel, OverlayAnalyticsModel } from '@/models/OverlayConfig';
import { Tournament, Team, Player, MasterTeam, MasterPlayer, OverlayConfig, OverlayScene, OverlayHistory } from '@/types';
import { canAccessTournament, canAccessTeam, canAccessPlayer, canAccessMasterTeam, canAccessMasterPlayer } from './permissions';

// Helper function to generate IDs
const generateId = (prefix: string) =>
  `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

// Helper function to generate sequential master player ID with PS prefix
const generateSequentialPlayerId = async (): Promise<string> => {
  await connectToDatabase();
  const count = await MasterPlayerModel.countDocuments();
  const playerNumber = (count + 1).toString().padStart(3, '0');
  return `PS${playerNumber}`;
};

// Helper function to generate tournament player ID (globally unique)
// Uses timestamp + random string to guarantee uniqueness and avoid collisions
const generateTournamentPlayerId = async (tournamentId: string): Promise<string> => {
  // Use the same approach as other entities (teams, tournaments, etc.)
  // This guarantees uniqueness without database queries or race conditions
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
   * Tournament/Team: sees tournaments they created or were assigned to
   * MasterManager: sees tournaments they created
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

    // Tournament role sees ONLY tournaments they created (same as Master Data pattern)
    if (userRole === 'Tournament') {
      return await TournamentModel.find({ createdBy: userId }).lean() as any;
    }

    // Other roles: tournaments created by user OR assigned to user
    const tournaments = await TournamentModel.find({
      $or: [
        { createdBy: userId },
        { _id: { $in: assignedTournaments } },
      ],
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

// Master Team operations (Global Registry)
export const masterTeamDB = {
  getAll: async (): Promise<MasterTeam[]> => {
    await connectToDatabase();
    return await MasterTeamModel.find().sort({ name: 1 }).lean() as any;
  },

  /**
   * Get master teams accessible to a user
   * Admin: sees all master teams
   * MasterManager/Tournament: sees only teams they created
   * Others: no access (empty array)
   */
  getAllForUser: async (userId: string, userRole: string): Promise<MasterTeam[]> => {
    await connectToDatabase();

    // Admin sees all master teams
    if (userRole === 'Admin') {
      return await MasterTeamModel.find().sort({ name: 1 }).lean() as any;
    }

    // MasterManager and Tournament see only teams they created
    if (userRole === 'MasterManager' || userRole === 'Tournament') {
      return await MasterTeamModel.find({ createdBy: userId }).sort({ name: 1 }).lean() as any;
    }

    // Other roles have no access to master teams
    return [];
  },

  getPaginated: async (skip: number, limit: number): Promise<MasterTeam[]> => {
    await connectToDatabase();
    return await MasterTeamModel.find()
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .select('_id name ownerName shortCode logoURL')
      .lean() as any;
  },

  /**
   * Get paginated master teams for a specific user
   */
  getPaginatedForUser: async (
    userId: string,
    userRole: string,
    skip: number,
    limit: number
  ): Promise<MasterTeam[]> => {
    await connectToDatabase();

    if (userRole === 'Admin') {
      return await MasterTeamModel.find()
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .select('_id name ownerName shortCode logoURL')
        .lean() as any;
    }

    if (userRole === 'MasterManager' || userRole === 'Tournament') {
      return await MasterTeamModel.find({ createdBy: userId })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .select('_id name ownerName shortCode logoURL')
        .lean() as any;
    }

    return [];
  },

  count: async (): Promise<number> => {
    await connectToDatabase();
    return await MasterTeamModel.countDocuments();
  },

  /**
   * Get count of master teams for a specific user
   */
  countForUser: async (userId: string, userRole: string): Promise<number> => {
    await connectToDatabase();

    if (userRole === 'Admin') {
      return await MasterTeamModel.countDocuments();
    }

    if (userRole === 'MasterManager' || userRole === 'Tournament') {
      return await MasterTeamModel.countDocuments({ createdBy: userId });
    }

    return 0;
  },

  getById: async (id: string): Promise<MasterTeam | null> => {
    await connectToDatabase();
    return await MasterTeamModel.findOne({ _id: id }).lean() as any;
  },

  create: async (data: Omit<MasterTeam, '_id'>, createdBy?: string): Promise<MasterTeam> => {
    await connectToDatabase();

    // Check for duplicate shortCode
    const existing = await MasterTeamModel.findOne({ shortCode: data.shortCode }).select('_id').lean();
    if (existing) {
      throw new Error(`Team with shortCode "${data.shortCode}" already exists`);
    }

    const newMasterTeam: MasterTeam = {
      _id: generateId('mt'),
      ...data,
      ...(createdBy && { createdBy }),
      logoURL: data.logoURL || `https://placehold.co/100x100/374151/F3F4F6/png?text=${encodeURIComponent(data.name.charAt(0))}`,
    };
    const doc = await MasterTeamModel.create(newMasterTeam);
    return doc.toObject();
  },

  update: async (id: string, data: Partial<Omit<MasterTeam, '_id'>>): Promise<MasterTeam | null> => {
    await connectToDatabase();

    // Update master
    const updated = await MasterTeamModel.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    ).lean();

    if (!updated) return null;

    // Propagate changes to all tournament instances
    const updateFields: any = {};
    if (data.name) updateFields.name = data.name;
    if (data.shortCode) updateFields.shortCode = data.shortCode;
    if (data.ownerName) updateFields.ownerName = data.ownerName;
    if (data.logoURL !== undefined) updateFields.logoURL = data.logoURL;

    if (Object.keys(updateFields).length > 0) {
      await TeamModel.updateMany(
        { masterTeamId: id },
        { $set: updateFields }
      );
    }

    return updated as any;
  },

  delete: async (id: string): Promise<boolean> => {
    await connectToDatabase();

    // CASCADE DELETE - Delete all tournament instances first
    await TeamModel.deleteMany({ masterTeamId: id });

    // Delete master
    const result = await MasterTeamModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },

  // Get all tournaments where this master team is used
  getUsageInTournaments: async (id: string): Promise<string[]> => {
    await connectToDatabase();
    const teams = await TeamModel.find({ masterTeamId: id }).distinct('tournamentId');
    return teams;
  },
};

// Master Player operations (Global Registry)
export const masterPlayerDB = {
  getAll: async (): Promise<MasterPlayer[]> => {
    await connectToDatabase();
    return await MasterPlayerModel.find().sort({ name: 1 }).lean() as any;
  },

  /**
   * Get master players accessible to a user
   * Admin: sees all master players
   * MasterManager/Tournament: sees only players they created
   * Others: no access (empty array)
   */
  getAllForUser: async (userId: string, userRole: string): Promise<MasterPlayer[]> => {
    await connectToDatabase();

    // Admin sees all master players
    if (userRole === 'Admin') {
      return await MasterPlayerModel.find().sort({ name: 1 }).lean() as any;
    }

    // MasterManager and Tournament see only players they created
    if (userRole === 'MasterManager' || userRole === 'Tournament') {
      return await MasterPlayerModel.find({ createdBy: userId }).sort({ name: 1 }).lean() as any;
    }

    // Other roles have no access to master players
    return [];
  },

  getPaginated: async (skip: number, limit: number): Promise<MasterPlayer[]> => {
    await connectToDatabase();
    return await MasterPlayerModel.find()
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .select('_id name position currentClub photoURL careerStats suggestedClass')
      .lean() as any;
  },

  /**
   * Get paginated master players for a specific user
   */
  getPaginatedForUser: async (
    userId: string,
    userRole: string,
    skip: number,
    limit: number
  ): Promise<MasterPlayer[]> => {
    await connectToDatabase();

    if (userRole === 'Admin') {
      return await MasterPlayerModel.find()
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .select('_id name position currentClub photoURL careerStats suggestedClass')
        .lean() as any;
    }

    if (userRole === 'MasterManager' || userRole === 'Tournament') {
      return await MasterPlayerModel.find({ createdBy: userId })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .select('_id name position currentClub photoURL careerStats suggestedClass')
        .lean() as any;
    }

    return [];
  },

  count: async (): Promise<number> => {
    await connectToDatabase();
    return await MasterPlayerModel.countDocuments();
  },

  /**
   * Get count of master players for a specific user
   */
  countForUser: async (userId: string, userRole: string): Promise<number> => {
    await connectToDatabase();

    if (userRole === 'Admin') {
      return await MasterPlayerModel.countDocuments();
    }

    if (userRole === 'MasterManager' || userRole === 'Tournament') {
      return await MasterPlayerModel.countDocuments({ createdBy: userId });
    }

    return 0;
  },

  getById: async (id: string): Promise<MasterPlayer | null> => {
    await connectToDatabase();
    return await MasterPlayerModel.findOne({ _id: id }).lean() as any;
  },

  create: async (data: Omit<MasterPlayer, '_id'>, createdBy?: string): Promise<MasterPlayer> => {
    await connectToDatabase();
    const playerId = await generateSequentialPlayerId();
    const newMasterPlayer: MasterPlayer = {
      _id: playerId,
      ...data,
      ...(createdBy && { createdBy }),
      photoURL: data.photoURL || `https://placehold.co/100x100/374151/F3F4F6/png?text=No+Image`,
      careerStats: data.careerStats || { matchesPlayed: 0, totalScore: 0, totalWickets: 0 },
    };
    const doc = await MasterPlayerModel.create(newMasterPlayer);
    return doc.toObject();
  },

  update: async (id: string, data: Partial<Omit<MasterPlayer, '_id'>>): Promise<MasterPlayer | null> => {
    await connectToDatabase();

    // Update master
    const updated = await MasterPlayerModel.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    ).lean();

    if (!updated) return null;

    // Propagate changes to all tournament instances
    const updateFields: any = {};
    if (data.name) updateFields.name = data.name;
    if (data.position) updateFields.position = data.position;
    if (data.currentClub) updateFields.currentClub = data.currentClub;
    if (data.photoURL !== undefined) {
      updateFields.photoURL = data.photoURL; // Same field name in both schemas
    }

    if (Object.keys(updateFields).length > 0) {
      await PlayerModel.updateMany(
        { masterPlayerId: id },
        { $set: updateFields }
      );
    }

    return updated as any;
  },

  delete: async (id: string): Promise<boolean> => {
    await connectToDatabase();

    // CASCADE DELETE - Delete all tournament instances first
    await PlayerModel.deleteMany({ masterPlayerId: id });

    // Delete master
    const result = await MasterPlayerModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },

  // Get all tournaments where this master player is used
  getUsageInTournaments: async (id: string): Promise<string[]> => {
    await connectToDatabase();
    const players = await PlayerModel.find({ masterPlayerId: id }).distinct('tournamentId');
    return players;
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
    data: Omit<Team, '_id' | 'tournamentId' | 'initialBudget' | 'currentBalance' | 'playersPurchased'>,
    createdBy?: string
  ): Promise<Team> => {
    await connectToDatabase();
    const newTeam: Team = {
      _id: generateId('team'),
      name: data.name,
      shortCode: data.shortCode,
      ownerName: data.ownerName,
      // No tournamentId - team is unassigned
      // No budget fields - only set when assigned to tournament
      playersPurchased: [],
      ...(createdBy && { createdBy }),
      // Provide default logo if not provided
      logoURL: data.logoURL || `https://placehold.co/100x100/374151/F3F4F6/png?text=${encodeURIComponent(data.name.charAt(0))}`,
    };
    const doc = await TeamModel.create(newTeam);
    return doc.toObject();
  },

  update: async (id: string, data: Partial<Omit<Team, '_id'>>): Promise<Team | null> => {
    await connectToDatabase();
    const updated = await TeamModel.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    ).lean();
    return updated as any;
  },

  // Create tournament team from master team
  createFromMaster: async (
    masterTeamId: string,
    tournamentId: string,
    createdBy?: string
  ): Promise<Team> => {
    await connectToDatabase();

    // Get master team data
    const masterTeam = await MasterTeamModel.findOne({ _id: masterTeamId }).lean() as MasterTeam | null;
    if (!masterTeam) throw new Error('Master team not found');

    // Get tournament data for budget
    const tournament = await TournamentModel.findOne({ _id: tournamentId }).lean() as Tournament | null;
    if (!tournament) throw new Error('Tournament not found');

    // Check if team already exists in tournament
    const existing = await TeamModel.findOne({ masterTeamId, tournamentId });
    if (existing) {
      throw new Error('Team already added to this tournament');
    }

    const newTeam: Team = {
      _id: generateId('team'),
      masterTeamId,
      tournamentId,
      // Copy from master (read-only)
      name: masterTeam.name,
      shortCode: masterTeam.shortCode,
      ownerName: masterTeam.ownerName,
      logoURL: masterTeam.logoURL,
      // Tournament-specific
      initialBudget: tournament.budgetPerTeam,
      currentBalance: tournament.budgetPerTeam,
      playersPurchased: [],
      ...(createdBy && { createdBy }),
    };

    const doc = await TeamModel.create(newTeam);
    return doc.toObject();
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
    data: Omit<Player, '_id' | 'tournamentId' | 'isSold' | 'finalPrice' | 'winningTeamId'>,
    createdBy?: string
  ): Promise<Player> => {
    await connectToDatabase();
    const newPlayer: Player = {
      _id: generateId('p'),
      name: data.name,
      stats: data.stats,
      // No tournamentId - player is unassigned
      isSold: false,
      ...(createdBy && { createdBy }),
      // Provide default photo if not provided
      photoURL: data.photoURL || `https://placehold.co/100x100/374151/F3F4F6/png?text=No+Image`,
    };
    const doc = await PlayerModel.create(newPlayer);
    return doc.toObject();
  },

  update: async (id: string, data: Partial<Omit<Player, '_id'>>): Promise<Player | null> => {
    await connectToDatabase();
    const updated = await PlayerModel.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    ).lean();
    return updated as any;
  },

  // Create tournament player from master player
  createFromMaster: async (
    masterPlayerId: string,
    tournamentId: string,
    playerClass?: string,
    createdBy?: string
  ): Promise<Player> => {
    try {
      await connectToDatabase();

      console.log(`[playerDB.createFromMaster] Starting: masterPlayerId=${masterPlayerId}, tournamentId=${tournamentId}`);

      // Batch fetch master player and duplicate check in parallel for better performance
      const startTime = Date.now();
      const [masterPlayer, existing] = await Promise.all([
        MasterPlayerModel.findOne({ _id: masterPlayerId }).lean() as Promise<MasterPlayer | null>,
        PlayerModel.findOne({ masterPlayerId, tournamentId }).select('_id').lean() as Promise<any>,
      ]);
      console.log(`[playerDB.createFromMaster] Batch fetch took ${Date.now() - startTime}ms`);

      if (!masterPlayer) {
        console.error(`[playerDB.createFromMaster] Master player not found: ${masterPlayerId}`);
        throw new Error('Master player not found');
      }

      if (existing) {
        console.warn(`[playerDB.createFromMaster] Player already exists: ${existing._id}`);
        console.warn(`[playerDB.createFromMaster] Duplicate details - masterPlayerId: ${masterPlayerId}, tournamentId: ${tournamentId}, existingPlayerId: ${existing._id}`);

        // Get full player details for debugging
        const fullExisting = await PlayerModel.findById(existing._id).lean();
        console.warn(`[playerDB.createFromMaster] Full duplicate player:`, fullExisting);

        throw new Error(`Player "${masterPlayer.name}" is already added to this tournament (Player ID: ${existing._id})`);
      }

      // Generate globally unique ID (timestamp-based)
      const idGenStart = Date.now();
      const tournamentPlayerId = await generateTournamentPlayerId(tournamentId);

      // Generate sequential player number within tournament (001, 002, 003)
      const playerNo = await generatePlayerNo(tournamentId);
      console.log(`[playerDB.createFromMaster] ID generation took ${Date.now() - idGenStart}ms, generated: ${tournamentPlayerId}, playerNo: ${playerNo}`);

      const newPlayer: Player = {
        _id: tournamentPlayerId,
        playerNo: playerNo,
        masterPlayerId,
        tournamentId,
        // Copy from master (read-only)
        name: masterPlayer.name,
        position: masterPlayer.position,
        currentClub: masterPlayer.currentClub,
        photoURL: masterPlayer.photoURL, // Same field name as master
        // Copy career stats from master player
        stats: masterPlayer.careerStats || { matchesPlayed: 0, totalScore: 0, totalWickets: 0 },
        // Use provided playerClass or fall back to master's suggestedClass
        playerClass: playerClass || masterPlayer.suggestedClass,
        isSold: false,
        ...(createdBy && { createdBy }),
      };

      const createStart = Date.now();
      const doc = await PlayerModel.create(newPlayer);
      console.log(`[playerDB.createFromMaster] Player creation took ${Date.now() - createStart}ms`);
      console.log(`[playerDB.createFromMaster] Successfully created player: ${tournamentPlayerId} (${masterPlayer.name})`);

      return doc.toObject();
    } catch (error) {
      console.error('[playerDB.createFromMaster] Error:', error);
      throw error;
    }
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

    // Seed Players (using new sequential format: 001, 002, 003...)
    await PlayerModel.insertMany([
      {
        _id: '001',
        tournamentId: 't1',
        name: 'Shadow',
        stats: { matchesPlayed: 50, totalScore: 1200, totalWickets: 5 },
        imageURL: 'https://picsum.photos/seed/shadow/200',
        isSold: false,
      },
      {
        _id: '002',
        tournamentId: 't1',
        name: 'Vortex',
        stats: { matchesPlayed: 65, totalScore: 850, totalWickets: 75 },
        imageURL: 'https://picsum.photos/seed/vortex/200',
        isSold: false,
      },
      {
        _id: '003',
        tournamentId: 't1',
        name: 'Blitz',
        stats: { matchesPlayed: 45, totalScore: 1500, totalWickets: 10 },
        imageURL: 'https://picsum.photos/seed/blitz/200',
        isSold: false,
      },
      {
        _id: '004',
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
      { new: true }
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
      { new: true }
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
      { new: true }
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
