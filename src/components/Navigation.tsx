'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const subnav = {
  auction: [
    { href: '/auction', label: 'Control Room', description: 'Manage live bidding' },
    { href: '/auction/setup', label: 'Setup', description: 'Configure rules & lots' },
  ],
  manage: [
    { href: '/manage/tournaments', label: 'Tournaments', description: 'Leagues & Series', roles: ['Admin', 'Tournament'] },
    { href: '/manage/teams', label: 'Teams', description: 'Franchise management', roles: ['Admin', 'Tournament', 'MasterManager'] },
    { href: '/manage/players', label: 'Players', description: 'Roster management', roles: ['Admin', 'Tournament', 'MasterManager'] },
  ],
} as const;

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | 'auction' | 'manage'>(null);
  const auctionBtnRef = useRef<HTMLButtonElement | null>(null);
  const manageBtnRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [mobileAuctionOpen, setMobileAuctionOpen] = useState(false);
  const [mobileManageOpen, setMobileManageOpen] = useState(false);
  const hasPrefetchedRoutes = useRef(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!user || hasPrefetchedRoutes.current) return;
    if (user.role === 'Admin' || user.role === 'Tournament') {
      hasPrefetchedRoutes.current = true;
      router.prefetch('/auction');
      router.prefetch('/auction/setup');
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      fetch('/api/auction/bootstrap', { headers }).catch(() => undefined);
    }
  }, [router, user]);

  // Close dropdown on outside click / ESC
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!openMenu) return;
      const target = e.target as Node;
      const inButtons = auctionBtnRef.current?.contains(target) || manageBtnRef.current?.contains(target);
      const inPanel = dropdownRef.current?.contains(target);
      if (!inButtons && !inPanel) setOpenMenu(null);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [openMenu]);

  if (pathname.startsWith('/auth')) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

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

  const NavItem = ({
    label,
    active,
    onClick,
    hasDropdown,
    open,
    btnRef
  }: {
    label: string,
    active: boolean,
    onClick?: () => void,
    hasDropdown?: boolean,
    open?: boolean,
    btnRef?: React.RefObject<HTMLButtonElement | null>
  }) => (
    <button
      ref={btnRef}
      onClick={onClick}
      className={`
        relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
        flex items-center gap-1
        ${active || open
          ? 'text-white shadow-[0_0_20px_-5px_var(--brand-primary)]'
          : 'hover:bg-surface-hover'
        }
      `}
      style={{
        backgroundColor: active || open ? 'var(--brand-primary)' : undefined,
        color: active || open ? '#ffffff' : 'var(--text-secondary)'
      }}
    >
      {label}
      {hasDropdown && (
        <svg
          viewBox="0 0 24 24"
          className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      )}
    </button>
  );

  const Dropdown = ({ items, type }: { items: typeof subnav.auction | typeof subnav.manage, type: 'auction' | 'manage' }) => {
    // Filter items based on user role
    const filteredItems = items.filter((item: any) => {
      // If item doesn't have roles property, show it to everyone
      if (!item.roles) return true;
      // Otherwise check if user's role is in the allowed roles
      return user && item.roles.includes(user.role);
    });

    return (
      <div
        ref={dropdownRef}
        className="absolute top-full left-0 mt-4 w-64 p-2 rounded-2xl backdrop-blur-xl border animate-fade-in origin-top-left z-50 shadow-2xl"
        style={{
          backgroundColor: 'var(--nav-background)',
          borderColor: 'var(--nav-border)'
        }}
      >
        <div className="grid gap-1">
          {filteredItems.map((item: any) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpenMenu(null)}
              className="group flex flex-col gap-0.5 p-3 rounded-xl transition-all duration-200 hover:bg-surface-hover"
              style={{
                backgroundColor: active ? 'rgba(79, 70, 229, 0.1)' : undefined,
                color: active ? 'var(--brand-primary)' : 'var(--text-secondary)'
              }}
            >
              <span className="font-semibold text-sm">{item.label}</span>
              <span
                className="text-xs"
                style={{
                  color: active ? 'rgba(79, 70, 229, 0.7)' : 'var(--text-muted)'
                }}
              >
                {item.description}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
    );
  };

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

  if (isLoading) return null;

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 flex justify-center px-4 transition-all duration-300 ${scrolled ? 'pt-4' : 'pt-6'}`}>
      <div
        className={`
          relative flex items-center justify-between w-full max-w-6xl px-6 py-3
          rounded-full border transition-all duration-300
          ${scrolled
            ? 'backdrop-blur-xl shadow-2xl'
            : 'border-transparent'
          }
        `}
        style={{
          backgroundColor: scrolled ? 'var(--nav-background)' : 'transparent',
          borderColor: scrolled ? 'var(--nav-border)' : 'transparent'
        }}
      >
        <ProStreamLogo />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center p-1 rounded-full bg-surface-secondary/50 border border-white/5 backdrop-blur-sm">
            <Link href="/">
              <NavItem label="Home" active={isActive('/')} />
            </Link>

            <div className="relative">
              <NavItem
                label="Auction"
                active={isActive('/auction')}
                hasDropdown
                open={openMenu === 'auction'}
                onClick={() => setOpenMenu(openMenu === 'auction' ? null : 'auction')}
                btnRef={auctionBtnRef}
              />
              {openMenu === 'auction' && <Dropdown items={subnav.auction} type="auction" />}
            </div>

            <div className="relative">
              <NavItem
                label="Manage"
                active={isActive('/manage')}
                hasDropdown
                open={openMenu === 'manage'}
                onClick={() => setOpenMenu(openMenu === 'manage' ? null : 'manage')}
                btnRef={manageBtnRef}
              />
              {openMenu === 'manage' && <Dropdown items={subnav.manage} type="manage" />}
            </div>

            <Link href="/overlays">
              <NavItem label="Overlays" active={isActive('/overlays')} />
            </Link>

            {user?.role === 'Admin' && (
              <Link href="/users">
                <NavItem label="Users" active={isActive('/users')} />
              </Link>
            )}

            <Link href="/contact">
              <NavItem label="Contact" active={isActive('/contact')} />
            </Link>
          </div>

          <div className="w-px h-8 bg-border-primary mx-2" />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AuthButtons />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated border"
          style={{
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)'
          }}
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          {drawerOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div
          className="absolute top-24 inset-x-4 p-4 rounded-3xl backdrop-blur-xl border animate-slide-up md:hidden shadow-2xl"
          style={{
            backgroundColor: 'var(--nav-background)',
            borderColor: 'var(--nav-border)'
          }}
        >
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="p-4 rounded-2xl bg-surface-elevated/50 border font-semibold"
              style={{
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              onClick={() => setDrawerOpen(false)}
            >
              Home
            </Link>

            {/* Auction Section */}
            <div className="p-4 rounded-2xl bg-surface-elevated/50 border" style={{ borderColor: 'var(--border-primary)' }}>
              <button
                className="w-full flex items-center justify-between font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => setMobileAuctionOpen(!mobileAuctionOpen)}
              >
                <span>Auction</span>
                <span className={`transition-transform ${mobileAuctionOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {mobileAuctionOpen && (
                <div className="flex flex-col gap-2 pl-2 border-l-2 ml-1" style={{ borderColor: 'var(--border-primary)' }}>
                  {subnav.auction.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="py-2 px-3 rounded-lg text-sm"
                      style={{
                        color: pathname === item.href ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        backgroundColor: pathname === item.href ? 'rgba(79, 70, 229, 0.1)' : undefined
                      }}
                      onClick={() => setDrawerOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Manage Section */}
            <div className="p-4 rounded-2xl bg-surface-elevated/50 border" style={{ borderColor: 'var(--border-primary)' }}>
              <button
                className="w-full flex items-center justify-between font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => setMobileManageOpen(!mobileManageOpen)}
              >
                <span>Manage</span>
                <span className={`transition-transform ${mobileManageOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {mobileManageOpen && (
                <div className="flex flex-col gap-2 pl-2 border-l-2 ml-1" style={{ borderColor: 'var(--border-primary)' }}>
                  {subnav.manage
                    .filter((item: any) => !item.roles || (user && item.roles.includes(user.role)))
                    .map((item: any) => {
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="py-2 px-3 rounded-lg text-sm"
                          style={{
                            color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                            backgroundColor: isActive ? 'rgba(79, 70, 229, 0.1)' : undefined
                          }}
                          onClick={() => setDrawerOpen(false)}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>

            <Link
              href="/overlays"
              className="p-4 rounded-2xl bg-surface-elevated/50 border font-semibold"
              style={{
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              onClick={() => setDrawerOpen(false)}
            >
              Overlays
            </Link>

            <Link
              href="/contact"
              className="p-4 rounded-2xl bg-surface-elevated/50 border font-semibold"
              style={{
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              onClick={() => setDrawerOpen(false)}
            >
              Contact
            </Link>

            <div className="mt-4 flex items-center justify-between px-2">
              <ThemeToggle />
              <AuthButtons />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
