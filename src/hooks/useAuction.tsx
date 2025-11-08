'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Tournament, Team, Player, AuctionState, Bid, OverlayTemplate, OverlayStyles, PlayerStats, OverlayInstance } from '@/types';

// --- MOCK DATA ---
const MOCK_TOURNAMENTS: Tournament[] = [
  { _id: 't1', name: 'LPL 2025', year: 2025, budgetPerTeam: 500000, squadSize: 5, basePricePerPlayer: 5000, logoURL: 'https://placehold.co/64x64/E01A36/FFFFFF/png?text=LPL', status: 'Completed' },
  { _id: 't2', name: 'IPL 2025', year: 2025, budgetPerTeam: 500000, squadSize: 10, basePricePerPlayer: 5000, logoURL: 'https://placehold.co/64x64/004B8D/FFFFFF/png?text=IPL', status: 'Draft' },
  { _id: 't3', name: 'ipl 2025', year: 2025, budgetPerTeam: 500000, squadSize: 4, basePricePerPlayer: 5000, logoURL: 'https://placehold.co/64x64/004B8D/FFFFFF/png?text=ipl', status: 'Draft' },
];

const MOCK_TEAMS: Team[] = [
    { _id: 'team1', tournamentId: 't1', name: 'Wariyapola', shortCode: 'WCC', ownerName: 'Masan', initialBudget: 10000000, currentBalance: 8500000, playersPurchased: ['p1'], logoURL: 'https://placehold.co/64/E879F9/111827/png?text=W', primaryColor: '#FF0000', secondaryColor: '#0000FF' },
    { _id: 'team2', tournamentId: 't1', name: 'Chilaw', shortCode: 'CCC', ownerName: 'Sandun', initialBudget: 10000000, currentBalance: 7500000, playersPurchased: ['p2'], logoURL: 'https://placehold.co/64/F472B6/111827/png?text=C', primaryColor: '#00FF00', secondaryColor: '#FFFF00' },
    { _id: 'team3', tournamentId: 't1', name: 'Matara', shortCode: 'MCC', ownerName: 'Kumar', initialBudget: 10000000, currentBalance: 9200000, playersPurchased: ['p3'], logoURL: 'https://placehold.co/64/A78BFA/111827/png?text=M', primaryColor: '#0000FF', secondaryColor: '#FF0000' },
    { _id: 'team4', tournamentId: 't1', name: 'Galle', shortCode: 'GCC', ownerName: 'Madu', initialBudget: 10000000, currentBalance: 6800000, playersPurchased: ['p4'], logoURL: 'https://placehold.co/64/FBBF24/111827/png?text=G', primaryColor: '#FFFF00', secondaryColor: '#00FF00' },
    { _id: 'team5', tournamentId: 't1', name: 'Colombo', shortCode: 'COL', ownerName: 'Kumara', initialBudget: 10000000, currentBalance: 10000000, playersPurchased: [], logoURL: 'https://placehold.co/64/34D399/111827/png?text=CO', primaryColor: '#34D399', secondaryColor: '#06B6D4' },
    { _id: 'team6', tournamentId: 't1', name: 'Mannar', shortCode: 'MAN', ownerName: 'Kuyil', initialBudget: 10000000, currentBalance: 10000000, playersPurchased: [], logoURL: 'https://placehold.co/64/60A5FA/111827/png?text=MA', primaryColor: '#60A5FA', secondaryColor: '#818CF8' },
    { _id: 'team7', tournamentId: 't1', name: 'Jaffna', shortCode: 'JCC', ownerName: 'Kili', initialBudget: 10000000, currentBalance: 10000000, playersPurchased: [], logoURL: 'https://placehold.co/64/F43F5E/111827/png?text=J', primaryColor: '#F43F5E', secondaryColor: '#EC4899' },
    { _id: 'team8', tournamentId: 't1', name: 'Puttalam', shortCode: 'PCC', ownerName: 'Nimal', initialBudget: 10000000, currentBalance: 10000000, playersPurchased: [], logoURL: 'https://placehold.co/64/8B5CF6/111827/png?text=P', primaryColor: '#8B5CF6', secondaryColor: '#D946EF' },
];

