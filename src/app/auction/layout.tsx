'use client';

import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AuctionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
      <Navigation />

      {/* Sub Navigation */}
      <nav className="bg-neutral-800/50 backdrop-blur-sm border-b border-neutral-700 sticky top-[88px] z-30">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-2">
            <Link
              href="/auction"
              className={`px-6 py-3 font-semibold transition-all ${
                pathname === '/auction'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Auction Control
            </Link>
            <Link
              href="/auction/setup"
              className={`px-6 py-3 font-semibold transition-all ${
                pathname === '/auction/setup'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Auction Setup
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-6 min-h-screen bg-neutral-900">
        {children}
      </div>
    </div>
  );
}
