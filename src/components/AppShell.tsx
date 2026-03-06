'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith('/auth');
  // OBS overlay routes (/overlays/[id] and sub-routes) must render with no UI chrome
  const isOverlay = /^\/overlays\/.+/.test(pathname);

  if (isAuth || isOverlay) return <>{children}</>;

  return (
    <>
      <Navigation />
      <Sidebar />
      <div
        className="transition-[padding-left] duration-300 ease-in-out min-h-screen"
        style={{
          paddingTop: '5.5rem',
          paddingLeft: 'var(--sidebar-width, 240px)',
          backgroundColor: 'var(--surface-primary)',
          color: 'var(--text-primary)',
        }}
      >
        {children}
      </div>
    </>
  );
}
