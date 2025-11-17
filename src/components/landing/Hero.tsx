'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

/**
 * Hero section for landing page
 * Features ProStream branding and call-to-action
 */
const Hero: React.FC = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-4xl mx-auto animate-fade-in">
        {/* Logo/Branding */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-black mb-4">
            <span style={{ color: '#0F84D0' }}>Pro</span>
            <span style={{ color: '#78CA2A' }}>Stream</span>
          </h1>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full" />
        </div>

        {/* Tagline */}
        <h2 className="text-2xl md:text-4xl font-bold text-neutral-100 mb-6 animate-slide-in-up">
          Professional Auction Management System
        </h2>

        {/* Description */}
        <p className="text-lg md:text-xl text-neutral-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Streamline your cricket auction experience with real-time bidding,
          comprehensive team management, and professional streaming overlays.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {!isLoading && !user ? (
            <>
              <Link
                href="/auth/login"
                className="group relative px-8 py-4 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-brand-primary/50"
              >
                <span className="relative z-10">Login</span>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-secondary opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300" />
              </Link>

              <Link
                href="/auth/signup"
                className="px-8 py-4 bg-neutral-800 hover:bg-neutral-700 border-2 border-neutral-600 hover:border-brand-secondary text-white font-bold rounded-lg text-lg transition-all duration-300 transform hover:scale-105"
              >
                Create Account
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/auction')}
                className="group relative px-8 py-4 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-brand-primary/50"
              >
                <span className="relative z-10">Start Auction</span>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-secondary opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300" />
              </button>

              <button
                onClick={() => router.push('/manage')}
                className="px-8 py-4 bg-neutral-800 hover:bg-neutral-700 border-2 border-neutral-600 hover:border-brand-secondary text-white font-bold rounded-lg text-lg transition-all duration-300 transform hover:scale-105"
              >
                Manage Tournament
              </button>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-brand-primary mb-2">Real-Time</div>
            <div className="text-neutral-400">Bidding System</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-brand-secondary mb-2">Live</div>
            <div className="text-neutral-400">Stream Overlays</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-status-purple mb-2">Complete</div>
            <div className="text-neutral-400">Management Suite</div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-neutral-500"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Hero;
