'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';

interface NavItem { label: string; href: string; icon: string }

interface PortalLayoutProps {
  children: React.ReactNode;
  role: 'EMPLOYER' | 'HELPER' | 'BROKER' | 'ADMIN';
  navItems: NavItem[];
}

const roleColors: Record<string, string> = {
  EMPLOYER: 'from-brand-700 to-brand-600',
  HELPER: 'from-emerald-700 to-emerald-600',
  BROKER: 'from-purple-700 to-purple-600',
  ADMIN: 'from-gray-800 to-gray-700',
};

export default function PortalLayout({ children, role, navItems }: PortalLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, role: userRole, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (userRole !== role) {
      const map: Record<string, string> = {
        EMPLOYER: '/employer/dashboard',
        HELPER: '/helper/dashboard',
        BROKER: '/broker/dashboard',
        ADMIN: '/admin/dashboard',
      };
      router.replace(map[userRole!] || '/login');
    }
  }, [isAuthenticated, userRole]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`w-64 flex flex-col bg-gradient-to-b ${roleColors[role]} text-white`}>
        <div className="px-6 py-5 border-b border-white/20">
          <Link href="/" className="text-xl font-bold">MatchAI</Link>
          <div className="mt-1 text-xs font-medium text-white/60 uppercase tracking-wider">{role} Portal</div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 pb-6">
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
