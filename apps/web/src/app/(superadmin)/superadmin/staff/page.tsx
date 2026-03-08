import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { getServerSession } from '@/lib/session';
import Link from 'next/link';
import { AddStaffForm } from '@/app/(admin)/admin/staff/AddStaffForm';
import { SuperAdminStaffActions } from '@/app/(admin)/admin/staff/SuperAdminStaffActions';

export const dynamic = 'force-dynamic';
const cnt = (q: any): Promise<number> => q.count().get().then((s: any) => s.data().count as number);

const ROLE_COLORS: Record<string, string> = {
  staff: 'bg-gray-100 text-gray-700',
  admin: 'bg-blue-50 text-blue-700',
  superadmin: 'bg-purple-50 text-purple-700',
};

export default async function SuperAdminStaffPage() {
  const session = await getServerSession();
  const db = getAdminDb();

  let staff: Array<{
    uid: string; name: string; phone: string; role: string; status: string;
    createdAt: Date; leadCount: number; assignedForAssessment: boolean;
  }> = [];

  try {
    const snap = await db
      .collection(COLLECTIONS.USERS)
      .where('role', 'in', ['staff', 'admin', 'superadmin'])
      .get();

    const members = snap.docs
      .filter((doc) => doc.id !== session?.uid) // never show yourself
      .map((doc) => {
        const d = doc.data();
        return {
          uid: doc.id,
          name: d['name'] ?? '—',
          phone: d['phone'] ?? '—',
          role: d['role'] ?? 'staff',
          status: d['status'] ?? 'active',
          createdAt: d['createdAt']?.toDate() ?? new Date(),
          leadCount: 0,
          assignedForAssessment: d['assignedForAssessment'] ?? false,
        };
      });

    const counts = await Promise.all(
      members.map((m) =>
        cnt(db.collection(COLLECTIONS.LEADS).where('assignedStaffIds', 'array-contains', m.uid)).catch(() => 0)
      )
    );
    staff = members.map((m, i) => ({ ...m, leadCount: counts[i] }));
    staff.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (err) {
    console.error('SuperAdminStaffPage error:', err);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{staff.length} user{staff.length !== 1 ? 's' : ''} — full superadmin controls</p>
        </div>
        <AddStaffForm isSuperAdmin />
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {staff.length === 0 ? (
          <p className="py-10 text-center text-gray-400 text-sm">No users found.</p>
        ) : staff.map((s) => (
          <div key={s.uid} className="glass-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full brand-gradient flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_COLORS[s.role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {s.role}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>{s.status}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Link href={`/admin/leads?assignedStaff=${s.uid}`} className="text-red-700 font-medium">{s.leadCount} leads</Link>
                <span>{s.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
              </div>
              <SuperAdminStaffActions
                uid={s.uid}
                name={s.name}
                phone={s.phone}
                role={s.role}
                leadCount={s.leadCount}
                otherStaff={staff.filter((o) => o.uid !== s.uid && o.status === 'active')}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/40">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Name</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Role</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hidden md:table-cell">Leads</th>
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
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${ROLE_COLORS[s.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {s.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
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
                    <SuperAdminStaffActions
                      uid={s.uid}
                      name={s.name}
                      phone={s.phone}
                      role={s.role}
                      leadCount={s.leadCount}
                      otherStaff={staff.filter((o) => o.uid !== s.uid && o.status === 'active')}
                    />
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
