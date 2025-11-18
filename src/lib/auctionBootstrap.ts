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

  const [auctionStateDoc, players, teams] = await Promise.all([
    AuctionStateModel.findOne({ tournamentId: tournamentDoc._id })
      .lean<AuctionState>()
      .exec(),
    PlayerModel.find({ tournamentId: tournamentDoc._id })
      .select('_id playerNo masterPlayerId tournamentId name position currentClub photoURL stats playerClass isSold finalPrice winningTeamId')
      .lean()
      .exec(),
    TeamModel.find({ tournamentId: tournamentDoc._id })
      .select('_id tournamentId name shortCode ownerName logoURL initialBudget currentBalance playersPurchased')
      .lean()
      .exec(),
  ]);

  const auctionState: AuctionState = auctionStateDoc
    ? { ...EMPTY_AUCTION_STATE, ...auctionStateDoc }
    : { ...EMPTY_AUCTION_STATE, tournamentId: tournamentDoc._id?.toString?.() ?? '' };

  return {
    tournament: tournamentDoc,
    auctionState,
    players: (players as Player[]) || [],
    teams: (teams as Team[]) || [],
  };
}
