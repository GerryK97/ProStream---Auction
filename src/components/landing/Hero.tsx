'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

/**
 * Hero section for landing page with mobile-friendly layout
 */
const Hero: React.FC = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  return (
    <div className="relative flex flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="w-full max-w-6xl rounded-[32px] p-6 text-center shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10 lg:text-left" style={{
        borderColor: 'var(--border-primary)',
        border: `1px solid var(--border-primary)`,
        backgroundColor: 'var(--surface-card)'
      }}>
        {/* Logo/Branding */}
        <div className="mb-10 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.6em]" style={{ color: 'color-mix(in oklab, var(--brand-secondary) 90%, transparent)' }}>
            Auction Platform
          </p>
          <h1 className="text-[clamp(2.75rem,8vw,5rem)] font-black leading-tight">
            <span style={{ color: 'var(--brand-primary)' }}>Pro</span>
            <span style={{ color: 'var(--brand-secondary)' }}>Stream</span>
          </h1>
          <div className="h-1 w-32 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary lg:mx-0 lg:w-40" />
        </div>

        {/* Tagline */}
        <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl" style={{ color: 'var(--text-primary)' }}>
          Professional Auction Management System
        </h2>

        {/* Description */}
        <p className="mt-4 text-base sm:text-lg lg:max-w-xl" style={{ color: 'var(--text-secondary)' }}>
          Streamline cricket auctions with real-time bidding, deep team insights, and overlays that
          keep spectators engaged across every screen.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
          {!isLoading && !user ? (
            <>
              <Link
                href="/auth/login"
                className="group relative w-full rounded-2xl px-8 py-3 text-center text-lg font-semibold shadow-lg transition hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto"
                style={{
                  backgroundColor: 'var(--brand-primary)',
                  color: '#fff'
                }}
              >
                <span className="relative z-10">Login</span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Link>

              <Link
                href="/auth/signup"
                className="w-full rounded-2xl px-8 py-3 text-center text-lg font-semibold transition sm:w-auto"
                style={{
                  borderColor: 'var(--border-primary)',
                  border: `1px solid var(--border-primary)`,
                  color: 'var(--text-primary)'
                }}
              >
                Create Account
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/auction')}
                className="w-full rounded-2xl px-8 py-3 text-lg font-semibold shadow-lg transition hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto"
                style={{
                  backgroundColor: 'var(--brand-primary)',
                  color: '#fff'
                }}
              >
                Start Auction
              </button>

              <button
                onClick={() => router.push('/manage')}
                className="w-full rounded-2xl px-8 py-3 text-lg font-semibold transition sm:w-auto"
                style={{
                  borderColor: 'var(--border-primary)',
                  border: `1px solid var(--border-primary)`,
                  color: 'var(--text-primary)'
                }}
              >
                Manage Tournament
              </button>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <div className="rounded-2xl p-4" style={{
            borderColor: 'var(--border-primary)',
            border: `1px solid var(--border-primary)`,
            backgroundColor: 'color-mix(in oklab, var(--surface-elevated) 95%, var(--text-primary) 5%)'
          }}>
            <p className="text-xs uppercase tracking-[0.4em]" style={{ color: 'var(--text-tertiary)' }}>Real-Time</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--brand-primary)' }}>Bidding</p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Latency under 500ms</p>
          </div>
          <div className="rounded-2xl p-4" style={{
            borderColor: 'var(--border-primary)',
            border: `1px solid var(--border-primary)`,
            backgroundColor: 'color-mix(in oklab, var(--surface-elevated) 95%, var(--text-primary) 5%)'
          }}>
            <p className="text-xs uppercase tracking-[0.4em]" style={{ color: 'var(--text-tertiary)' }}>Live</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--brand-secondary)' }}>Overlays</p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>OBS-ready layouts</p>
          </div>
          <div className="rounded-2xl p-4" style={{
            borderColor: 'var(--border-primary)',
            border: `1px solid var(--border-primary)`,
            backgroundColor: 'color-mix(in oklab, var(--surface-elevated) 95%, var(--text-primary) 5%)'
          }}>
            <p className="text-xs uppercase tracking-[0.4em]" style={{ color: 'var(--text-tertiary)' }}>Complete</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--accent-color)' }}>Control</p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Teams &amp; budgets synced</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 text-left lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:p-6" style={{
            borderColor: 'var(--border-primary)',
            border: `1px solid var(--border-primary)`,
            backgroundColor: 'color-mix(in oklab, var(--surface-elevated) 95%, var(--text-primary) 5%)'
          }}>
            <p className="text-xs uppercase tracking-[0.4em]" style={{ color: 'var(--text-tertiary)' }}>Broadcast Control</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Overlay cues synced in real time</p>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2" style={{ color: 'var(--text-secondary)' }}>
              <div className="rounded-2xl p-3" style={{
                borderColor: 'var(--border-primary)',
                border: `1px solid var(--border-primary)`,
                backgroundColor: 'color-mix(in oklab, var(--surface-elevated) 95%, var(--text-primary) 5%)'
              }}>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--text-tertiary)' }}>Current lot</p>
                <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>All-rounder #54</p>
                <p className="text-xs" style={{ color: 'var(--brand-secondary)' }}>ON AIR</p>
              </div>
              <div className="rounded-2xl p-3" style={{
                borderColor: 'var(--border-primary)',
                border: `1px solid var(--border-primary)`,
                backgroundColor: 'color-mix(in oklab, var(--surface-elevated) 95%, var(--text-primary) 5%)'
              }}>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--text-tertiary)' }}>Next in queue</p>
                <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Fast Bowler #12</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>1 min prep</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl p-6 shadow-[0_15px_40px_rgba(16,185,129,0.4)] backdrop-blur-xl" style={{
            borderColor: 'color-mix(in oklab, var(--brand-secondary) 40%, transparent)',
            border: `1px solid color-mix(in oklab, var(--brand-secondary) 40%, transparent)`,
            backgroundColor: 'color-mix(in oklab, var(--brand-secondary) 15%, var(--surface-elevated))'
          }}>
            <p className="text-xs uppercase tracking-[0.4em]" style={{ color: 'var(--brand-secondary)' }}>Live signals</p>
            <ul className="mt-4 space-y-3 text-sm" style={{ color: 'var(--text-primary)' }}>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full" style={{ backgroundColor: 'var(--brand-secondary)' }} />
                Budget synced across auction desk + OBS
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'var(--accent-color)' }} />
                Talent cards queued for commentators
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'var(--status-warning)' }} />
                Sponsor bumper scheduled in 00:45
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.3em]">
              {['OBS Ready', 'PWA', 'Low Latency'].map((badge) => (
                <span key={badge} className="rounded-full px-3 py-1" style={{
                  backgroundColor: 'color-mix(in oklab, var(--text-primary) 90%, transparent)',
                  color: 'var(--surface-primary)'
                }}>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden -translate-y-2 transform items-center justify-center sm:flex">
        <svg
          className="h-6 w-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
          style={{ color: 'var(--text-muted)' }}
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </div>
  );
};

export default Hero;
