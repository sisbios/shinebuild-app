import { requireRole } from '@/lib/session';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin', 'superadmin');

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Shine Build Hub — Admin</h1>
          <nav className="flex gap-4 text-sm text-gray-600">
            <Link href="/admin/dashboard" className="hover:text-orange-600">Dashboard</Link>
            <Link href="/admin/leads" className="hover:text-orange-600">Leads</Link>
            <Link href="/admin/agents" className="hover:text-orange-600">Agents</Link>
            <Link href="/admin/incentives" className="hover:text-orange-600">Incentives</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
