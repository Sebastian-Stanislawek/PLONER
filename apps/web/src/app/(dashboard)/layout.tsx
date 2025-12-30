'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Panel główny', icon: '📊' },
  { href: '/gospodarstwo', label: 'Gospodarstwo', icon: '🏠' },
  { href: '/zwierzeta', label: 'Zwierzęta', icon: '🐄' },
  { href: '/zgloszenia', label: 'Zgłoszenia', icon: '📝' },
  { href: '/archiwum', label: 'Archiwum', icon: '📁' },
  { href: '/wiedza', label: 'Strefa Wiedzy', icon: '📚' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Zamknij sidebar przy zmianie strony na mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200 flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-xl font-bold text-emerald-700">🌾 Ploner</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-100">
          <Link
            href="/ustawienia"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-2 ${
              pathname === '/ustawienia' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>⚙️</span>
            Ustawienia
          </Link>

          <div className="px-3 py-2 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email || 'Użytkownik'}
            </p>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 mt-1"
            >
              Wyloguj się
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Wyloguj
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 bg-gray-50 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
