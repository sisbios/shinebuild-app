import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import Link from 'next/link';
import type { LeadStatus } from '@shinebuild/shared';

export const dynamic = 'force-dynamic';

export default async function StaffLeadsPage() {
  const session = await getServerSession();
  const db = getAdminDb();
  let leads: Array<{ id: string; customerName: string; city: string; status: LeadStatus; createdAt: Date }> = [];

  try {
    const snap = await db
      .collection(COLLECTIONS.LEADS)
      .where('assignedStaffIds', 'array-contains', session!.uid)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    leads = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        customerName: d['customer']?.['name'] ?? '—',
        city: d['city'],
        status: d['status']?.['current'] as LeadStatus,
        createdAt: d['createdAt']?.toDate() ?? new Date(),
      };
    });
  } catch {}

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">My Leads</h1>
      <div className="space-y-2">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/staff/leads/${lead.id}`}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:shadow-sm"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{lead.customerName}</p>
              <p className="text-xs text-gray-500">{lead.city} · {lead.createdAt.toLocaleDateString('en-IN')}</p>
            </div>
            <LeadStatusBadge status={lead.status} />
          </Link>
        ))}
        {leads.length === 0 && (
          <p className="py-8 text-center text-gray-400 text-sm">No leads assigned to you yet</p>
        )}
      </div>
    </div>
  );
}
