'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const navLinks = [
  { href: '/auction', label: 'Auction' },
  { href: '/manage', label: 'Manage' },
  { href: '/overlays', label: 'Overlays' },
  { href: '/contact', label: 'Contact' },
];

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hasPrefetchedRoutes = useRef(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user || hasPrefetchedRoutes.current) return;
    if (user.role === 'Admin' || user.role === 'Tournament') {
      hasPrefetchedRoutes.current = true;
      router.prefetch('/auction');
      router.prefetch('/auction/setup');
      fetch('/api/auction/bootstrap').catch(() => undefined);
    }
  }, [router, user]);

  if (pathname.startsWith('/auth')) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const ProStreamLogo = () => (
    <Link href="/" className="flex items-center gap-3">
      <img
        src="https://res.cloudinary.com/diitsd6nz/image/upload/v1760794476/ProSteam_logo_h9pb8b.png"
        alt="ProStream Logo"
        className="h-10 w-10 object-contain"
      />
      <div>
        <p className="text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--text-muted)' }}>
          ProStream
        </p>
        <p className="text-xl font-bold leading-tight">
          <span style={{ color: '#0F84D0' }}>Pro</span>
          <span style={{ color: '#78CA2A' }}>Stream</span>
          <span style={{ color: 'var(--text-primary)' }}> Auction</span>
        </p>
      </div>
    </Link>
  );

  const LinkGroup = () => (
    <div className="flex items-center gap-6 text-sm font-semibold">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`transition-colors ${
            isActive(link.href) ? 'text-brand-primary' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );

  const AuthButtons = () =>
    user ? (
      <button
        onClick={handleLogout}
        className="rounded-full px-4 py-2 text-sm font-semibold transition"
        style={{
          backgroundColor: 'var(--surface-hover)',
          color: 'var(--text-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
        }}
      >
        Logout
      </button>
    ) : (
      <Link
        href="/auth/login"
        className="rounded-full px-4 py-2 text-sm font-semibold transition"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          color: 'var(--text-primary)',
        }}
      >
        Login
      </Link>
    );

  const ThemeToggle = () => (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="relative h-8 w-16 rounded-full text-xs font-semibold backdrop-blur transition"
      style={{
        backgroundColor: 'var(--surface-hover)',
        color: 'var(--text-primary)',
      }}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full shadow transition-transform ${
          theme === 'light' ? 'translate-x-7' : 'translate-x-1'
        }`}
        style={{ backgroundColor: 'var(--text-primary)' }}
      />
      <span className="absolute left-3 top-2">🌙</span>
      <span className="absolute right-3 top-2">☀️</span>
    </button>
  );

  if (isLoading) {
    return (
      <nav className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <div className="flex h-14 w-full max-w-5xl items-center justify-between rounded-2xl border border-[var(--nav-border)] bg-[var(--nav-background)] px-4 shadow-xl">
          <div className="h-4 w-32 animate-pulse rounded-full bg-white/30" />
          <div className="h-4 w-20 animate-pulse rounded-full bg-white/30" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="flex h-16 w-full max-w-5xl items-center justify-between rounded-3xl border border-[var(--nav-border)] bg-[var(--nav-background)] px-6 shadow-2xl backdrop-blur-lg">
        <ProStreamLogo />

        <div className="hidden items-center gap-6 md:flex">
          <LinkGroup />
          <ThemeToggle />
          <AuthButtons />
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full md:hidden transition"
          style={{
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)',
            border: `1px solid var(--border-primary)`,
          }}
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          {drawerOpen ? '✕' : '☰'}
        </button>
      </div>

      {drawerOpen && (
        <div className="absolute top-20 w-full max-w-5xl rounded-3xl border border-[var(--nav-border)] bg-[var(--nav-background)] p-6 shadow-2xl backdrop-blur">
          <div className="grid gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl p-4 font-semibold transition ${
                  isActive(link.href) ? 'text-brand-primary' : ''
                }`}
                style={{
                  borderColor: 'var(--border-primary)',
                  border: `1px solid var(--border-primary)`,
                  backgroundColor: isActive(link.href) ? 'var(--surface-hover)' : 'transparent',
                  color: isActive(link.href) ? '#0F84D0' : 'var(--text-primary)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <ThemeToggle />
            <AuthButtons />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
