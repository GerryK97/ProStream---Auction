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

  const pricingTiers = [
    {
      name: 'Free',
      price: '0 LKR',
      cadence: 'per tournament',
      description: 'Up to 2 teams to trial the control room with unlimited players.',
      perks: [
        '2 teams per tournament',
        'Unlimited players',
        'Core auction controls',
        'No custom branding overlays',
      ],
      accent: 'var(--text-muted)',
    },
    {
      name: 'Standard',
      price: '5,000 LKR',
      cadence: 'per tournament',
      description: 'For full events that need polished overlays and tight roster control.',
      perks: [
        'Includes 10 teams; unlimited players',
        'Each additional team: 500 LKR',
        'Customized branding overlay',
        'Live support for event day',
      ],
      accent: 'var(--brand-primary)',
      badge: 'Most booked',
    },
    {
      name: 'Offer (Monthly Access)',
      price: '7,500 LKR',
      cadence: 'per month',
      description: 'Ideal for leagues running multiple auctions and ongoing broadcasts.',
      perks: [
        '2 tournaments included; unlimited teams/players',
        'Customized branding overlay',
        '1 additional overlay design request per month',
        'Early access to new features',
      ],
      accent: 'var(--brand-secondary)',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: 'var(--surface-primary)' }}>
      <BackgroundAnimation />
      <Navigation />

      <main className="relative z-10 flex flex-col gap-24 pb-16 pt-6 lg:pb-24">
        <Hero />

        {/* Features Section */}
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.5em]" style={{ color: 'color-mix(in oklab, var(--brand-secondary) 80%, transparent)' }}>
                Product Suite
              </p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: 'var(--text-secondary)' }}>
                Everything coaches and producers need
              </h2>
              <p className="mt-4 text-base sm:text-lg" style={{ color: 'var(--text-tertiary)' }}>
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

        {/* Pricing Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.5em]" style={{ color: 'color-mix(in oklab, var(--brand-primary) 80%, transparent)' }}>
                Pricing strategies
              </p>
              <h3 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: 'var(--text-secondary)' }}>
                Direct-only purchasing, tailored to your auction
              </h3>
              <p className="mt-4 text-base sm:text-lg" style={{ color: 'var(--text-tertiary)' }}>
                Every engagement is finalized by speaking with our producers so we can match overlays, staffing,
                and delivery timelines to your broadcast stack. No self-serve checkout.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className="flex h-full flex-col rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
                  style={{
                    borderColor: 'var(--border-primary)',
                    border: '1px solid var(--border-primary)',
                    background: 'linear-gradient(135deg, color-mix(in oklab, var(--surface-elevated) 85%, transparent), color-mix(in oklab, var(--surface-secondary) 70%, transparent))',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: tier.accent }}>
                        {tier.name}
                      </p>
                      <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {tier.price}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>{tier.cadence}</p>
                    </div>
                    {tier.badge && (
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: 'color-mix(in oklab, var(--brand-secondary) 15%, var(--surface-elevated))',
                          color: 'var(--brand-secondary)',
                          border: '1px solid color-mix(in oklab, var(--brand-secondary) 25%, var(--border-primary))',
                        }}
                      >
                        {tier.badge}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {tier.description}
                  </p>

                  <ul className="mt-6 space-y-3">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span
                          className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                          style={{ backgroundColor: 'color-mix(in oklab, tier.accent 10%, var(--surface-elevated))', color: tier.accent }}
                        >
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L8.5 11.836l6.543-6.543a1 1 0 011.664 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: 'color-mix(in oklab, var(--surface-primary) 60%, transparent)', border: '1px solid var(--border-primary)' }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                      Purchase flow
                    </p>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Purchase is completed via a direct call with our team to align scope, tech stack, and delivery dates.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between" style={{
              borderColor: 'var(--border-primary)',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'color-mix(in oklab, var(--surface-secondary) 90%, transparent)'
            }}>
              <div>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Ready to purchase?</p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  We schedule a 20-minute fit check, then send a tailored quote with deployment milestones.
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--text-on-brand)',
                    boxShadow: '0 15px 35px color-mix(in oklab, var(--brand-primary) 35%, transparent)'
                  }}
                >
                  Talk with us
                </a>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Direct-only purchases. Responses within one business day.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Info Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--surface-secondary)' }}>
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h3 className="text-3xl font-bold sm:text-4xl" style={{ color: 'var(--text-secondary)' }}>Built for professionals</h3>
              <p className="mt-4 text-base sm:text-lg" style={{ color: 'var(--text-tertiary)' }}>
                Whether you are staging a domestic showcase or a televised mega auction, ProStream
                keeps your data, budget rules, and broadcast overlays in sync.
              </p>
            </div>

            <div className="mt-10 grid gap-6 text-left sm:grid-cols-3">
              <div className="rounded-2xl p-6" style={{
                borderColor: 'var(--border-primary)',
                border: `1px solid var(--border-primary)`,
                backgroundColor: 'var(--surface-elevated)'
              }}>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full" style={{
                  backgroundColor: 'color-mix(in oklab, var(--brand-primary) 10%, var(--surface-elevated))',
                  color: 'var(--brand-primary)'
                }}>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Live control room</h4>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Trigger timers, lock bids, and cut to overlays with a single tap from mobile or desktop.
                </p>
              </div>
              <div className="rounded-2xl p-6" style={{
                borderColor: 'var(--border-primary)',
                border: `1px solid var(--border-primary)`,
                backgroundColor: 'var(--surface-elevated)'
              }}>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full" style={{
                  backgroundColor: 'color-mix(in oklab, var(--brand-secondary) 10%, var(--surface-elevated))',
                  color: 'var(--brand-secondary)'
                }}>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Production overlays</h4>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Automatically render player cards, ticker crawls, and upcoming lots without manual edits.
                </p>
              </div>
              <div className="rounded-2xl p-6" style={{
                borderColor: 'var(--border-primary)',
                border: `1px solid var(--border-primary)`,
                backgroundColor: 'var(--surface-elevated)'
              }}>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full" style={{
                  backgroundColor: 'color-mix(in oklab, var(--accent-color) 10%, var(--surface-elevated))',
                  color: 'var(--accent-color)'
                }}>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Mobile dashboards</h4>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Auctioneers, analysts, and commentators stay aligned with adaptive views per role.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics/Testimonial Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-3xl p-6 sm:p-10" style={{
            borderColor: 'var(--border-primary)',
            border: `1px solid var(--border-primary)`,
            backgroundColor: 'var(--surface-secondary)'
          }}>
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="space-y-6">
                <p className="text-sm font-semibold uppercase tracking-[0.5em]" style={{ color: 'color-mix(in oklab, var(--brand-secondary) 80%, transparent)' }}>
                  Field tested
                </p>
                <blockquote className="text-lg sm:text-xl" style={{ color: 'var(--text-secondary)' }}>
                  "ProStream let our production crew run the auction from a tablet while our broadcast
                  team mirrored the same data in OBS. Zero missed lots, no frantic spreadsheets, and a
                  flawless viewer experience."
                </blockquote>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Riya Menon - Tournament Director, Grand League</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl p-6 text-center"
                    style={{
                      borderColor: 'var(--border-primary)',
                      border: `1px solid var(--border-primary)`,
                      backgroundColor: 'var(--surface-elevated)'
                    }}
                  >
                    <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{metric.value}</p>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 px-4 py-8 sm:px-6" style={{
        borderColor: 'var(--border-primary)',
        borderTop: `1px solid var(--border-primary)`
      }}>
        <div className="mx-auto max-w-7xl text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          <p>&copy; {new Date().getFullYear()} ProStream Auction Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
