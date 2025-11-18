'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import BackgroundAnimation from '@/components/landing/BackgroundAnimation';
import Hero from '@/components/landing/Hero';
import FeatureCard from '@/components/landing/FeatureCard';

/**
 * Landing page for ProStream Auction Management System
 */
export default function HomePage() {
  const highlights = [
    {
      title: 'Auction Control',
      description:
        'Real-time bidding with budget tracking and instant notifications for each franchise.',
      href: '/auction',
      color: 'primary' as const,
      icon: (
        <svg className="h-12 w-12 sm:h-14 sm:w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: 'Tournament Management',
      description: 'Create squads, manage salaries, and keep squad limits in sync across staff.',
      href: '/manage',
      color: 'secondary' as const,
      icon: (
        <svg className="h-12 w-12 sm:h-14 sm:w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      title: 'Streaming Overlays',
      description: 'OBS-ready scenes for player spotlights, leaderboards, and sponsor integrations.',
      href: '/overlays',
      color: 'purple' as const,
      icon: (
        <svg className="h-12 w-12 sm:h-14 sm:w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  const metrics = [
    { value: '45+', label: 'Elite tournaments powered' },
    { value: '3s', label: 'Average bid sync time' },
    { value: '99.95%', label: 'Overlay uptime' },
    { value: '24/7', label: 'On-call production support' },
    { value: '250K+', label: 'Concurrent viewers handled' },
    { value: '12', label: 'Active broadcast themes' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950">
      <BackgroundAnimation />
      <Navigation />

      <main className="relative z-10 flex flex-col gap-24 pb-16 pt-6 lg:pb-24">
        <Hero />

        {/* Features Section */}
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.5em] text-brand-secondary/80">
                Product Suite
              </p>
              <h2 className="mt-3 text-3xl font-bold text-neutral-100 sm:text-4xl">
                Everything coaches and producers need
              </h2>
              <p className="mt-4 text-base text-neutral-300 sm:text-lg">
                From auction control rooms to live streams, ProStream keeps every stakeholder aligned
                while staying performant on any device.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {highlights.map((highlight) => (
                <FeatureCard
                  key={highlight.title}
                  icon={highlight.icon}
                  title={highlight.title}
                  description={highlight.description}
                  href={highlight.href}
                  color={highlight.color}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Additional Info Section */}
        <section className="bg-neutral-900/60 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-neutral-100 sm:text-4xl">Built for professionals</h3>
              <p className="mt-4 text-base text-neutral-300 sm:text-lg">
                Whether you are staging a domestic showcase or a televised mega auction, ProStream
                keeps your data, budget rules, and broadcast overlays in sync.
              </p>
            </div>

            <div className="mt-10 grid gap-6 text-left sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-white">Live control room</h4>
                <p className="mt-2 text-sm text-neutral-400">
                  Trigger timers, lock bids, and cut to overlays with a single tap from mobile or desktop.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-secondary/10 text-brand-secondary">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-white">Production overlays</h4>
                <p className="mt-2 text-sm text-neutral-400">
                  Automatically render player cards, ticker crawls, and upcoming lots without manual edits.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-status-purple/10 text-status-purple">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-white">Mobile dashboards</h4>
                <p className="mt-2 text-sm text-neutral-400">
                  Auctioneers, analysts, and commentators stay aligned with adaptive views per role.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics/Testimonial Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-neutral-900/60 p-6 sm:p-10">
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="space-y-6">
                <p className="text-sm font-semibold uppercase tracking-[0.5em] text-brand-secondary/80">
                  Field tested
                </p>
                <blockquote className="text-lg text-neutral-200 sm:text-xl">
                  “ProStream let our production crew run the auction from a tablet while our broadcast
                  team mirrored the same data in OBS. Zero missed lots, no frantic spreadsheets, and a
                  flawless viewer experience.”
                </blockquote>
                <p className="text-sm text-neutral-400">Riya Menon — Tournament Director, Grand League</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 text-center"
                  >
                    <p className="text-3xl font-black text-white">{metric.value}</p>
                    <p className="mt-2 text-sm text-neutral-400">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-neutral-800 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl text-center text-sm text-neutral-500">
          <p>&copy; {new Date().getFullYear()} ProStream Auction Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
