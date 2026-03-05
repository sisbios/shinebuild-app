import { requireRole } from '@/lib/session';
import Link from 'next/link';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireRole('staff');

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Shine Build Hub — Staff</h1>
          <nav className="flex gap-4 text-sm text-gray-600">
            <Link href="/staff/dashboard" className="hover:text-orange-600">Dashboard</Link>
            <Link href="/staff/leads" className="hover:text-orange-600">My Leads</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
