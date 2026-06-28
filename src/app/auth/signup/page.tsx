'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');
  const { signup } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!username || username.length < 3) {
      newErrors.push('Username must be at least 3 characters');
    }

    if (!email || !email.includes('@')) {
      newErrors.push('Please enter a valid email');
    }

    if (password !== confirmPassword) {
      newErrors.push('Passwords do not match');
    }

    if (password.length < 8) {
      newErrors.push('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
      newErrors.push('Password must contain an uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      newErrors.push('Password must contain a lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      newErrors.push('Password must contain a number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      newErrors.push('Password must contain a special character (!@#$%^&*)');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const sendSignupOTP = async (tokenToUse: string, phone: string) => {
    const response = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenToUse}`,
      },
      body: JSON.stringify({ phone }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
    return data.message || `OTP sent to ${phone}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setOtpError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup(username, email, password, mobileNumber);
      const tokenToUse = result.token ?? localStorage.getItem('auth_token');
      const cleanPhone = mobileNumber.trim();

      if (cleanPhone && tokenToUse) {
        setSignupToken(tokenToUse);
        const message = await sendSignupOTP(tokenToUse, cleanPhone);
        setOtpMessage(message);
        setOtpStep('sent');
        setSuccessMessage('Account created successfully. Enter the OTP sent to your mobile number to verify it.');
        return;
      }

      setSuccessMessage(
        cleanPhone
          ? 'Account created successfully. Mobile verification can be completed later from Profile.'
          : 'Account created successfully! You can now login as a Tournament Manager.',
      );
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Signup failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setOtpError('');
    if (!signupToken) {
      setOtpError('Signup session expired. Please login and verify from Profile.');
      return;
    }
    if (otpCode.length < 6) {
      setOtpError('Please enter the 6-digit OTP.');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${signupToken}`,
        },
        body: JSON.stringify({ otp: otpCode, phone: mobileNumber.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Verification failed');

      setOtpStep('verified');
      setSuccessMessage('Mobile number verified successfully. Redirecting to login...');
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSkipOTP = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--surface-primary)' }}>
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>ProStream</h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Auction Management System</p>
        </div>

        {/* Signup Form */}
        <div className="rounded-lg shadow-2xl p-8" style={{
          borderColor: 'var(--border-primary)',
          border: `1px solid var(--border-primary)`,
          backgroundColor: 'var(--surface-secondary)'
        }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Create Account</h2>

          {error && (
            <div className="mb-6 p-4 rounded text-sm" style={{ color: 'var(--status-danger)', border: '1px solid color-mix(in oklab, var(--status-danger) 40%, transparent)', background: 'color-mix(in oklab, var(--status-danger) 12%, transparent)' }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded text-sm" style={{ color: 'var(--status-success)', border: '1px solid color-mix(in oklab, var(--status-success) 40%, transparent)', background: 'color-mix(in oklab, var(--status-success) 12%, transparent)' }}>
              {successMessage}
            </div>
          )}

            {errors.length > 0 && (
            <div className="mb-6 p-4 rounded" style={{ color: 'var(--status-warning)', border: '1px solid color-mix(in oklab, var(--status-warning) 40%, transparent)', background: 'color-mix(in oklab, var(--status-warning) 12%, transparent)' }}>
                <p className="text-sm font-medium mb-2">Password requirements:</p>
                <ul className="text-xs space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
                className="w-full px-4 py-2 border rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Enter username"
                required
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>3-50 characters, letters, numbers, -, _</p>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || otpStep === 'sent'}
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
                className="w-full px-4 py-2 border rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Mobile Number Input */}
            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Mobile Number <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
              </label>
              <input
                type="tel"
                id="mobileNumber"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                disabled={isLoading || otpStep === 'sent'}
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
                className="w-full px-4 py-2 border rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                placeholder="+94771234567 or 0771234567"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>If provided, we will send an OTP after signup to verify it.</p>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
                className="w-full px-4 py-2 border rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Enter password"
                required
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
                className="w-full px-4 py-2 border rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Confirm password"
                required
              />
            </div>

            {/* Role Info */}
            <div className="rounded-md p-3" style={{ backgroundColor: 'var(--surface-subtle)', border: '1px solid var(--border-primary)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Role</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                New accounts start as <strong style={{ color: 'var(--text-primary)' }}>Tournament Manager</strong>. Admins can change roles later if needed.
              </p>
            </div>

            {/* Signup OTP Verification */}
            {otpStep === 'sent' && (
              <div className="rounded-md p-4 space-y-3" style={{ backgroundColor: 'var(--surface-subtle)', border: '1px solid var(--border-primary)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Verify Mobile Number</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{otpMessage}. Enter the 6-digit OTP below.</p>
                </div>
                {otpError && (
                  <div className="p-3 rounded text-xs" style={{ color: 'var(--status-danger)', border: '1px solid color-mix(in oklab, var(--status-danger) 40%, transparent)', background: 'color-mix(in oklab, var(--status-danger) 12%, transparent)' }}>
                    {otpError}
                  </div>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={otpLoading}
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                  className="w-full px-4 py-2 border rounded text-center tracking-[0.35em] text-lg placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="000000"
                  maxLength={6}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otpLoading || otpCode.length < 6}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-medium rounded transition-colors disabled:cursor-not-allowed"
                  >
                    {otpLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipOTP}
                    disabled={otpLoading}
                    className="px-4 py-2 rounded border transition-colors disabled:opacity-50"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {otpStep !== 'sent' && (
              <button
                type="submit"
                disabled={isLoading || !username || !email || !password || !confirmPassword || errors.length > 0}
                className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded transition-colors disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            )}
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p style={{ color: 'var(--text-tertiary)' }}>
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
