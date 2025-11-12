'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import BackgroundAnimation from '@/components/landing/BackgroundAnimation';
import Hero from '@/components/landing/Hero';
import FeatureCard from '@/components/landing/FeatureCard';

/**
 * Landing page for ProStream Auction Management System
 * Features minimal background animation and introduction to the platform
 */
export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      {/* Background Animation */}
      <BackgroundAnimation />

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <Hero />

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-100 mb-4">
                Everything You Need
              </h2>
              <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
                A complete suite of tools designed for professional cricket auctions
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Auction Control */}
              <FeatureCard
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                title="Auction Control"
                description="Real-time bidding system with live player auctions. Track team budgets, manage bids, and control the entire auction process seamlessly."
                href="/auction"
                color="primary"
              />

              {/* Tournament Management */}
              <FeatureCard
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
                title="Tournament Management"
                description="Create and manage tournaments, teams, and players. Configure budgets, squad sizes, and track comprehensive statistics."
                href="/manage"
                color="secondary"
              />

              {/* Streaming Overlays */}
              <FeatureCard
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                }
                title="Streaming Overlays"
                description="Professional OBS overlays for live streaming. Display player cards, current bids, leaderboards, and more with customizable themes."
                href="/overlays"
                color="purple"
              />
            </div>
          </div>
        </section>

        {/* Additional Info Section */}
        <section className="py-20 px-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-neutral-100 mb-6">
              Built for Professionals
            </h3>
            <p className="text-lg text-neutral-300 leading-relaxed mb-8 max-w-3xl mx-auto">
              ProStream combines powerful auction management with real-time streaming capabilities.
              Whether you're running a local tournament or a professional league,
              our platform provides all the tools you need to create an engaging auction experience.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-neutral-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Professional Overlays</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Easy Management</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto text-center text-neutral-500 text-sm">
          <p>&copy; {new Date().getFullYear()} ProStream Auction Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
