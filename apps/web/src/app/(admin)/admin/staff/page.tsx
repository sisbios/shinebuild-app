import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';
import { AddStaffForm } from './AddStaffForm';
import { StaffActions } from './StaffActions';

export const dynamic = 'force-dynamic';

export default async function AdminStaffPage() {
  const db = getAdminDb();
  let staff: Array<{
    uid: string; name: string; phone: string; status: string;
    createdAt: Date; leadCount: number;
  }> = [];

  try {
    const snap = await db.collection(COLLECTIONS.USERS).where('role', '==', 'staff').get();
    const members = snap.docs.map((doc) => {
      const d = doc.data();
      return { uid: doc.id, name: d['name'] ?? '—', phone: d['phone'] ?? '—', status: d['status'] ?? 'active', createdAt: d['createdAt']?.toDate() ?? new Date(), leadCount: 0 };
    });
    // Fetch lead counts in parallel
    const counts = await Promise.all(
      members.map((m) =>
        db.collection(COLLECTIONS.LEADS).where('assignedStaffIds', 'array-contains', m.uid).get()
          .then((s) => s.size).catch(() => 0)
      )
    );
    staff = members.map((m, i) => ({ ...m, leadCount: counts[i] }));
    staff.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (err) {
    console.error('AdminStaffPage error:', err);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{staff.length} member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <AddStaffForm />
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/40">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Name</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hidden md:table-cell">Leads Assigned</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hidden lg:table-cell">Joined</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/30">
              {staff.map((s) => (
                <tr key={s.uid} className="hover:bg-white/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 truncate">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{s.phone}</td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <Link href={`/admin/leads?assignedStaff=${s.uid}`} className="text-red-800 hover:underline font-medium">
                      {s.leadCount} leads
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400 hidden lg:table-cell">
                    {s.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <StaffActions uid={s.uid} name={s.name} currentStatus={s.status} />
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No staff members yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
