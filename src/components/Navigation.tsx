'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggle: toggleSidebar } = useSidebar();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (pathname.startsWith('/auth')) return null;
  if (isLoading) return null;

  const handleLogout = async () => {
    await logout();
  };

  const ProStreamLogo = () => (
    <Link href="/" className="flex items-center gap-3 group">
      <div className="relative">
        <div className="absolute inset-0 bg-brand-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <img
          src="https://res.cloudinary.com/diitsd6nz/image/upload/v1760794476/ProSteam_logo_h9pb8b.png"
          alt="ProStream Logo"
          className="h-10 w-10 object-contain relative z-10"
        />
      </div>
      <div className="flex flex-col">
        <p className="text-xl font-display font-bold leading-none tracking-tight">
          <span style={{ color: 'var(--brand-primary)' }}>Pro</span>
          <span style={{ color: 'var(--brand-secondary)' }}>Stream</span>
        </p>
        <span className="text-[0.65rem] uppercase tracking-[0.2em] font-bold" style={{ color: 'var(--text-muted)' }}>Auction</span>
      </div>
    </Link>
  );

  const ThemeToggle = () => {
    const [isHovered, setIsHovered] = React.useState(false);
    return (
      <button
        onClick={toggleTheme}
        className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
        aria-label="Toggle theme"
        style={{
          color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
          backgroundColor: isHovered ? 'var(--surface-hover)' : 'transparent'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {theme === 'light' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </button>
    );
  };

  const AuthButtons = () =>
    user ? (
      <button
        onClick={handleLogout}
        className="px-5 py-2 rounded-full text-sm font-semibold bg-surface-elevated border transition-all duration-300"
        style={{
          color: 'var(--text-primary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        Logout
      </button>
    ) : (
      <Link
        href="/auth/login"
        className="px-5 py-2 rounded-full text-sm font-semibold text-white shadow-lg hover:shadow-brand-primary/40 hover:-translate-y-0.5 transition-all duration-300"
        style={{
          backgroundColor: 'var(--brand-primary)',
          boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.25)'
        }}
      >
        Login
      </Link>
    );

  const UserSummary = () =>
    user ? (
      <div className="flex items-center gap-2">
        <div
          className="w-11 h-11 rounded-full border overflow-hidden shrink-0"
          style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--surface-elevated)' }}
        >
          <img
            src={user.logoURL || 'https://placehold.co/96x96/374151/F3F4F6/png?text=U'}
            alt={user.username}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        <span className="text-sm font-medium max-w-[140px] truncate" style={{ color: 'var(--text-primary)' }}>
          {user.username}
        </span>
      </div>
    ) : null;

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 h-[5.5rem] transition-all duration-300`}
      style={{
        backgroundColor: scrolled ? 'var(--nav-background)' : 'var(--surface-primary)',
        borderBottom: scrolled ? '1px solid var(--nav-border)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(16px)' : undefined,
      }}
    >
      {/* Left: sidebar toggle + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Toggle sidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <ProStreamLogo />
      </div>

      {/* Right: theme + auth */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserSummary />
        <AuthButtons />
      </div>
    </nav>
  );
};

export default Navigation;