const MOCK_PLAYERS: Player[] = [
  { _id: 'p1', tournamentId: 't1', name: 'Shadow', stats: { matchesPlayed: 50, totalScore: 1200, totalWickets: 5 }, imageURL: 'https://picsum.photos/seed/shadow/200', isSold: false },
  { _id: 'p2', tournamentId: 't1', name: 'Vortex', stats: { matchesPlayed: 65, totalScore: 850, totalWickets: 75 }, imageURL: 'https://picsum.photos/seed/vortex/200', isSold: false },
  { _id: 'p3', tournamentId: 't1', name: 'Blitz', stats: { matchesPlayed: 45, totalScore: 1500, totalWickets: 10 }, imageURL: 'https://picsum.photos/seed/blitz/200', isSold: false },
  { _id: 'p4', tournamentId: 't1', name: 'Rogue', stats: { matchesPlayed: 55, totalScore: 980, totalWickets: 30 }, imageURL: 'https://picsum.photos/seed/rogue/200', isSold: false }
];

const MOCK_AUCTION_STATE: AuctionState = {
  tournamentId: 't1',
  currentPlayerId: null,
  currentBid: 0,
  winningTeamId: null,
  currentAuctionStatus: 'Pending',
  history: [],
};

const MOCK_OVERLAY_TEMPLATES: OverlayTemplate[] = [
    {
        _id: 'template1',
        name: 'Classic',
        description: 'Traditional auction overlay with player photo, bid details, and team footer. Perfect for standard broadcasts.',
        imageURL: 'https://picsum.photos/seed/classic/400/225',
        tags: ['Traditional', 'Standard', 'Clean'],
        isPremium: false,
        styles: {
            playerCard: { backgroundColor: 'rgba(0, 0, 0, 0.6)', borderColor: '#4F46E5', textColor: '#FFFFFF', statLabelColor: '#E5E7EB' },
            teamCard: { backgroundColor: 'rgba(0, 0, 0, 0.6)', borderColor: '#374151', textColor: '#FFFFFF', balanceColor: '#10B981' },
            bidInfo: { textColor: '#E5E7EB', bidAmountColor: '#10B981' },
            fontFamily: 'sans-serif'
        }
    },
    {
        _id: 'template2',
        name: 'Modern Glass',
        description: 'Sleek modern design with glassmorphism effects, gradient backgrounds, and smooth animations.',
        imageURL: 'https://picsum.photos/seed/modernglass/400/225',
        tags: ['Modern', 'Glassmorphism', 'Premium', 'Animated'],
        isPremium: true,
        styles: {
            playerCard: { backgroundColor: 'rgba(20, 10, 40, 0.7)', borderColor: '#EC4899', textColor: '#F3F4F6', statLabelColor: '#A5B4FC' },
            teamCard: { backgroundColor: 'rgba(20, 10, 40, 0.7)', borderColor: '#6366F1', textColor: '#F3F4F6', balanceColor: '#34D399' },
            bidInfo: { textColor: '#D1D5DB', bidAmountColor: '#F472B6' },
            fontFamily: 'monospace'
        }
    },
     {
        _id: 'template3',
        name: 'Minimal Clean',
        description: 'Clean, distraction-free design with large typography and lots of whitespace. Ideal for chromakey.',
        imageURL: 'https://picsum.photos/seed/minimalclean/400/225',
        tags: ['Minimal', 'Clean', 'Chromakey', 'Simple'],
        isPremium: false,
        styles: {
            playerCard: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: '#10B981', textColor: '#111827', statLabelColor: '#4B5563' },
            teamCard: { backgroundColor: 'rgba(255, 255, 255, 0)', borderColor: '#E5E7EB', textColor: '#1F2937', balanceColor: '#111827' },
            bidInfo: { textColor: '#374151', bidAmountColor: '#10B981' },
            fontFamily: 'system-ui'
        }
    },
];

const MOCK_OVERLAY_INSTANCES: OverlayInstance[] = [
    {
        _id: 'instance_master_1',
        name: 'Master Auction Overlay',
        templateName: 'Master Auction Overlay',
        status: 'Active',
        url: typeof window !== 'undefined'
            ? `http://${window.location.host}/overlays/a01c1fce7fbbf343a6c343c27c497328`
            : 'http://localhost:3000/overlays/a01c1fce7fbbf343a6c343c27c497328'
    }
];

// --- CONTEXT & PROVIDER ---
export type StyleObjectParts = {
  [K in keyof OverlayStyles]: OverlayStyles[K] extends object ? K : never;
}[keyof OverlayStyles];

