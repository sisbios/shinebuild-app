'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@shinebuild/ui';

const NAV_ITEMS = [
  {
    href: '/agent/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/agent/leads',
    label: 'Leads',
    icon: (active: boolean) => (
      <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/agent/qr',
    label: 'QR Code',
    center: true,
    icon: (active: boolean) => (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
  },
  {
    href: '/agent/leads/new',
    label: 'New Lead',
    icon: (active: boolean) => (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: '/agent/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export function AgentNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 z-40 pb-safe">
      <div className="flex items-end justify-around px-2 pt-2 pb-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href) && !(item.href === '/agent/leads' && pathname.startsWith('/agent/leads/new'));
          const isQr = item.center;

          if (isQr) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-5"
              >
                <span className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all',
                  active
                    ? 'brand-gradient text-white shadow-orange-200'
                    : 'brand-gradient text-white'
                )}>
                  {item.icon(active)}
                </span>
                <span className="mt-1 text-xs font-medium text-gray-500">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-1 text-xs font-medium transition-colors rounded-xl mx-0.5',
                active ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <span className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
                active && 'bg-orange-50'
              )}>
                {item.icon(active)}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
