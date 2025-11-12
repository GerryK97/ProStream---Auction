'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProStreamIcon } from './icons';

const Navigation: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header className="bg-neutral-900/50 backdrop-blur-sm border-b border-neutral-700 sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4">
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/diitsd6nz/image/upload/v1760794476/ProSteam_logo_h9pb8b.png"
              alt="ProStream Logo"
              className="h-10 w-10 object-contain"
            />
            <h1 className="text-2xl font-bold">
              <span style={{ color: '#0F84D0' }}>Pro</span><span style={{ color: '#78CA2A' }}>Stream</span> Auction
            </h1>
          </div>

          {/* Center: Main Navigation */}
          <nav className="flex items-center justify-center gap-6">
            <Link
              href="/auction"
              className={`px-3 py-2 font-semibold transition-all ${
                isActive('/auction')
                  ? 'text-brand-primary'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Auction
            </Link>
            <Link
              href="/manage"
              className={`px-3 py-2 font-semibold transition-all ${
                isActive('/manage')
                  ? 'text-brand-primary'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Manage
            </Link>
            <Link
              href="/overlays"
              className={`px-3 py-2 font-semibold transition-all ${
                isActive('/overlays')
                  ? 'text-brand-primary'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Overlays
            </Link>
            <Link
              href="/users"
              className={`px-3 py-2 font-semibold transition-all ${
                isActive('/users')
                  ? 'text-brand-primary'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Users
            </Link>
          </nav>

          {/* Right: User Info and Logout */}
          <div className="flex items-center justify-end gap-4">
            <div className="bg-neutral-800 px-4 py-2 rounded-lg border border-neutral-700">
              <p className="text-sm text-neutral-400">Logged in as</p>
              <p className="font-semibold">Admin User</p>
            </div>
            <button className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
