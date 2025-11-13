'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { User } from '@/types';

interface ExtendedUser extends User {
  isSelf?: boolean;
}

const UserManagementDashboard: React.FC = () => {
  const { data: session } = useSession();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Fetch users and tournaments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, tournamentsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/tournaments'),
        ]);

        if (!usersRes.ok || !tournamentsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const usersData = await usersRes.json();
        const tournamentsData = await tournamentsRes.json();

        // Mark current user
        const enrichedUsers = usersData.map((user: User) => ({
          ...user,
          isSelf: user.email === session?.user?.email,
        }));

        setUsers(enrichedUsers);
        setTournaments(tournamentsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if ((session?.user as any)?.role === 'admin') {
      fetchData();
    }
  }, [(session?.user as any)?.role, session?.user?.email]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error('Failed to update role');

      const data = await res.json();
      setUsers(users.map(u => u._id === userId ? { ...u, role: data.user.role as any } : u));
      if (selectedUser?._id === userId) {
        setSelectedUser({ ...selectedUser, role: data.user.role });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleAssignTournament = async (tournamentId: string, action: 'assign' | 'unassign') => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/users/${selectedUser._id}/tournaments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId, action }),
      });

      if (!res.ok) throw new Error(`Failed to ${action} tournament`);

      const data = await res.json();
      const updatedUser = { ...selectedUser, assignedTournaments: data.user.assignedTournaments };
      setSelectedUser(updatedUser);
      setUsers(users.map(u => u._id === selectedUser._id ? updatedUser : u));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} tournament`);
    }
  };

  if ((session?.user as any)?.role !== 'admin') {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Access Denied</h3>
        <p className="text-red-300">Only administrators can access the user management dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-neutral-800 rounded-lg h-12"></div>
        <div className="animate-pulse bg-neutral-800 rounded-lg h-64"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-sm text-red-400 hover:text-red-300 mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-700">
          <h2 className="text-xl font-bold">Manage Users</h2>
          <p className="text-sm text-neutral-400 mt-1">{users.length} user(s) registered</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Tournaments</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t border-neutral-700 hover:bg-neutral-700/30">
                  <td className="px-6 py-4">
                    <div className="font-semibold">
                      {user.name}
                      {user.isSelf && (
                        <span className="ml-2 text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded">
                          (You)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      disabled={updatingUserId === user._id || user.isSelf}
                      className="bg-neutral-700 border border-neutral-600 rounded px-3 py-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-neutral-400">{user.assignedTournaments.length}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowTournamentModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tournament Assignment Modal */}
      {showTournamentModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                Manage Tournaments for {selectedUser.name}
              </h3>
              <button
                onClick={() => setShowTournamentModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {tournaments.length === 0 ? (
                <p className="text-neutral-400 text-sm">No tournaments available</p>
              ) : (
                tournaments.map((tournament) => {
                  const isAssigned = selectedUser.assignedTournaments.includes(tournament._id);
                  return (
                    <div
                      key={tournament._id}
                      className="flex items-center justify-between bg-neutral-700/30 p-3 rounded border border-neutral-600"
                    >
                      <div>
                        <p className="font-semibold">{tournament.name}</p>
                        <p className="text-xs text-neutral-400">Year {tournament.year}</p>
                      </div>
                      <button
                        onClick={() =>
                          handleAssignTournament(
                            tournament._id,
                            isAssigned ? 'unassign' : 'assign'
                          )
                        }
                        className={`${
                          isAssigned
                            ? 'bg-red-600 hover:bg-red-500'
                            : 'bg-green-600 hover:bg-green-500'
                        } text-white text-sm font-medium px-3 py-1 rounded transition-colors`}
                      >
                        {isAssigned ? 'Unassign' : 'Assign'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setShowTournamentModal(false)}
              className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-medium py-2 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementDashboard;
