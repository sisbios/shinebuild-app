import { requireRole, getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { StaffNav } from './StaffNav';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireRole('staff');
  const session = await getServerSession();
  const db = getAdminDb();

  // Fetch pending lead count for the badge on nav.
  // Use single-field where only — compound where+array-contains needs a composite index.
  // Count pending status in memory.
  let pendingCount = 0;
  try {
    const snap = await db
      .collection(COLLECTIONS.LEADS)
      .where('assignedStaffIds', 'array-contains', session!.uid)
      .get();
    pendingCount = snap.docs.filter((d) => {
      const s = d.data()['status']?.['current'];
      return s === 'new' || s === 'contacted';
    }).length;
  } catch { /* non-critical */ }

  return (
    <div className="min-h-svh bg-mesh">
      <StaffNav pendingCount={pendingCount} />
      {/* pt-14: offset fixed top header; pb-20: offset mobile bottom nav */}
      <main className="pt-14 pb-20 sm:pb-6">
        <div className="max-w-5xl mx-auto px-4 py-5 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
