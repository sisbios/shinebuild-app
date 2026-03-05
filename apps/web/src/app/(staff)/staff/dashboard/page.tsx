import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function StaffDashboardPage() {
  const session = await getServerSession();
  const db = getAdminDb();
  let assignedCount = 0;

  try {
    const snap = await db
      .collection(COLLECTIONS.LEADS)
      .where('assignedStaffIds', 'array-contains', session!.uid)
      .where('status.current', 'in', ['new', 'contacted'])
      .count()
      .get();
    assignedCount = snap.data().count;
  } catch {}

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <p className="text-2xl font-bold text-orange-600">{assignedCount}</p>
        <p className="text-sm text-gray-600">Leads assigned to you</p>
      </div>
      <Link href="/staff/leads" className="block rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm">
        <p className="font-semibold text-gray-900">View My Leads</p>
        <p className="text-sm text-gray-500">Update status and QC notes</p>
      </Link>
    </div>
  );
}
