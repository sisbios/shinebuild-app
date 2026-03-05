import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { Badge } from '@shinebuild/ui';

export const dynamic = 'force-dynamic';

export default async function AdminStaffPage() {
  const db = getAdminDb();
  let staff: Array<{ uid: string; name: string; phone: string; createdAt: Date }> = [];

  try {
    const snap = await db.collection(COLLECTIONS.USERS).where('role', '==', 'staff').get();
    staff = snap.docs.map((doc) => {
      const d = doc.data();
      return { uid: doc.id, name: d['name'], phone: d['phone'], createdAt: d['createdAt']?.toDate() ?? new Date() };
    });
  } catch {}

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map((s) => (
              <tr key={s.uid}>
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{s.createdAt.toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No staff members yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
