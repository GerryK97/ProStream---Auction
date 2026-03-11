'use client';

import Navigation from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DeleteButton from '@/components/shared/DeleteButton';
import EditButton from '@/components/shared/EditButton';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  plan?: 'Free' | 'Standard' | 'Offer';
  assignedTournaments?: string[];
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
    role: 'Tournament',
    status: 'Active',
    assignedTournaments: [] as string[],
    plan: 'Free' as 'Free' | 'Standard' | 'Offer',
    newPassword: '',
  });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Tournament',
    status: 'Active',
    plan: 'Free' as 'Free' | 'Standard' | 'Offer',
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
        role: 'Tournament',
        status: 'Active',
        plan: 'Free',
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
      assignedTournaments: user.assignedTournaments || [],
      plan: (user.plan as any) || 'Free',
      newPassword: '',
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingUser) return;

    try {
      const { newPassword, ...restFormData } = editFormData;
      const response = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...restFormData,
          ...(newPassword ? { password: newPassword } : {}),
        }),
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
        role: 'Tournament',
        status: 'Active',
        assignedTournaments: [],
        plan: 'Free',
        newPassword: '',
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

  if (authLoading || (isLoading && users.length === 0 && pendingUsers.length === 0)) {
    return (
      <ProtectedRoute allowedRoles={['Admin']}>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
          <Navigation />
          <div className="pt-24">
            <div className="mx-auto max-w-7xl px-6 py-16 text-center" style={{ color: 'var(--text-tertiary)' }}>
              Loading user directory...
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (currentUser?.role !== 'Admin') {
    return null;
  }

  const displayUsers = activeTab === 'pending' ? pendingUsers : activeTab === 'all' ? [...users, ...pendingUsers] : users.filter((u) => u.status === 'Active');

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'Active').length;
  const pendingCount = pendingUsers.length;
  const adminCount = users.filter((u) => u.role === 'Admin').length;

  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
        <Navigation />
        <div className="pt-24">
          <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>User Management</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="font-bold py-2 px-4 rounded-lg text-sm transition-colors hover:opacity-80"
                style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
              >
                + Invite User
              </button>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-200">
                {error}
              </div>
            )}

            <div className="rounded-3xl p-4 backdrop-blur" style={{
              borderColor: 'var(--border-primary)',
              border: `1px solid var(--border-primary)`,
              backgroundColor: 'var(--surface-card)'
            }}>
              <div className="mb-6 flex flex-wrap gap-3">
                {[
                  { label: `Active Users (${activeUsers})`, value: 'active' },
                  { label: `Pending Approval (${pendingCount})`, value: 'pending' },
                  { label: `All Users (${totalUsers})`, value: 'all' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value as typeof activeTab)}
                    style={{
                      backgroundColor: activeTab === tab.value ? 'var(--brand-primary)' : 'transparent',
                      color: activeTab === tab.value ? '#fff' : 'var(--text-secondary)',
                      borderColor: 'var(--border-primary)',
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors border`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl" style={{
                borderColor: 'var(--border-primary)',
                border: `1px solid var(--border-primary)`
              }}>
                {isLoading ? (
                  <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>Loading users...</div>
                ) : displayUsers.length === 0 ? (
                  <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    {activeTab === 'pending' ? 'No pending users' : 'No users found'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead style={{
                        borderColor: 'var(--border-primary)',
                        borderBottom: `1px solid var(--border-primary)`,
                        backgroundColor: 'var(--surface-elevated)'
                      }}>
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
                          <tr key={u._id} style={{
                            borderColor: 'var(--border-primary)',
                            borderBottom: `1px solid var(--border-primary)`
                          }} className="hover:opacity-80 transition-opacity">
                            <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.username}</td>
                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className="px-3 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: 'color-mix(in oklab, var(--brand-primary) 22%, var(--surface-elevated))',
                                  color: 'var(--brand-primary)'
                                }}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className="px-3 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: u.status === 'Active'
                                    ? 'color-mix(in oklab, var(--status-success) 22%, var(--surface-elevated))'
                                    : 'color-mix(in oklab, var(--status-warning) 22%, var(--surface-elevated))',
                                  color: u.status === 'Active' ? 'var(--status-success)' : 'var(--status-warning)'
                                }}
                              >
                                {u.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm space-x-2">
                              {u.status === 'PendingApproval' && (
                                <>
                                  <button
                                    onClick={() => handleApproveUser(u._id)}
                                    className="px-3 py-1 rounded text-xs font-medium transition-colors hover:opacity-80"
                                    style={{ backgroundColor: 'var(--status-success)', color: '#fff' }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectUser(u._id)}
                                    className="px-3 py-1 rounded text-xs font-medium transition-colors hover:opacity-80"
                                    style={{ backgroundColor: 'var(--status-danger)', color: '#fff' }}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <EditButton
                                size="sm"
                                ariaLabel={`Edit user ${u.username}`}
                                onClick={() => handleEditClick(u)}
                                className="align-middle"
                              />
                              <DeleteButton
                                ariaLabel={`Delete user ${u.username}`}
                                onClick={() => handleDeleteUser(u._id)}
                                className="ml-2 align-middle"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'var(--backdrop)' }}>
                <div className="rounded-lg p-8 max-w-md w-full" style={{
                  borderColor: 'var(--border-primary)',
                  border: `1px solid var(--border-primary)`,
                  backgroundColor: 'var(--surface-elevated)'
                }}>
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Create New User</h2>

                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Username</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        style={{
                          backgroundColor: 'var(--surface-elevated)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                        className="w-full px-4 py-2 border rounded focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{
                          backgroundColor: 'var(--surface-elevated)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                        className="w-full px-4 py-2 border rounded focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        style={{
                          backgroundColor: 'var(--surface-elevated)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                        className="w-full px-4 py-2 border rounded focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        style={{
                          backgroundColor: 'var(--surface-elevated)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                        className="w-full px-4 py-2 border rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Tournament">Tournament Manager</option>
                        <option value="MasterManager">Master Data Manager</option>
                        <option value="Team">Team Manager</option>
                        <option value="Player">Player</option>
                        <option value="Audience">Audience</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Plan</label>
                        <select
                          value={formData.plan}
                          onChange={(e) => setFormData({ ...formData, plan: e.target.value as 'Free' | 'Standard' | 'Offer' })}
                          style={{
                            backgroundColor: 'var(--surface-elevated)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                          }}
                          className="w-full px-4 py-2 border rounded focus:outline-none focus:border-blue-500"
                        >
                          <option value="Free">Free</option>
                          <option value="Standard">Standard</option>
                          <option value="Offer">Offer (Monthly)</option>
                        </select>
                      </div>

                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        style={{
                          backgroundColor: 'var(--surface-hover)',
                          color: 'var(--text-primary)'
                        }}
                        className="flex-1 px-4 py-2 rounded transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 rounded transition-colors font-medium hover:opacity-80"
                        style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
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
              <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'var(--backdrop)' }}>
                <div className="rounded-lg p-8 max-w-md w-full" style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border-primary)',
                  border: `1px solid var(--border-primary)`
                }}>
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Edit User: {editingUser.username}</h2>

                  <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-4 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        New Password <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>(leave blank to keep unchanged)</span>
                      </label>
                      <input
                        type="password"
                        value={editFormData.newPassword}
                        onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                        className="w-full px-4 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        placeholder="Enter new password"
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Role</label>
                      <select
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                        className="w-full px-4 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
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
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="w-full px-4 py-2 rounded focus:outline-none"
                        style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                      >
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                        <option value="PendingApproval">Pending Approval</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Plan</label>
                        <select
                          value={editFormData.plan}
                          onChange={(e) => setEditFormData({ ...editFormData, plan: e.target.value as 'Free' | 'Standard' | 'Offer' })}
                          className="w-full px-4 py-2 rounded focus:outline-none"
                          style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        >
                          <option value="Free">Free</option>
                          <option value="Standard">Standard</option>
                          <option value="Offer">Offer (Monthly)</option>
                        </select>
                      </div>

                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Assign Tournaments</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto rounded p-3" style={{ backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-primary)' }}>
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
                                className="w-4 h-4 rounded"
                                style={{ borderColor: 'var(--border-primary)' }}
                              />
                              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{tournament.name}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No tournaments available</p>
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
                        className="flex-1 px-4 py-2 rounded transition-colors"
                        style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 rounded transition-colors font-medium hover:opacity-80"
                        style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
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
      </div>
    </ProtectedRoute>
  );
}
