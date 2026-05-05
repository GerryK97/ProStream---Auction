'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tournament } from '@/types';
import { getAuthHeaders } from '@/lib/api-client';
import { useAuth } from './AuthContext';

interface TournamentContextType {
  selectedTournamentId: string | null;
  setSelectedTournamentId: (id: string | null) => void;
  selectedTournament: Tournament | null;
  tournaments: Tournament[];
  setTournaments: React.Dispatch<React.SetStateAction<Tournament[]>>;
  loading: boolean;
  refreshTournaments: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

interface TournamentProviderProps {
  children: ReactNode;
}

export function TournamentProvider({ children }: TournamentProviderProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedTournamentId, setSelectedTournamentIdState] = useState<string | null>(
    () => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('selectedTournamentId');
      }
      return null;
    }
  );
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  // Persist to localStorage when selection changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedTournamentId) {
        localStorage.setItem('selectedTournamentId', selectedTournamentId);
      } else {
        localStorage.removeItem('selectedTournamentId');
      }
    }
  }, [selectedTournamentId]);

  // Fetch tournaments
  const refreshTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tournaments', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        const list: Tournament[] = Array.isArray(data) ? data : [];
        setTournaments(list);
        // Clear stale selection if the tournament is no longer accessible
        setSelectedTournamentIdState(prev =>
          prev && !list.find(t => t._id === prev) ? null : prev
        );
      } else {
        console.error('Failed to fetch tournaments');
        setTournaments([]);
        setSelectedTournamentIdState(null);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when authentication is ready
  useEffect(() => {
    // Only fetch tournaments when auth is loaded and user is authenticated
    if (!authLoading && isAuthenticated) {
      refreshTournaments();
    } else if (!authLoading && !isAuthenticated) {
      // User is not authenticated, clear tournaments
      setTournaments([]);
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const selectedTournament = tournaments.find(t => t._id === selectedTournamentId) || null;

  const setSelectedTournamentId = (id: string | null) => {
    setSelectedTournamentIdState(id);
  };

  return (
    <TournamentContext.Provider
      value={{
        selectedTournamentId,
        setSelectedTournamentId,
        selectedTournament,
        tournaments,
        setTournaments,
        loading,
        refreshTournaments,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournamentContext() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournamentContext must be used within TournamentProvider');
  }
  return context;
}
