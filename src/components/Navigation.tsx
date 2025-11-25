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

const subnav = {
  auction: [
    { href: '/auction', label: 'Auction Control' },
    { href: '/auction/setup', label: 'Auction Setup' },
  ],
  manage: [
    { href: '/manage?view=tournaments', label: 'Tournament' },
    { href: '/manage?view=teams', label: 'Team' },
    { href: '/manage?view=players', label: 'Player' },
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
      fetch('/api/auction/bootstrap').catch(() => undefined);
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
    <Link href="/" className="flex items-center gap-3">
      <img
        src="https://res.cloudinary.com/diitsd6nz/image/upload/v1760794476/ProSteam_logo_h9pb8b.png"
        alt="ProStream Logo"
        className="h-10 w-10 object-contain"
      />
      <div>
        <p className="text-xl font-bold leading-tight">
          <span style={{ color: 'var(--brand-primary)' }}>Pro</span>
          <span style={{ color: 'var(--brand-secondary)' }}>Stream</span>
          <span style={{ color: 'var(--text-primary)' }}> Auction</span>
        </p>
      </div>
    </Link>
  );

  const LinkGroup = () => (
    <div className="flex items-center gap-6 text-sm font-semibold relative">
      {/* Auction trigger */}
      <div className="relative">
        <button
          ref={auctionBtnRef}
          aria-haspopup="menu"
          aria-expanded={openMenu === 'auction'}
          onClick={() => setOpenMenu(openMenu === 'auction' ? null : 'auction')}
          className={`transition-colors flex items-center gap-1 rounded-full px-3 py-1 ${
            isActive('/auction') ? 'text-brand-primary' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
          }`}
          style={{ backgroundColor: openMenu === 'auction' ? 'var(--surface-hover)' : 'transparent' }}
          onMouseEnter={(e) => {
            if (openMenu !== 'auction') e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
          }}
          onMouseLeave={(e) => {
            if (openMenu !== 'auction') e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>Auction</span>
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3"
            style={{
              transition: 'transform .2s ease',
              transform: openMenu === 'auction' ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
            aria-hidden="true"
          >
            <path
              d="M7 10l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {openMenu === 'auction' && (
          <div
            ref={dropdownRef}
            role="menu"
            className="absolute left-0 mt-3 min-w-[220px] rounded-2xl border p-2 shadow-2xl backdrop-blur"
            style={{
              borderColor: 'var(--nav-border)',
              backgroundColor: 'var(--nav-background)'
            }}
          >
            {subnav.auction.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  role="menuitem"
                  href={item.href}
                  className={`block rounded-xl px-3 py-2 transition-colors ${active ? 'font-semibold' : ''}`}
                  style={{
                    color: active ? 'var(--brand-primary)' : 'var(--text-secondary)'
                  }}
                  onClick={() => setOpenMenu(null)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Manage trigger */}
      <div className="relative">
        <button
          ref={manageBtnRef}
          aria-haspopup="menu"
          aria-expanded={openMenu === 'manage'}
          onClick={() => setOpenMenu(openMenu === 'manage' ? null : 'manage')}
          className={`transition-colors flex items-center gap-1 rounded-full px-3 py-1 ${
            isActive('/manage') ? 'text-brand-primary' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
          }`}
          style={{ backgroundColor: openMenu === 'manage' ? 'var(--surface-hover)' : 'transparent' }}
          onMouseEnter={(e) => {
            if (openMenu !== 'manage') e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
          }}
          onMouseLeave={(e) => {
            if (openMenu !== 'manage') e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>Manage</span>
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3"
            style={{
              transition: 'transform .2s ease',
              transform: openMenu === 'manage' ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
            aria-hidden="true"
          >
            <path
              d="M7 10l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {openMenu === 'manage' && (
          <div
            ref={dropdownRef}
            role="menu"
            className="absolute left-0 mt-3 min-w-[220px] rounded-2xl border p-2 shadow-2xl backdrop-blur"
            style={{
              borderColor: 'var(--nav-border)',
              backgroundColor: 'var(--nav-background)'
            }}
          >
            {subnav.manage.map((item) => {
              const active = pathname.startsWith('/manage') && pathname.includes(item.href.split('=')[1]?.split('&')[0] || '');
              return (
                <Link
                  key={item.href}
                  role="menuitem"
                  href={item.href}
                  className={`block rounded-xl px-3 py-2 transition-colors ${active ? 'font-semibold' : ''}`}
                  style={{
                    color: active ? 'var(--brand-primary)' : 'var(--text-secondary)'
                  }}
                  onClick={() => setOpenMenu(null)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Other links with tiny hover background */}
      {(() => {
        const list = ['/overlays', '/contact'] as const;
        const items = [...list];
        if (user?.role === 'Admin') items.splice(1, 0, '/users' as any);
        return items.map((href) => {
          const label = href === '/overlays' ? 'Overlays' : href === '/contact' ? 'Contact' : 'Users';
          return (
            <Link
              key={href}
              href={href}
              className={`transition-colors rounded-full px-3 py-1 ${
                isActive(href) ? 'text-brand-primary' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
              style={{ backgroundColor: isActive(href) ? 'var(--surface-hover)' : 'transparent' }}
              onMouseEnter={(e) => {
                if (!isActive(href)) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isActive(href)) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              {label}
            </Link>
          );
        });
      })()}
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
    <label className="inline-flex items-center relative cursor-pointer">
      <input
        type="checkbox"
        checked={theme === 'light'}
        onChange={toggleTheme}
        className="peer hidden"
        aria-label="Toggle theme"
      />
      <div className="relative w-[77px] h-[35px] bg-white peer-checked:bg-zinc-500 rounded-full after:absolute after:content-[''] after:w-[28px] after:h-[28px] after:bg-gradient-to-r from-orange-500 to-yellow-400 peer-checked:after:from-zinc-900 peer-checked:after:to-zinc-900 after:rounded-full after:top-[3.5px] after:left-[3.5px] active:after:w-[35px] peer-checked:after:left-[73.5px] peer-checked:after:translate-x-[-100%] shadow-sm duration-300 after:duration-300 after:shadow-md" />
      <svg
        height={0}
        width={100}
        viewBox="0 0 24 24"
        data-name="Layer 1"
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        className="fill-white peer-checked:opacity-60 absolute w-4 h-4 left-[9px]"
      >
        <path d="M12,17c-2.76,0-5-2.24-5-5s2.24-5,5-5,5,2.24,5,5-2.24,5-5,5ZM13,0h-2V5h2V0Zm0,19h-2v5h2v-5ZM5,11H0v2H5v-2Zm19,0h-5v2h5v-2Zm-2.81-6.78l-1.41-1.41-3.54,3.54,1.41,1.41,3.54-3.54ZM7.76,17.66l-1.41-1.41-3.54,3.54,1.41,1.41,3.54-3.54Zm0-11.31l-3.54-3.54-1.41,1.41,3.54,3.54,1.41-1.41Zm13.44,13.44l-3.54-3.54-1.41,1.41,3.54,3.54,1.41-1.41Z" />
      </svg>
      <svg
        height={512}
        width={512}
        viewBox="0 0 24 24"
        data-name="Layer 1"
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        className="fill-black opacity-60 peer-checked:opacity-70 peer-checked:fill-white absolute w-4 h-4 right-[9px]"
      >
        <path d="M12.009,24A12.067,12.067,0,0,1,.075,10.725,12.121,12.121,0,0,1,10.1.152a13,13,0,0,1,5.03.206,2.5,2.5,0,0,1,1.8,1.8,2.47,2.47,0,0,1-.7,2.425c-4.559,4.168-4.165,10.645.807,14.412h0a2.5,2.5,0,0,1-.7,4.319A13.875,13.875,0,0,1,12.009,24Zm.074-22a10.776,10.776,0,0,0-1.675.127,10.1,10.1,0,0,0-8.344,8.8A9.928,9.928,0,0,0,4.581,18.7a10.473,10.473,0,0,0,11.093,2.734.5.5,0,0,0,.138-.856h0C9.883,16.1,9.417,8.087,14.865,3.124a.459.459,0,0,0,.127-.465.491.491,0,0,0-.356-.362A10.68,10.68,0,0,0,12.083,2ZM20.5,12a1,1,0,0,1-.97-.757l-.358-1.43L17.74,9.428a1,1,0,0,1,.035-1.94l1.4-.325.351-1.406a1,1,0,0,1,1.94,0l.355,1.418,1.418.355a1,1,0,0,1,0,1.94l-1.418.355-.355,1.418A1,1,0,0,1,20.5,12ZM16,14a1,1,0,0,0,2,0A1,1,0,0,0,16,14Zm6,4a1,1,0,0,0,2,0A1,1,0,0,0,22,18Z" />
      </svg>
    </label>
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
          <div className="grid gap-3">
            {/* Auction collapsible */}
            <div className="rounded-2xl p-4 font-semibold transition" style={{ border: `1px solid var(--border-primary)` }}>
              <button className="w-full text-left flex items-center justify-between" onClick={() => setMobileAuctionOpen((v) => !v)} style={{ color: 'var(--text-primary)' }}>
                <span>Auction</span>
                <span>{mobileAuctionOpen ? '▾' : '▸'}</span>
              </button>
              {mobileAuctionOpen && (
                <div className="mt-3 grid gap-2">
                  {subnav.auction.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-xl px-3 py-2"
                      style={{
                        border: `1px solid var(--border-primary)`,
                        color: pathname.startsWith(item.href) ? 'var(--brand-primary)' : 'var(--text-secondary)'
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Manage collapsible */}
            <div className="rounded-2xl p-4 font-semibold transition" style={{ border: `1px solid var(--border-primary)` }}>
              <button className="w-full text-left flex items-center justify-between" onClick={() => setMobileManageOpen((v) => !v)} style={{ color: 'var(--text-primary)' }}>
                <span>Manage</span>
                <span>{mobileManageOpen ? '▾' : '▸'}</span>
              </button>
              {mobileManageOpen && (
                <div className="mt-3 grid gap-2">
                  {subnav.manage.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-xl px-3 py-2"
                      style={{
                        border: `1px solid var(--border-primary)`,
                        color: pathname.startsWith('/manage') && pathname.includes(item.href.split('=')[1]?.split('&')[0] || '') ? 'var(--brand-primary)' : 'var(--text-secondary)'
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Other single links */}
            {(() => {
              const base = [{href:'/overlays', label:'Overlays'}, {href:'/contact', label:'Contact'}];
              const list = user?.role === 'Admin' ? [...base.slice(0,1), {href:'/users', label:'Users'}, ...base.slice(1)] : base;
              return list.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl p-4 font-semibold transition"
                  style={{
                    border: `1px solid var(--border-primary)`,
                    backgroundColor: isActive(link.href) ? 'var(--surface-hover)' : 'transparent',
                    color: isActive(link.href) ? 'var(--brand-primary)' : 'var(--text-primary)'
                  }}
                >
                  {link.label}
                </Link>
              ));
            })()}
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
