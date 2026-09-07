'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TextField from '@/components/forms/TextField';

function PasswordLoginForm() {
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
    <>
      <div className="min-h-[48px]">
        {error && (
          <div
            role="alert"
            className="rounded-2xl p-3 text-sm"
            style={{
              color: 'var(--status-danger)',
              border: '1px solid color-mix(in oklab, var(--status-danger) 40%, transparent)',
              background: 'color-mix(in oklab, var(--status-danger) 12%, transparent)'
            }}
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
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-secondary)' }}
            >
              {passwordToggleLabel}
            </button>
          }
        />

        <button
          type="submit"
          disabled={isLoading || !username || !password}
          className="w-full rounded-2xl px-4 py-3 text-base font-semibold transition disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--brand-primary)',
            color: '#fff',
            opacity: isLoading || !username || !password ? 0.5 : 1
          }}
        >
          {isLoading ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </>
  );
}

function OtpLoginForm() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { sendLoginOtp, loginWithOtp } = useAuth();
  const router = useRouter();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await sendLoginOtp(phone);
      setInfo(`We sent a code to ${result.phone}. Enter it below.`);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code. Check the number and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await loginWithOtp(phone, otp);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-[48px]">
        {error && (
          <div
            role="alert"
            className="rounded-2xl p-3 text-sm"
            style={{
              color: 'var(--status-danger)',
              border: '1px solid color-mix(in oklab, var(--status-danger) 40%, transparent)',
              background: 'color-mix(in oklab, var(--status-danger) 12%, transparent)'
            }}
          >
            {error}
          </div>
        )}
      </div>

      {step === 'phone' ? (
        <form onSubmit={handleSend} className="space-y-5">
          <TextField
            id="phone"
            label="Mobile number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+94 77 123 4567"
            disabled={isLoading}
            autoComplete="tel"
            helperText="Enter the mobile number linked with your account"
            required
          />
          <button
            type="submit"
            disabled={isLoading || !phone}
            className="w-full rounded-2xl px-4 py-3 text-base font-semibold transition disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--brand-primary)',
              color: '#fff',
              opacity: isLoading || !phone ? 0.5 : 1
            }}
          >
            {isLoading ? 'Sending…' : 'Send Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-5">
          {info ? <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{info}</p> : null}
          <TextField
            id="otp"
            label="6-digit code"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            style={{ letterSpacing: '0.3em', textAlign: 'center' }}
            disabled={isLoading}
            autoFocus
            required
          />
          <button
            type="submit"
            disabled={isLoading || otp.length < 6}
            className="w-full rounded-2xl px-4 py-3 text-base font-semibold transition disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--brand-primary)',
              color: '#fff',
              opacity: isLoading || otp.length < 6 ? 0.5 : 1
            }}
          >
            {isLoading ? 'Verifying…' : 'Verify & Sign In'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('phone'); setOtp(''); setError(''); setInfo(''); }}
            className="w-full text-center text-sm transition"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Use a different number
          </button>
        </form>
      )}
    </>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<'password' | 'otp'>('password');

  return (
    <div className="relative min-h-[100dvh]" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
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
              className="inline-flex items-center gap-2 text-sm font-semibold transition"
              style={{ color: 'var(--brand-secondary)' }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Back to home
            </Link>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.5em]" style={{ color: 'color-mix(in oklab, var(--brand-secondary) 80%, transparent)' }}>ProStream</p>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
              <p className="mt-3 text-base sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
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
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Login to ProStream</h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {mode === 'password' ? 'Enter your credentials to continue.' : 'Sign in with a code sent to your mobile.'}
                </p>
              </div>
              <div className="flex rounded-full p-1 text-xs font-medium" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                <button
                  type="button"
                  onClick={() => setMode('password')}
                  className="rounded-full px-3 py-1.5 transition"
                  style={{
                    backgroundColor: mode === 'password' ? 'var(--brand-primary)' : 'transparent',
                    color: mode === 'password' ? '#fff' : 'var(--text-tertiary)',
                  }}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setMode('otp')}
                  className="rounded-full px-3 py-1.5 transition"
                  style={{
                    backgroundColor: mode === 'otp' ? 'var(--brand-primary)' : 'transparent',
                    color: mode === 'otp' ? '#fff' : 'var(--text-tertiary)',
                  }}
                >
                  Mobile OTP
                </button>
              </div>
            </div>

            {mode === 'password' ? <PasswordLoginForm /> : <OtpLoginForm />}

            <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Don't have an account?{' '}
              <Link href="/auth/signup" className="font-semibold transition" style={{ color: 'var(--brand-secondary)' }}>
                Request access
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Need help?{' '}
            <a href="mailto:support@prostream.com" className="transition" style={{ color: 'var(--brand-secondary)' }}>
              Contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
