'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';

const NAV_GROUPS = [
  {
    label: 'Auction Workflow',
    items: [
      {
        label: 'Auction',
        href: '/auction',
        roles: null,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            <path d="M13 13l6 6" />
          </svg>
        ),
      },
      {
        label: 'Tournaments',
        href: '/manage/tournaments',
        roles: ['Admin', 'Tournament'],
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0012 0V2z" />
          </svg>
        ),
      },
      {
        label: 'Teams',
        href: '/manage/teams',
        roles: ['Admin', 'Tournament'],
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        ),
      },
      {
        label: 'Players',
        href: '/manage/players',
        roles: ['Admin', 'Tournament'],
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <circle cx="12" cy="8" r="5" />
            <path d="M20 21a8 8 0 10-16 0" />
          </svg>
        ),
      },
      {
        label: 'Overlays',
        href: '/output',
        roles: null,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        ),
      },
      {
        label: 'Auction Results',
        href: '/manage/auction-results',
        roles: ['Admin', 'Tournament'],
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
      {
        label: 'Wallet',
        href: '/wallet',
        roles: null,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
            <path d="M16 15h2" />
          </svg>
        ),
      },
    ],
  },
  {
    label: null,
    items: [
      {
        label: 'InvoiceIt',
        href: '/invoiceit',
        roles: null,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
        ),
      },
    ],
  },
  {
    label: null,
    items: [
      {
        label: 'OBS Sessions',
        href: '/manage/overlays/sessions',
        roles: ['Admin'],
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        ),
      },
      {
        label: 'Users',
        href: '/users',
        roles: ['Admin'],
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
      {
        label: 'Contact',
        href: '/contact',
        roles: null,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        ),
      },
      {
        label: 'Profile',
        href: '/profile',
        roles: null,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isOpen, toggle } = useSidebar();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      // Only close if it was open on mobile (overlay mode)
    }
  }, [pathname]);

  if (pathname.startsWith('/auth')) return null;

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

  const filterItems = (items: typeof NAV_GROUPS[0]['items']) =>
    items.filter(item => {
      if (!item.roles) return true;
      return user && (item.roles as string[]).includes(user.role);
    });

  const visibleGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: filterItems(group.items),
  })).filter(group => group.items.length > 0);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggle}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed left-0 z-40 flex flex-col
          border-r overflow-hidden
          transition-[width] duration-300 ease-in-out
          ${isOpen ? 'w-60' : 'w-0 md:w-16'}
        `}
        style={{
          top: '5.5rem',
          height: 'calc(100vh - 5.5rem)',
          backgroundColor: 'var(--surface-secondary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          {visibleGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Divider between groups */}
              {groupIndex > 0 && (
                <hr
                  className="mx-3 my-2"
                  style={{ borderColor: 'var(--border-primary)' }}
                />
              )}

              {/* Section label (only for named groups, only when expanded) */}
              {group.label && isOpen && (
                <p
                  className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest select-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {group.label}
                </p>
              )}

              {/* Items */}
              {group.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={!isOpen ? item.label : undefined}
                    className={`
                      group flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg
                      transition-all duration-200 whitespace-nowrap
                      ${active ? 'font-semibold' : 'hover:bg-surface-hover'}
                    `}
                    style={{
                      color: active ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      backgroundColor: active ? 'rgba(79, 70, 229, 0.12)' : undefined,
                    }}
                  >
                    <span
                      style={{ color: active ? 'var(--brand-primary)' : 'var(--text-muted)' }}
                      className="transition-colors duration-200 group-hover:text-[var(--text-primary)]"
                    >
                      {item.icon}
                    </span>
                    <span
                      className={`text-sm transition-[opacity,transform] duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none absolute'}`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Toggle button at bottom */}
        <div
          className="shrink-0 border-t flex items-center justify-end px-3 py-3"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-200"
            style={{ color: 'var(--text-muted)' }}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
