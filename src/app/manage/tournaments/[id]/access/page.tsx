'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeaders } from '@/lib/api-client';

interface AccessUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: string;
}

interface AllUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: string;
}

function TournamentAccessPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params.id as string;
  const { user: currentUser } = useAuth();

  const [tournamentName, setTournamentName] = useState('');
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>([]);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tournamentRes, accessRes, usersRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`, { headers: getAuthHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/access`, { headers: getAuthHeaders() }),
        fetch('/api/users?limit=200', { headers: getAuthHeaders() }),
      ]);

      if (!tournamentRes.ok) throw new Error('Tournament not found');
      const tournamentData = await tournamentRes.json();
      setTournamentName(tournamentData.name ?? tournamentData._id);

      if (!accessRes.ok) throw new Error('Failed to fetch access list');
      const accessData = await accessRes.json();
      setAccessUsers(accessData.users ?? []);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const list: AllUser[] = usersData.data ?? usersData ?? [];
        // Exclude admin users â€” they always have access
        setAllUsers(list.filter((u) => u.role !== 'Admin'));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGrant = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/access`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, action: 'grant' }),
      });
      const data = await res.json();
      if (!res.ok) { setActionError(data.error || 'Failed to grant access'); return; }
      setSelectedUserId('');
      setSearch('');
      await fetchData();
    } catch {
      setActionError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (userId: string) => {
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/access`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'revoke' }),
      });
      const data = await res.json();
      if (!res.ok) { setActionError(data.error || 'Failed to revoke access'); return; }
      await fetchData();
    } catch {
      setActionError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Users that don't already have access â€” available to grant
  const accessUserIds = new Set(accessUsers.map((u) => u._id));
  const availableUsers = allUsers.filter(
    (u) =>
      !accessUserIds.has(u._id) &&
      (search.trim() === '' ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const getRoleBadge = (role: string) => {
    const map: Record<string, string> = {
      Tournament: 'bg-blue-700 text-blue-100',
      Player: 'bg-green-700 text-green-100',
      Audience: 'bg-gray-600 text-gray-300',
    };
    return map[role] || 'bg-gray-600 text-gray-300';
  };

  const getStatusDot = (status: string) => {
    if (status === 'Active') return 'bg-green-500';
    if (status === 'Suspended') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-red-400">Access denied â€” Admin only</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/manage/tournaments')}
            className="text-gray-400 hover:text-white text-sm"
          >
            â† Tournaments
          </button>
          <span className="text-gray-600">/</span>
          <span className="text-gray-300 text-sm truncate">{tournamentName || tournamentId}</span>
          <span className="text-gray-600">/</span>
          <span className="text-white text-sm font-medium">Access</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>ðŸ”’</span>
            Tournament Access
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Control which users can view and manage <span className="text-white font-medium">{tournamentName}</span>
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 mb-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Users with access */}
            <div className="bg-gray-800 rounded-lg mb-6">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-white font-semibold">Users with Access</h2>
                <span className="text-gray-400 text-sm">{accessUsers.length} user{accessUsers.length !== 1 ? 's' : ''}</span>
              </div>

              {accessUsers.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-yellow-400 font-medium">No users assigned</p>
                  <p className="text-gray-400 text-sm mt-1">
                    This tournament is invisible to all non-admin users. Grant access below.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-700">
                  {accessUsers.map((u) => (
                    <li key={u._id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${getStatusDot(u.status)}`}
                          title={u.status}
                        />
                        <div>
                          <p className="text-white font-medium">{u.username}</p>
                          <p className="text-gray-400 text-xs">{u.email}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRevoke(u._id)}
                        disabled={saving}
                        className="px-3 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded text-sm"
                      >
                        Remove Access
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Grant access */}
            <div className="bg-gray-800 rounded-lg">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-white font-semibold">Grant Access</h2>
                <p className="text-gray-400 text-xs mt-0.5">Search for a user and grant them access to this tournament</p>
              </div>
              <div className="p-4 space-y-3">
                {actionError && (
                  <div className="bg-red-900/30 border border-red-700 rounded p-3 text-red-300 text-sm">
                    {actionError}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedUserId(''); }}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500"
                />

                {search.trim() !== '' && availableUsers.length > 0 && (
                  <ul className="bg-gray-700 border border-gray-600 rounded divide-y divide-gray-600 max-h-48 overflow-y-auto">
                    {availableUsers.map((u) => (
                      <li
                        key={u._id}
                        onClick={() => { setSelectedUserId(u._id); setSearch(`${u.username} (${u.email})`); }}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-600 ${
                          selectedUserId === u._id ? 'bg-blue-700/30' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{u.username}</p>
                          <p className="text-gray-400 text-xs truncate">{u.email}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {search.trim() !== '' && availableUsers.length === 0 && !selectedUserId && (
                  <p className="text-gray-400 text-sm px-1">No matching users found (or all matching users already have access)</p>
                )}

                <button
                  onClick={handleGrant}
                  disabled={!selectedUserId || saving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium text-sm"
                >
                  {saving ? 'Saving...' : 'Grant Access'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TournamentAccessPageWrapper() {
  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <TournamentAccessPage />
    </ProtectedRoute>
  );
}
