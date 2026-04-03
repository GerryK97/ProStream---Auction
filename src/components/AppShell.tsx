'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith('/auth');
  // OBS overlay routes (/overlays/[id] and sub-routes) must render with no UI chrome
  const isOverlay = /^\/overlays\/.+/.test(pathname);
  // Mobile auction page — full width, no sidebar offset
  const isMobileAuction = pathname === '/manage/auction-mobile';

  if (isAuth || isOverlay) return <>{children}</>;

  return (
    <>
      <Navigation />
      <Sidebar />
      <div
        className={`${isMobileAuction ? '' : 'transition-[padding-left] duration-300 ease-in-out'} min-h-screen`}
        style={{
          paddingTop: '5.5rem',
          paddingLeft: isMobileAuction ? '0' : 'var(--sidebar-width, 240px)',
          backgroundColor: 'var(--surface-primary)',
          color: 'var(--text-primary)',
        }}
      >
        {children}
      </div>
    </>
  );
}
