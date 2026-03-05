import { requireRole } from '@/lib/session';
import { AdminNav } from './AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('admin', 'superadmin');

  return (
    <div className="min-h-svh bg-mesh">
      <AdminNav role={session?.role ?? 'admin'} />
      <div className="lg:pl-64">
        <main className="min-h-svh pt-16 lg:pt-0">
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
