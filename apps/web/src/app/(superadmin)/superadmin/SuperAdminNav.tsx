'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const NAV_ITEMS = [
  {
    href: '/superadmin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/superadmin/reports',
    label: 'Reports',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/superadmin/settings',
    label: 'Settings',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/admin/dashboard',
    label: 'Admin',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function SuperAdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-40 glass-card border-r border-white/40">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/30">
          <div className="h-9 w-9 rounded-xl brand-gradient flex items-center justify-center shadow-md">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Super Admin</p>
            <p className="text-xs text-gray-500">Shine Build Hub</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                  active ? 'brand-gradient text-white shadow-md' : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                )}
              >
                <span className={cn('flex-shrink-0', active ? 'text-white' : 'text-gray-400')}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-5 pt-2 border-t border-white/30">
          <span className="text-xs font-medium text-gray-400 bg-red-50 px-2 py-1 rounded-lg">superadmin</span>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden glass-header fixed top-0 inset-x-0 z-40 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg brand-gradient flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900">Super Admin</span>
        </div>
        <span className="text-xs text-gray-400 bg-red-50 px-2 py-1 rounded-lg font-medium">superadmin</span>
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden glass-nav fixed bottom-0 inset-x-0 z-40 pb-safe">
        <div className="flex items-center justify-around px-2 h-16">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 min-w-[60px]"
              >
                <span className={cn(
                  'h-10 w-10 rounded-2xl flex items-center justify-center transition-all',
                  active ? 'brand-gradient text-white shadow-lg' : 'bg-white/60 text-gray-500 hover:bg-red-50 hover:text-red-700'
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
