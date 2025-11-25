'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Audience');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await signup(username, email, password, role);
      setSuccessMessage(
        role === 'Audience'
          ? 'Account created successfully! Your account is pending admin approval. You will receive an email once approved.'
          : 'Account created successfully! You can now login.'
      );

      if (role !== 'Audience') {
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Signup failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
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
                disabled={isLoading}
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

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Account Type
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoading}
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
                className="w-full px-4 py-2 border rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="Audience">Audience</option>
                <option value="Tournament">Tournament Manager</option>
                <option value="MasterManager">Master Data Manager</option>
                <option value="Team">Team Manager</option>
                <option value="Player">Player</option>
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {role === 'Audience'
                  ? 'Pending admin approval'
                  : 'Automatically activated'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !username || !email || !password || !confirmPassword || errors.length > 0}
              className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
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
