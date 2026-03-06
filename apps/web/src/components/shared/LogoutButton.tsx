'use client';

import { useRouter } from 'next/navigation';
import { destroySession } from '@/app/(public)/login/actions';

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  const handle = async () => {
    await destroySession();
    router.push('/login');
  };

  return (
    <button
      onClick={handle}
      title="Sign out"
      className={className ?? 'flex h-9 w-9 items-center justify-center rounded-xl bg-white/60 text-gray-500 hover:bg-red-50 hover:text-red-700 transition-all active:scale-95'}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    </button>
  );
}
