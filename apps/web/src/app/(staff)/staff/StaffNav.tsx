'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/shared/LogoutButton';

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

const NAV = [
  {
    href: '/staff/dashboard',
    label: 'Dashboard',
    icon: (active: boolean) => (
      <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/staff/leads',
    label: 'My Leads',
    icon: (active: boolean) => (
      <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

export function StaffNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop / Tablet top header ── */}
      <header className="glass-header fixed top-0 inset-x-0 z-40 h-14 flex items-center px-4 lg:px-8">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-8 w-8 rounded-xl brand-gradient flex items-center justify-center shadow-md flex-shrink-0">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-900 leading-none">Shine Build Hub</p>
            <p className="text-[10px] text-gray-500">Staff Portal</p>
          </div>
        </div>

        {/* Desktop nav links */}
        <nav className="hidden sm:flex items-center gap-1 mr-3">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all',
                  active
                    ? 'brand-gradient text-white shadow-md'
                    : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                )}
              >
                <span className={active ? 'text-white' : 'text-gray-400'}>{item.icon(active)}</span>
                {item.label}
                {item.label === 'My Leads' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">staff</span>
          <LogoutButton />
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="sm:hidden glass-nav fixed bottom-0 inset-x-0 z-40 pb-safe">
        <div className="flex items-center justify-around px-4 h-16">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-0.5 py-1 min-w-[64px]"
              >
                <span className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl transition-all',
                  active ? 'brand-gradient text-white shadow-lg' : 'text-gray-400'
                )}>
                  {item.icon(active)}
                </span>
                <span className={cn('text-[10px] font-semibold', active ? 'text-red-800' : 'text-gray-400')}>
                  {item.label}
                </span>
                {item.label === 'My Leads' && pendingCount > 0 && (
                  <span className="absolute top-0.5 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
