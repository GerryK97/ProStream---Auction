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
      <div className="w-full max-w-3xl text-center lg:text-left">
        {/* Logo/Branding */}
        <div className="mb-10 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.6em] text-brand-secondary/90">
            Auction Platform
          </p>
          <h1 className="text-[clamp(2.75rem,8vw,5rem)] font-black leading-tight">
            <span style={{ color: '#0F84D0' }}>Pro</span>
            <span style={{ color: '#78CA2A' }}>Stream</span>
          </h1>
          <div className="h-1 w-32 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary lg:mx-0 lg:w-40" />
        </div>

        {/* Tagline */}
        <h2 className="text-2xl font-bold text-neutral-100 sm:text-3xl lg:text-4xl">
          Professional Auction Management System
        </h2>

        {/* Description */}
        <p className="mt-4 text-base text-neutral-300 sm:text-lg lg:max-w-xl">
          Streamline cricket auctions with real-time bidding, deep team insights, and overlays that
          keep spectators engaged across every screen.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
          {!isLoading && !user ? (
            <>
              <Link
                href="/auth/login"
                className="group relative w-full rounded-2xl bg-brand-primary px-8 py-3 text-center text-lg font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:w-auto"
              >
                <span className="relative z-10">Login</span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Link>

              <Link
                href="/auth/signup"
                className="w-full rounded-2xl border border-neutral-700 px-8 py-3 text-center text-lg font-semibold text-white transition hover:border-brand-secondary hover:text-brand-secondary sm:w-auto"
              >
                Create Account
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/auction')}
                className="w-full rounded-2xl bg-brand-primary px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:w-auto"
              >
                Start Auction
              </button>

              <button
                onClick={() => router.push('/manage')}
                className="w-full rounded-2xl border border-neutral-700 px-8 py-3 text-lg font-semibold text-white transition hover:border-brand-secondary hover:text-brand-secondary sm:w-auto"
              >
                Manage Tournament
              </button>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">Real-Time</p>
            <p className="mt-2 text-3xl font-bold text-brand-primary">Bidding</p>
            <p className="text-sm text-neutral-400">Latency under 500ms</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">Live</p>
            <p className="mt-2 text-3xl font-bold text-brand-secondary">Overlays</p>
            <p className="text-sm text-neutral-400">OBS-ready layouts</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">Complete</p>
            <p className="mt-2 text-3xl font-bold text-status-purple">Control</p>
            <p className="text-sm text-neutral-400">Teams &amp; budgets synced</p>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden -translate-y-2 transform items-center justify-center sm:flex">
        <svg
          className="h-6 w-6 text-neutral-500"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </div>
  );
};

export default Hero;
