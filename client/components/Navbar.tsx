'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-dark-card border-b border-dark-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gold hover:text-opacity-80 transition">
          ✈️ Filght
        </Link>

        <div className="flex gap-6 items-center">
          <Link
            href="/search"
            className="text-gray-300 hover:text-gold transition-colors"
          >
            Search Flights
          </Link>

          {isAuthenticated && (
            <Link
              href="/dashboard"
              className="text-gray-300 hover:text-gold transition-colors"
            >
              Dashboard
            </Link>
          )}

          <div className="flex gap-3">
            {isAuthenticated && (
              <>
                <span className="text-gray-400">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
