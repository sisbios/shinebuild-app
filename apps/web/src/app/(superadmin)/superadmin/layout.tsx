import { requireRole } from '@/lib/session';
import { SuperAdminNav } from './SuperAdminNav';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('superadmin');

  return (
    <div className="min-h-svh bg-mesh">
      <SuperAdminNav />
      <main className="lg:pl-64 pt-14 lg:pt-0 pb-24 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
