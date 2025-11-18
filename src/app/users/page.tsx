'use client';

import Navigation from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface EditingUser extends User {
  // Same as User, used for edit modal
}

interface Tournament {
  _id: string;
  name: string;
}

export default function UsersPage() {
  const { user: currentUser, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [availableTournaments, setAvailableTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'all'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [editFormData, setEditFormData] = useState({
    email: '',
    role: 'Audience',
    status: 'Active',
    assignedTournaments: [] as string[],
  });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Audience',
    status: 'Active',
  });

  // Check authorization
  useEffect(() => {
    if (!authLoading && currentUser?.role !== 'Admin') {
      router.push('/auth/unauthorized');
    }
  }, [currentUser, authLoading, router]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;

      try {
        setIsLoading(true);
        setError('');

        // Fetch all users
        const usersResponse = await fetch('/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }

        const usersData = await usersResponse.json();
        setUsers(usersData.data);

        // Fetch pending users
        const pendingResponse = await fetch('/api/users/approve', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          setPendingUsers(pendingData.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      // Reset form and close modal
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'Audience',
        status: 'Active',
      });
      setShowCreateModal(false);

      // Refresh users list
      const updatedResponse = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedData = await updatedResponse.json();
      setUsers(updatedData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!token) return;

    try {
      const response = await fetch('/api/users/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, approve: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve user');
      }

      // Remove from pending and add to active
      setPendingUsers(pendingUsers.filter((u) => u._id !== userId));
      const updatedResponse = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedData = await updatedResponse.json();
      setUsers(updatedData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!token) return;

    try {
      const response = await fetch('/api/users/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, approve: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject user');
      }

      setPendingUsers(pendingUsers.filter((u) => u._id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject user');
    }
  };

  const handleEditClick = async (user: User) => {
    setEditingUser(user);

    // Fetch available tournaments
    try {
      if (!token) return;
      const response = await fetch('/api/tournaments', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const tournaments = await response.json();
        setAvailableTournaments(tournaments);
      }
    } catch (err) {
      console.error('Failed to fetch tournaments:', err);
    }

    setEditFormData({
      email: user.email,
      role: user.role,
      status: user.status,
      assignedTournaments: (user as any).assignedTournaments || [],
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      // Reset and close modal
      setShowEditModal(false);
      setEditingUser(null);
      setEditFormData({
        email: '',
        role: 'Audience',
        status: 'Active',
        assignedTournaments: [],
      });

      // Refresh users list
      const updatedResponse = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedData = await updatedResponse.json();
      setUsers(updatedData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      // Refresh users list
      const updatedResponse = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedData = await updatedResponse.json();
      setUsers(updatedData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Navigation />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (currentUser?.role !== 'Admin') {
    return null;
  }

  const displayUsers = activeTab === 'pending' ? pendingUsers : activeTab === 'all' ? [...users, ...pendingUsers] : users.filter((u) => u.status === 'Active');

  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <Navigation />

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
            <p className="text-neutral-400">Manage users and control access</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            + Create User
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded text-red-400">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b border-neutral-700">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-4 font-semibold transition-colors ${
              activeTab === 'active'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Active Users ({users.filter((u) => u.status === 'Active').length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-4 font-semibold transition-colors ${
              activeTab === 'pending'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Pending Approval ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-4 font-semibold transition-colors ${
              activeTab === 'all'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Users ({users.length + pendingUsers.length})
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-400">Loading users...</div>
          ) : displayUsers.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              {activeTab === 'pending' ? 'No pending users' : 'No users found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-900 border-b border-neutral-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Username</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.map((u) => (
                    <tr key={u._id} className="border-b border-neutral-700 hover:bg-neutral-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">{u.username}</td>
                      <td className="px-6 py-4 text-sm">{u.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            u.status === 'Active'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        {u.status === 'PendingApproval' && (
                          <>
                            <button
                              onClick={() => handleApproveUser(u._id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectUser(u._id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEditClick(u)}
                          className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Create New User</h2>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Tournament">Tournament Manager</option>
                    <option value="MasterManager">Master Data Manager</option>
                    <option value="Team">Team Manager</option>
                    <option value="Player">Player</option>
                    <option value="Audience">Audience</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Edit User: {editingUser.username}</h2>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Tournament">Tournament Manager</option>
                    <option value="MasterManager">Master Data Manager</option>
                    <option value="Team">Team Manager</option>
                    <option value="Player">Player</option>
                    <option value="Audience">Audience</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="PendingApproval">Pending Approval</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Assign Tournaments</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto bg-neutral-700 border border-neutral-600 rounded p-3">
                    {availableTournaments.length > 0 ? (
                      availableTournaments.map((tournament) => (
                        <label key={tournament._id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editFormData.assignedTournaments.includes(tournament._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditFormData({
                                  ...editFormData,
                                  assignedTournaments: [...editFormData.assignedTournaments, tournament._id],
                                });
                              } else {
                                setEditFormData({
                                  ...editFormData,
                                  assignedTournaments: editFormData.assignedTournaments.filter(
                                    (id) => id !== tournament._id
                                  ),
                                });
                              }
                            }}
                            className="w-4 h-4 rounded border-neutral-500 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-100">{tournament.name}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No tournaments available</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                    }}
                    className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
