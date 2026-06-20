'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeaders } from '@/lib/api-client';
import ImageUpload from '@/components/ImageUpload';
import { buildImageUrl } from '@/lib/cloudinaryUtils';

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

  // OTP state
  const [otpStep, setOtpStep] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [otpMasked, setOtpMasked] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/users/profile', { headers: getAuthHeaders() });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load profile');
        setForm({
          username: data.user.username || '',
          email: data.user.email || '',
          logoURL: data.user.logoURL || '',
          mobileNumber: data.user.mobileNumber || '',
        });
        if (data.user.phoneVerified) setOtpStep('verified');
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
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setSuccessMessage('Profile updated successfully.');
      // If mobile changed, reset OTP state
      if (data.user.mobileNumber !== user?.mobileNumber) setOtpStep('idle');
      await refreshSession();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSendOTP = async () => {
    setOtpError(null);
    setOtpSuccess(null);
    if (!form.mobileNumber.trim()) {
      setOtpError('Please enter your mobile number above and save your profile first.');
      return;
    }
    try {
      setOtpSending(true);
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.mobileNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpMasked(data.message ?? `OTP sent to ${form.mobileNumber}`);
      setOtpStep('sent');
      setOtpCode('');
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    setOtpError(null);
    if (!otpCode.trim()) { setOtpError('Please enter the OTP.'); return; }
    try {
      setOtpVerifying(true);
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpCode, phone: form.mobileNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
      setOtpStep('verified');
      setOtpSuccess('✅ Mobile number verified!');
      setOtpCode('');
      await refreshSession();
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed');
    } finally {
      setOtpVerifying(false);
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
                src={buildImageUrl(form.logoURL, { width: 96, height: 96 }) || 'https://placehold.co/96x96/374151/F3F4F6/png?text=User'}
                alt="User logo"
                className="w-16 h-16 rounded-full object-cover border border-gray-600"
              />
              <div>
                <p className="text-white font-medium">{user?.username || form.username}</p>
                <p className="text-gray-400 text-sm">{(user as any)?.role}</p>
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
            <div className="mb-4 rounded border border-red-700 bg-red-900/30 px-4 py-3 text-red-300 text-sm">{error}</div>
          )}
          {successMessage && (
            <div className="mb-4 rounded border border-green-700 bg-green-900/30 px-4 py-3 text-green-300 text-sm">{successMessage}</div>
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
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, mobileNumber: e.target.value }));
                  setOtpStep('idle'); // reset if number changes
                }}
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

        {/* ── Mobile OTP Verification ───────────────────────────────── */}
        <div className="mt-5 bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-base font-semibold text-white">Mobile Verification</h2>
            {otpStep === 'verified' && (
              <span className="text-xs bg-green-900/40 text-green-400 border border-green-700 rounded-full px-2 py-0.5">✓ Verified</span>
            )}
            {otpStep !== 'verified' && form.mobileNumber && (
              <span className="text-xs bg-yellow-900/40 text-yellow-400 border border-yellow-700 rounded-full px-2 py-0.5">Unverified</span>
            )}
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Verify your mobile number via SMS OTP.
          </p>

          {otpError && (
            <div className="mb-3 rounded border border-red-700 bg-red-900/30 px-3 py-2 text-red-300 text-sm">{otpError}</div>
          )}
          {otpSuccess && (
            <div className="mb-3 rounded border border-green-700 bg-green-900/30 px-3 py-2 text-green-300 text-sm">{otpSuccess}</div>
          )}

          {otpStep === 'idle' && (
            <button
              onClick={handleSendOTP}
              disabled={otpSending || !form.mobileNumber.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-medium text-sm"
            >
              {otpSending ? 'Sending...' : 'Send OTP'}
            </button>
          )}

          {otpStep === 'sent' && (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">{otpMasked}. Enter the 6-digit code below.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit OTP"
                  maxLength={6}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm tracking-widest focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleVerifyOTP}
                  disabled={otpVerifying || otpCode.length < 6}
                  className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded font-medium text-sm"
                >
                  {otpVerifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
              <button
                onClick={() => { setOtpStep('idle'); setOtpCode(''); setOtpError(null); }}
                className="text-xs text-gray-500 hover:text-gray-400 underline"
              >
                Resend / change number
              </button>
            </div>
          )}

          {otpStep === 'verified' && (
            <button
              onClick={() => { setOtpStep('idle'); setOtpSuccess(null); }}
              className="text-xs text-gray-500 hover:text-gray-400 underline"
            >
              Re-verify with a different number
            </button>
          )}
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
