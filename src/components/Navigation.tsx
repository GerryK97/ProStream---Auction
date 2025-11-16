'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const isActive = (path: string) => pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    router.push('/auth/login');
  };

  // Don't show navigation on auth pages
  if (pathname.startsWith('/auth')) {
    return null;
  }

  if (isLoading) {
    return (
      <header className="bg-neutral-900/50 backdrop-blur-sm border-b border-neutral-700 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
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
            <div className="text-center text-neutral-400">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

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
              <span style={{ color: '#0F84D0' }}>Pro</span>
              <span style={{ color: '#78CA2A' }}>Stream</span> Auction
            </h1>
          </div>

          {/* Center: Main Navigation */}
          <nav className="flex items-center justify-center gap-6">
            {user?.role !== 'Player' && user?.role !== 'Audience' && (
              <>
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
              </>
            )}
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
            {user?.role === 'Admin' && (
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
            )}
          </nav>

          {/* Right: User Info and Logout */}
          <div className="flex items-center justify-end gap-4">
            {user ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg border border-neutral-700 transition-colors"
                  >
                    <p className="text-sm text-neutral-400">Logged in as</p>
                    <p className="font-semibold text-white">{user.username}</p>
                    <p className="text-xs text-neutral-500">{user.role}</p>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg overflow-hidden">
                      <div className="px-4 py-3 border-b border-neutral-700">
                        <p className="text-sm text-neutral-400">Email</p>
                        <p className="text-sm text-white truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
