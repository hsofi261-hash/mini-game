'use client'

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCheckUserQuery, useLogoutMutation } from '@/lib/service/authApi';

export default function Navbar() {
  const { data: authData, isLoading, isError } = useCheckUserQuery(undefined);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const router = useRouter();

  // Extract user safely from response
  const user = authData?.user;
  const displayName = user?.username || user?.email || 'Player';

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      router.push('/auth');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Clickable Brand Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2 font-bold text-xl tracking-tight text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span className="text-2xl">🎮</span> Mini Arcade
        </Link>

        <div>
          {isLoading ? (
            <div className="h-9 w-20 bg-slate-800 animate-pulse rounded-lg" />
          ) : user && !isError ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-300">
                {displayName}
              </span>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isLoggingOut ? 'Leaving...' : 'Logout'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/auth')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}