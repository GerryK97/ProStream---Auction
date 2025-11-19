'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TextField from '@/components/forms/TextField';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordToggleLabel = showPassword ? 'Hide password' : 'Show password';

  return (
    <div className="relative min-h-[100dvh] text-white" style={{ backgroundColor: 'var(--surface-primary)' }}>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle at top, rgba(79,70,229,0.4), transparent 55%)',
        }}
        aria-hidden="true"
      />
      <div
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:flex-row lg:items-stretch lg:gap-16 lg:py-16"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex w-full flex-col justify-between gap-10 text-center lg:max-w-xl lg:text-left">
          <div className="space-y-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-secondary transition hover:text-brand-secondary/80"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Back to home
            </Link>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.5em] text-brand-secondary/80">ProStream</p>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Welcome back</h1>
              <p className="mt-3 text-base text-slate-300 sm:text-lg">
                Sign in to run auctions, manage squads, and control your live overlays from any device.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left text-xs sm:text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <div className="rounded-2xl p-4" style={{
              borderColor: 'var(--border-primary)',
              border: `1px solid var(--border-primary)`,
              backgroundColor: 'var(--surface-card)'
            }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>12</p>
              <p className="mt-1">Teams bidding live</p>
            </div>
            <div className="rounded-2xl p-4" style={{
              borderColor: 'var(--border-primary)',
              border: `1px solid var(--border-primary)`,
              backgroundColor: 'var(--surface-card)'
            }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>250K+</p>
              <p className="mt-1">Viewers synced</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md self-center lg:self-stretch">
          <div className="rounded-3xl p-6 shadow-2xl backdrop-blur" style={{
            borderColor: 'var(--border-primary)',
            border: `1px solid var(--border-primary)`,
            backgroundColor: 'var(--surface-secondary)'
          }}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Login to ProStream</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>Enter your credentials to continue.</p>
            </div>

            <div className="min-h-[48px]">
              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
                >
                  {error}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <TextField
                id="username"
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. auction-admin"
                disabled={isLoading}
                autoCapitalize="none"
                autoComplete="username"
                inputMode="text"
                helperText="Use the username assigned by your tournament admin"
                required
              />

              <TextField
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                autoCapitalize="none"
                autoComplete="current-password"
                helperText="Minimum 8 characters"
                required
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-xs font-semibold uppercase tracking-widest text-slate-300"
                  >
                    {passwordToggleLabel}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full rounded-2xl bg-brand-primary px-4 py-3 text-base font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-primary/50"
              >
                {isLoading ? 'Signing in…' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Don't have an account?{' '}
              <Link href="/auth/signup" className="font-semibold text-brand-secondary hover:text-brand-secondary/80">
                Request access
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Need help?{' '}
            <a href="mailto:support@prostream.com" className="text-brand-secondary hover:text-brand-secondary/80">
              Contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
