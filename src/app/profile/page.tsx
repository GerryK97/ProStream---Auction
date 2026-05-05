'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeaders } from '@/lib/api-client';
import ImageUpload from '@/components/ImageUpload';

interface ProfileFormState {
  username: string;
  email: string;
  logoURL: string;
  mobileNumber: string;
}

function ProfilePageContent() {
  const { user, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileFormState>({
    username: '',
    email: '',
    logoURL: '',
    mobileNumber: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/users/profile', { headers: getAuthHeaders() });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load profile');
        }

        setForm({
          username: data.user.username || '',
          email: data.user.email || '',
          logoURL: data.user.logoURL || '',
          mobileNumber: data.user.mobileNumber || '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      setSaving(true);
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccessMessage('Profile updated successfully.');
      await refreshSession();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Update your account details and profile logo.</p>

        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-gray-700 mb-5">
            <div className="flex items-center gap-4">
              <img
                src={form.logoURL || 'https://placehold.co/96x96/374151/F3F4F6/png?text=User'}
                alt="User logo"
                className="w-16 h-16 rounded-full object-cover border border-gray-600"
              />
              <div>
                <p className="text-white font-medium">{user?.username || form.username}</p>
                <p className="text-gray-400 text-sm">{user?.role}</p>
              </div>
            </div>

            <ImageUpload
              value={form.logoURL}
              onChange={(url) => setForm((prev) => ({ ...prev, logoURL: url }))}
              folder="users"
              previewShape="circle"
              id="profile-logo-inline"
              buttonOnly
              buttonText="Logo"
            />
          </div>

          {error && (
            <div className="mb-4 rounded border border-red-700 bg-red-900/30 px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded border border-green-700 bg-green-900/30 px-4 py-3 text-green-300 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Mobile Number</label>
              <input
                type="text"
                value={form.mobileNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                placeholder="+94 77 123 4567"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded font-medium"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
