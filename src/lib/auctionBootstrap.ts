import { connectToDatabase } from '@/lib/mongodb';
import { TournamentModel } from '@/models/Tournament';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { EMPTY_AUCTION_STATE } from './auctionDefaults';
import { AuctionState, Player, Team, Tournament } from '@/types';

export interface AuctionBootstrapPayload {
  tournament: Tournament | null;
  auctionState: AuctionState;
  players: Player[];
  teams: Team[];
}

// Convert Mongo/Mongoose values into plain JSON-safe primitives for client components
const toIdString = (value: any): string => (typeof value === 'string' ? value : value?.toString?.() ?? '');
const toNumber = (value: any): number => (typeof value === 'number' ? value : Number(value) || 0);

const serializeTournament = (doc: any): Tournament => {
  const { createdAt: _createdAt, updatedAt: _updatedAt, __v: _version, ...rest } = doc || {};
  return {
    ...rest,
    _id: toIdString(doc?._id),
  };
};

const serializeAuctionState = (doc: any, fallbackTournamentId: string): AuctionState => {
  const merged = doc ? { ...EMPTY_AUCTION_STATE, ...doc } : { ...EMPTY_AUCTION_STATE, tournamentId: fallbackTournamentId };
  const { _id: _ignored, createdAt: _createdAt, updatedAt: _updatedAt, __v: _version, ...rest } = merged as any;

  return {
    ...rest,
    tournamentId: toIdString(rest.tournamentId),
    currentPlayerId: rest.currentPlayerId ?? null,
    winningTeamId: rest.winningTeamId ?? null,
    history: Array.isArray(rest.history)
      ? rest.history.map((bid: any) => ({
          teamId: toIdString(bid.teamId),
          amount: toNumber(bid.amount),
          timestamp: toNumber(bid.timestamp),
        }))
      : [],
  };
};

const serializePlayer = (player: any): Player => {
  const { createdAt: _createdAt, updatedAt: _updatedAt, __v: _version, ...rest } = player || {};
  return {
    ...rest,
    _id: toIdString(player._id),
    tournamentId: toIdString(player.tournamentId),
    winningTeamId: player.winningTeamId ? toIdString(player.winningTeamId) : undefined,
  };
};

const serializeTeam = (team: any): Team => {
  const { createdAt: _createdAt, updatedAt: _updatedAt, __v: _version, ...rest } = team || {};
  return {
    ...rest,
    _id: toIdString(team._id),
    tournamentId: toIdString(team.tournamentId),
  };
};

export async function getAuctionBootstrapData(tournamentId?: string | null): Promise<AuctionBootstrapPayload> {
  await connectToDatabase();

  let tournamentDoc: Tournament | null = null;

  if (tournamentId) {
    tournamentDoc = (await TournamentModel.findById(tournamentId).lean()) as Tournament | null;
  } else {
    tournamentDoc = (await TournamentModel.findOne({ status: { $in: ['Live', 'Stopped'] } })
      .sort({ updatedAt: -1 })
      .lean()) as Tournament | null;
  }

  if (!tournamentDoc) {
    return {
      tournament: null,
      auctionState: { ...EMPTY_AUCTION_STATE },
      players: [],
      teams: [],
    };
  }

  const [auctionStateDoc, playersData, teamsData] = await Promise.all([
    AuctionStateModel.findOne({ tournamentId: tournamentDoc._id })
      .lean<AuctionState>()
      .exec(),
    PlayerModel.find({ tournamentId: tournamentDoc._id })
      .select('_id playerNo masterPlayerId tournamentId name position currentClub photoURL stats playerClass isSold finalPrice winningTeamId')
      .lean<any[]>()
      .exec(),
    TeamModel.find({ tournamentId: tournamentDoc._id })
      .select('_id tournamentId name shortCode ownerName logoURL initialBudget currentBalance playersPurchased')
      .lean<any[]>()
      .exec(),
  ]);

  const tournament = serializeTournament(tournamentDoc);
  const auctionState = serializeAuctionState(auctionStateDoc, tournament._id);
  const players = (playersData || []).map(serializePlayer);
  const teams = (teamsData || []).map(serializeTeam);

  return {
    tournament,
    auctionState,
    players,
    teams,
  };
}