interface AuctionContextType {
  tournament: Tournament | null;
  tournaments: Tournament[];
  teams: Team[];
  players: Player[];
  auctionState: AuctionState;
  overlayTemplates: OverlayTemplate[];
  overlayInstances: OverlayInstance[];
  activeTemplate: OverlayTemplate | undefined;
  addTournament: (tournamentData: Omit<Tournament, '_id' | 'status'>) => void;
  updateTournament: (tournamentId: string, tournamentData: Partial<Omit<Tournament, '_id'>>) => void;
  deleteTournament: (tournamentId: string) => void;
  setTournamentStatus: (status: Tournament['status']) => void;
  addPlayer: (playerData: Omit<Player, '_id' | 'tournamentId' | 'isSold'>) => void;
  updatePlayer: (playerId: string, playerData: Partial<Omit<Player, '_id' | 'tournamentId' | 'isSold'>>) => void;
  deletePlayer: (playerId: string) => void;
  addTeam: (teamData: Omit<Team, '_id' | 'tournamentId' | 'initialBudget' | 'currentBalance' | 'playersPurchased'>) => void;
  updateTeam: (teamId: string, teamData: Partial<Omit<Team, '_id' | 'tournamentId'>>) => void;
  deleteTeam: (teamId: string) => void;
  placeBid: (teamId: string, amount: number) => string | null;
  selectNextPlayer: () => void;
  sellCurrentPlayer: () => string | null;
  undoLastAction: () => void;
  setActiveTemplateId: (id: string) => void;
  updateTemplateStyles: (templateId: string, newStyles: Partial<OverlayStyles[StyleObjectParts]>, part: StyleObjectParts) => void;
  selectSpecificPlayer: (playerId: string) => void;
  resetCurrentAuction: () => void;
  resetAllSales: () => void;
  createOverlayInstance: (template: OverlayTemplate, name: string) => void;
  deleteOverlayInstance: (instanceId: string) => void;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(MOCK_TOURNAMENTS);
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);
  const [auctionState, setAuctionState] = useState<AuctionState>(MOCK_AUCTION_STATE);
  const [overlayTemplates, setOverlayTemplates] = useState<OverlayTemplate[]>(MOCK_OVERLAY_TEMPLATES);
  const [overlayInstances, setOverlayInstances] = useState<OverlayInstance[]>(MOCK_OVERLAY_INSTANCES);
  const [activeTemplateId, setActiveTemplateId] = useState<string>(MOCK_OVERLAY_TEMPLATES[0]._id);

  const activeTemplate = useMemo(() => overlayTemplates.find(t => t._id === activeTemplateId), [overlayTemplates, activeTemplateId]);
  
  // For backwards compatibility, expose the first tournament as `tournament`
  const tournament = useMemo(() => tournaments.length > 0 ? tournaments[0] : null, [tournaments]);

  const addTournament = useCallback((tournamentData: Omit<Tournament, '_id' | 'status'>) => {
    const newTournament: Tournament = {
      ...tournamentData,
      _id: `t${Date.now()}`,
      status: 'Draft',
    };
    setTournaments(prev => [newTournament, ...prev]);
  }, []);

  const updateTournament = useCallback((tournamentId: string, tournamentData: Partial<Omit<Tournament, '_id'>>) => {
    setTournaments(prev => prev.map(t => t._id === tournamentId ? { ...t, ...tournamentData } : t));
  }, []);

  const deleteTournament = useCallback((tournamentId: string) => {
    setTournaments(prev => prev.filter(t => t._id !== tournamentId));
  }, []);

  const setTournamentStatus = useCallback((status: Tournament['status']) => {
    // This function might need adjustment if it should target a specific tournament
    if (tournaments.length > 0) {
        setTournaments(prev => {
            const newTournaments = [...prev];
            newTournaments[0] = { ...newTournaments[0], status };
            return newTournaments;
        });
        if(status !== 'Live'){
            setAuctionState(prev => ({ ...prev, currentAuctionStatus: 'Pending', currentPlayerId: null, currentBid: 0, winningTeamId: null, history: [] }));
        }
    }
  }, [tournaments]);

  const addPlayer = useCallback((playerData: Omit<Player, '_id' | 'tournamentId' | 'isSold'>) => {
    if (!tournament) return;
    const newPlayer: Player = {
        ...playerData,
        _id: `p${Date.now()}`,
        tournamentId: tournament._id,
        isSold: false,
    };
    setPlayers(prev => [...prev, newPlayer]);
  }, [tournament]);

  const updatePlayer = useCallback((playerId: string, playerData: Partial<Omit<Player, '_id' | 'tournamentId' | 'isSold'>>) => {
    setPlayers(prevPlayers => prevPlayers.map(player => 
        player._id === playerId ? { ...player, ...playerData } : player
    ));
  }, []);

  const deletePlayer = useCallback((playerId: string) => {
    setPlayers(prevPlayers => prevPlayers.filter(player => player._id !== playerId));
  }, []);

  const addTeam = useCallback((teamData: Omit<Team, '_id' | 'tournamentId' | 'initialBudget' | 'currentBalance' | 'playersPurchased'>) => {
    if (!tournament) return;
    const newTeam: Team = {
        ...teamData,
        _id: `team${Date.now()}`,
        tournamentId: tournament._id,
        initialBudget: tournament.budgetPerTeam,
        currentBalance: tournament.budgetPerTeam,
        playersPurchased: [],
        logoURL: teamData.logoURL || `https://placehold.co/64/4B5563/FFFFFF/png?text=${teamData.shortCode || teamData.name.charAt(0)}`,
    };
    setTeams(prev => [newTeam, ...prev]);
  }, [tournament]);

  const updateTeam = useCallback((teamId: string, teamData: Partial<Omit<Team, '_id' | 'tournamentId'>>) => {
    setTeams(prevTeams => prevTeams.map(team =>
        team._id === teamId ? { ...team, ...teamData } : team
    ));
  }, []);

  const deleteTeam = useCallback((teamId: string) => {
    setTeams(prev => prev.filter(t => t._id !== teamId));
  }, []);

  const placeBid = useCallback((teamId: string, amount: number): string | null => {
    const { currentPlayerId } = auctionState;
    if (tournament?.status !== 'Live' || auctionState.currentAuctionStatus === 'Sold') return "Auction is not live or player is already sold.";
    
    const team = teams.find(t => t._id === teamId);
    const player = players.find(p => p._id === currentPlayerId);

    if (!team) return "Team not found.";
    if (!player) return "No player is up for auction.";
    if (!tournament) return "No tournament configured.";
    if (amount <= auctionState.currentBid) return "Bid must be higher than the current bid.";
    if (auctionState.currentBid === 0 && amount < tournament.basePricePerPlayer) return `The first bid must be at least the base price of ${tournament.basePricePerPlayer.toLocaleString()}.`;
    if (amount > (team.currentBalance || 0)) return "Team does not have enough balance for this bid.";

    const newBid: Bid = { teamId, amount, timestamp: Date.now() };
    setAuctionState(prev => ({
      ...prev,
      currentBid: amount,
      winningTeamId: teamId,
      currentAuctionStatus: 'Bidding',
      history: [...prev.history, newBid]
    }));
    return null;
  }, [auctionState, teams, players, tournament]);
  
  const selectNextPlayer = useCallback(() => {
    if (tournament?.status !== 'Live') return;
    const unsoldPlayer = players.find(p => !p.isSold);
    if (unsoldPlayer) {
      setAuctionState(prev => ({
        ...prev,
        currentPlayerId: unsoldPlayer._id,
        currentBid: 0,
        winningTeamId: null,
        currentAuctionStatus: 'Pending',
        history: [],
      }));
    } else {
      // No more unsold players
      setAuctionState(prev => ({...prev, currentPlayerId: null}));
      setTournamentStatus('Completed');
    }
  }, [players, tournament, setTournamentStatus]);
  
  const selectSpecificPlayer = useCallback((playerId: string) => {
    if (auctionState.currentAuctionStatus === 'Bidding') return;
    const playerToAuction = players.find(p => p._id === playerId && !p.isSold);
    if (playerToAuction) {
        setAuctionState(prev => ({
            ...prev,
            currentPlayerId: playerToAuction._id,
            currentBid: 0,
            winningTeamId: null,
            currentAuctionStatus: 'Pending',
            history: [],
        }));
    }
  }, [players, auctionState.currentAuctionStatus]);
  
  const resetCurrentAuction = useCallback(() => {
    if (!auctionState.currentPlayerId) return;
    setAuctionState(prev => ({
        ...prev,
        currentBid: 0,
        winningTeamId: null,
        currentAuctionStatus: 'Pending',
        history: [],
    }));
  }, [auctionState.currentPlayerId]);

  const resetAllSales = useCallback(() => {
    setPlayers(prev => prev.map(p => ({
        ...p,
        isSold: false,
        finalPrice: undefined,
        winningTeamId: undefined,
    })));
    setTeams(prev => prev.map(t => ({
        ...t,
        currentBalance: t.initialBudget,
        playersPurchased: [],
    })));
    setAuctionState(prev => ({
        ...prev,
        currentPlayerId: null,
        currentBid: 0,
        winningTeamId: null,
        currentAuctionStatus: 'Pending',
        history: [],
    }));
  }, []);

  const sellCurrentPlayer = useCallback((): string | null => {
    const { currentPlayerId, winningTeamId, currentBid } = auctionState;
    if (!currentPlayerId || !winningTeamId || currentBid === 0) return "No valid bid to sell.";
    if (tournament?.status !== 'Live') return "Auction is not live.";

    setPlayers(prevPlayers => prevPlayers.map(p => 
      p._id === currentPlayerId ? { ...p, isSold: true, finalPrice: currentBid, winningTeamId } : p
    ));

    setTeams(prevTeams => prevTeams.map(t =>
      t._id === winningTeamId ? { ...t, currentBalance: (t.currentBalance || 0) - currentBid, playersPurchased: [...(t.playersPurchased || []), currentPlayerId] } : t
    ));

    setAuctionState(prev => ({ ...prev, currentAuctionStatus: 'Sold' }));
    return null;
  }, [auctionState, tournament]);
  
  const undoLastAction = useCallback(() => {
    const lastSoldPlayer = players.find(p => p._id === auctionState.currentPlayerId && p.isSold);
    if (!lastSoldPlayer || !lastSoldPlayer.winningTeamId || lastSoldPlayer.finalPrice === undefined) return;
    
    const { _id: playerId, winningTeamId, finalPrice } = lastSoldPlayer;

    setPlayers(prev => prev.map(p => 
      p._id === playerId ? { ...p, isSold: false, finalPrice: undefined, winningTeamId: undefined } : p
    ));

    setTeams(prev => prev.map(t =>
      t._id === winningTeamId ? { ...t, currentBalance: (t.currentBalance || 0) + finalPrice, playersPurchased: (t.playersPurchased || []).filter(pId => pId !== playerId) } : t
    ));

     setAuctionState(prev => ({
        ...prev,
        currentBid: 0,
        winningTeamId: null,
        currentAuctionStatus: 'Pending',
        history: [],
      }));

  }, [players, auctionState.currentPlayerId]);

  const updateTemplateStyles = useCallback((templateId: string, newStyles: Partial<OverlayStyles[StyleObjectParts]>, part: StyleObjectParts) => {
    setOverlayTemplates(prev => prev.map(t => {
      if (t._id === templateId) {
        return {
          ...t,
          styles: {
            ...t.styles,
            [part]: {
              ...t.styles[part],
              ...newStyles
            }
          }
        };
      }
      return t;
    }));
  }, []);

  const createOverlayInstance = useCallback((template: OverlayTemplate, name: string) => {
      const newInstance: OverlayInstance = {
          _id: `instance_${Date.now()}`,
          name,
          templateName: template.name,
          status: 'Active',
          url: `http://${window.location.host}/#/overlay/${Math.random().toString(36).substring(2)}`
      };
      setOverlayInstances(prev => [newInstance, ...prev]);
  }, []);

  const deleteOverlayInstance = useCallback((instanceId: string) => {
      setOverlayInstances(prev => prev.filter(instance => instance._id !== instanceId));
  }, []);

  const value = useMemo(() => ({
    tournament, tournaments, teams, players, auctionState, overlayTemplates, overlayInstances, activeTemplate, addTournament, updateTournament, deleteTournament, addPlayer, updatePlayer, deletePlayer, addTeam, updateTeam, deleteTeam, setTournamentStatus, placeBid, selectNextPlayer, sellCurrentPlayer, undoLastAction, setActiveTemplateId, updateTemplateStyles,
    selectSpecificPlayer, resetCurrentAuction, resetAllSales, createOverlayInstance, deleteOverlayInstance
  }), [tournament, tournaments, teams, players, auctionState, overlayTemplates, overlayInstances, activeTemplate, addTournament, updateTournament, deleteTournament, addPlayer, updatePlayer, deletePlayer, addTeam, updateTeam, deleteTeam, setTournamentStatus, placeBid, selectNextPlayer, sellCurrentPlayer, undoLastAction, setActiveTemplateId, updateTemplateStyles, selectSpecificPlayer, resetCurrentAuction, resetAllSales, createOverlayInstance, deleteOverlayInstance]);

  return <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>;
};

export const useAuction = (): AuctionContextType => {
  const context = useContext(AuctionContext);
  if (context === undefined) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};