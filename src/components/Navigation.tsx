'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasPrefetchedRoutes = useRef(false);

  const isActive = (path: string) => pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    setIsMenuOpen(false);
    router.push('/auth/login');
  };

  useEffect(() => {
    setIsMenuOpen(false);
    setShowDropdown(false);
  }, [pathname]);

  // Don't show navigation on auth pages
  if (pathname.startsWith('/auth')) {
    return null;
  }

  const navLinks = () => {
    const links = [] as { href: string; label: string }[];

    if (user?.role !== 'Player' && user?.role !== 'Audience') {
      links.push(
        { href: '/auction', label: 'Auction' },
        { href: '/manage', label: 'Manage' }
      );
    }

    links.push({ href: '/overlays', label: 'Overlays' });

    if (user?.role === 'Admin') {
      links.push({ href: '/users', label: 'Users' });
    }

    return links;
  };

  const renderNavLinks = (extraClassName = 'px-1 py-2') =>
    navLinks().map((link) => {
      const active = isActive(link.href);

      return (
        <Link
          key={link.href}
          href={link.href}
          className={`text-base font-semibold transition-colors ${extraClassName} ${
            active ? 'text-brand-primary' : 'text-neutral-400 hover:text-white'
          }`}
          aria-current={active ? 'page' : undefined}
        >
          {link.label}
        </Link>
      );
    });

  if (isLoading) {
    return (
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-900/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/diitsd6nz/image/upload/v1760794476/ProSteam_logo_h9pb8b.png"
                alt="ProStream Logo"
                className="h-10 w-10 object-contain"
              />
              <h1 className="text-2xl font-bold">
                <span style={{ color: '#0F84D0' }}>Pro</span>
                <span style={{ color: '#78CA2A' }}>Stream</span> Auction
              </h1>
            </div>
            <div className="text-sm text-neutral-400">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  useEffect(() => {
    if (!user || hasPrefetchedRoutes.current) {
      return;
    }

    if (user.role === 'Admin' || user.role === 'Tournament') {
      hasPrefetchedRoutes.current = true;
      router.prefetch('/auction');
      router.prefetch('/auction/setup');
      fetch('/api/auction/bootstrap').catch(() => undefined);
    }
  }, [router, user]);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-900/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/diitsd6nz/image/upload/v1760794476/ProSteam_logo_h9pb8b.png"
              alt="ProStream Logo"
              className="h-10 w-10 object-contain"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-400">ProStream</p>
              <p className="text-xl font-bold leading-tight">
                <span style={{ color: '#0F84D0' }}>Pro</span>
                <span style={{ color: '#78CA2A' }}>Stream</span> Auction
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">{renderNavLinks()}</nav>

          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-left transition-colors hover:bg-neutral-700/80"
                >
                  <p className="text-xs text-neutral-400">Logged in as</p>
                  <p className="font-semibold text-white">{user.username}</p>
                  <p className="text-xs text-neutral-500">{user.role}</p>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-xl">
                    <div className="border-b border-neutral-800 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Email</p>
                      <p className="text-sm text-white truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left font-medium text-red-400 transition hover:bg-red-500/10"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-500"
              >
                Login
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 md:hidden">
            {user && (
              <div className="text-right text-xs leading-tight text-neutral-400">
                <p className="font-semibold text-white">{user.username}</p>
                <p>{user.role}</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-700 text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Toggle navigation menu</span>
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className={`md:hidden ${isMenuOpen ? 'grid' : 'hidden'} gap-6 border-t border-neutral-800 py-6`}>
          <nav className="flex flex-col gap-3 text-base font-semibold">
            {renderNavLinks('w-full rounded-lg px-3 py-2 text-left')}
          </nav>
          <div className="space-y-4">
            {user ? (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
                <div className="mb-4 text-sm text-neutral-400">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Email</p>
                  <p className="font-semibold text-white">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg bg-red-500/20 px-4 py-2 font-semibold text-red-300 transition hover:bg-red-500/30"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-500"
              >
                Login to ProStream
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
