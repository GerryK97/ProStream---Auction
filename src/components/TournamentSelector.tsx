'use client';

import React from 'react';
import { useTournamentContext } from '@/contexts/TournamentContext';

interface TournamentSelectorProps {
  label?: string;
  className?: string;
}

export default function TournamentSelector({
  label = "Select Tournament",
  className = ""
}: TournamentSelectorProps) {
  const {
    selectedTournamentId,
    setSelectedTournamentId,
    tournaments,
    loading
  } = useTournamentContext();

  const ALLOWED_STATUSES = new Set(['Draft', 'Live', 'Stopped', 'Completed']);
  const selectableTournaments = tournaments.filter((t) => ALLOWED_STATUSES.has(t.status));

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Live':
        return 'bg-green-500 text-white';
      case 'Stopped':
        return 'bg-yellow-500 text-white';
      case 'Draft':
        return 'bg-gray-400 text-white';
      case 'Completed':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className={`tournament-selector ${className}`}>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
        <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading tournaments...</div>
      </div>
    );
  }

  return (
    <div className={`tournament-selector ${className}`}>
      <label htmlFor="tournament-select" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <div className="flex items-center gap-3">
        <select
          id="tournament-select"
          value={selectedTournamentId || ''}
          onChange={(e) => setSelectedTournamentId(e.target.value || null)}
          className="flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)'
          }}
        >
          <option value="">-- {label} --</option>
          {selectableTournaments.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name} ({t.status})
            </option>
          ))}
        </select>

        {selectedTournamentId && (
          <button
            onClick={() => setSelectedTournamentId(null)}
            className="px-3 py-2 text-sm rounded-md transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)'
            }}
            title="Clear selection"
          >
            Clear
          </button>
        )}
      </div>

      {selectedTournamentId && selectableTournaments.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Status:</span>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeColor(
              selectableTournaments.find((t) => t._id === selectedTournamentId)?.status || ''
            )}`}
          >
            {selectableTournaments.find((t) => t._id === selectedTournamentId)?.status}
          </span>
        </div>
      )}

      {selectableTournaments.length === 0 && (
        <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No tournaments available. Create a tournament to get started.
        </p>
      )}
    </div>
  );
}
