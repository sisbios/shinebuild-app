'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@shinebuild/ui';
import { LogoutButton } from '@/components/shared/LogoutButton';
import { SuperAdminNav } from '@/app/(superadmin)/superadmin/SuperAdminNav';

const NAV = [
  {
    href: '/admin/dashboard', label: 'Home',
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    href: '/admin/leads', label: 'Leads',
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    href: '/admin/agents', label: 'Agents',
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    href: '/admin/staff', label: 'Staff',
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6a4 4 0 11-8 0 4 4 0 018 0zM12 11c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z" /></svg>,
  },
];

const SIDE_EXTRAS = [
  {
    href: '/admin/incentives', label: 'Incentives',
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
];

interface Props { role: string; }

export function AdminNav({ role }: Props) {
  // Superadmin always sees the unified superadmin nav regardless of which section they're in
  if (role === 'superadmin') return <SuperAdminNav />;

  const pathname = usePathname();

  return (
    <>
      {/* ─── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col glass-header">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/30">
          <div className="h-9 w-9 brand-gradient rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div><p className="text-sm font-bold text-gray-900">Shine Build Hub</p><p className="text-xs text-gray-400 capitalize">{role}</p></div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {[...NAV, ...SIDE_EXTRAS].map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active ? 'bg-red-700/10 text-red-800' : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
              )}>
                <span className={cn('flex-shrink-0', active ? 'text-red-700' : 'text-gray-400')}>{item.icon}</span>
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-700" />}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/30">
          <Link href="/login" className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 rounded-lg px-2 py-1.5 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign out
          </Link>
        </div>
      </aside>

      {/* ─── Mobile top mini-header ──────────────────────── */}
      <header className="glass-header fixed top-0 left-0 right-0 z-40 flex items-center px-4 py-2.5 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 brand-gradient rounded-lg flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900">Shine Build Hub</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400 capitalize bg-red-50 px-2 py-1 rounded-lg">{role}</span>
          <LogoutButton />
        </div>
      </header>

      {/* ─── Mobile bottom nav — 4 round icons ──────────── */}
      <nav className="glass-nav fixed bottom-0 left-0 right-0 z-40 pb-safe lg:hidden">
        <div className="flex items-center justify-around px-4 pt-2 pb-2">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-1 min-w-0"
              >
                <span className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl transition-all',
                  active
                    ? 'brand-gradient text-white shadow-lg shadow-red-200/60'
                    : 'bg-white/60 text-gray-500 hover:bg-red-50 hover:text-red-700'
                )}>
                  {item.icon}
                </span>
                <span className={cn('text-[10px] font-semibold', active ? 'text-red-800' : 'text-gray-400')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
