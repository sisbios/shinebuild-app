import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import Link from 'next/link';
import type { LeadStatus } from '@shinebuild/shared';
import { QuickStatusButtons } from '@/app/(staff)/staff/leads/QuickStatusButtons';

export const dynamic = 'force-dynamic';

export default async function StaffDashboardPage() {
  const session = await getServerSession();
  const db = getAdminDb();

  let staffName = '';
  let totalAssigned = 0;
  let pendingCount = 0;
  let qualifiedCount = 0;
  let rejectedCount = 0;
  type RecentLead = { id: string; customerName: string; customerPhone: string; city: string; status: LeadStatus; createdAt: Date };
  let recentLeads: RecentLead[] = [];

  try {
    const [userSnap, allLeadsSnap] = await Promise.all([
      db.collection(COLLECTIONS.USERS).doc(session!.uid).get(),
      db.collection(COLLECTIONS.LEADS)
        .where('assignedStaffIds', 'array-contains', session!.uid)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get(),
    ]);

    staffName = userSnap.data()?.['name'] ?? '';
    totalAssigned = allLeadsSnap.size;

    for (const doc of allLeadsSnap.docs) {
      const st = doc.data()['status']?.['current'] as LeadStatus;
      if (st === 'new' || st === 'contacted') pendingCount++;
      else if (st === 'qualified') qualifiedCount++;
      else if (st === 'rejected') rejectedCount++;
    }

    // Latest 5 pending leads for quick actions
    recentLeads = allLeadsSnap.docs
      .filter((doc) => {
        const st = doc.data()['status']?.['current'] as LeadStatus;
        return st === 'new' || st === 'contacted';
      })
      .slice(0, 5)
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          customerName: d['customer']?.['name'] ?? '—',
          customerPhone: d['customer']?.['phoneE164'] ?? '',
          city: d['city'] ?? '',
          status: d['status']?.['current'] as LeadStatus,
          createdAt: d['createdAt']?.toDate() ?? new Date(),
        };
      });
  } catch (e) {
    console.error('StaffDashboard error:', e);
  }

  const firstName = staffName.split(' ')[0] || 'Staff';

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-sm text-gray-500">Welcome back,</p>
        <h1 className="text-2xl font-bold text-gray-900">{firstName}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Assigned" value={totalAssigned} color="text-gray-900" bg="bg-gray-50" />
        <StatCard label="Pending" value={pendingCount} color="text-orange-700" bg="bg-orange-50" />
        <StatCard label="Qualified" value={qualifiedCount} color="text-green-700" bg="bg-green-50" />
        <StatCard label="Rejected" value={rejectedCount} color="text-red-700" bg="bg-red-50" />
      </div>

      {/* Action required */}
      {recentLeads.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Action Required</h2>
            <Link href="/staff/leads" className="text-xs text-red-700 font-medium hover:underline">View all</Link>
          </div>

          <div className="space-y-2">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/staff/leads/${lead.id}`}
                        className="font-semibold text-gray-900 hover:text-red-800 truncate text-sm"
                      >
                        {lead.customerName}
                      </Link>
                      <LeadStatusBadge status={lead.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{lead.city}</p>
                  </div>

                  {lead.customerPhone && (
                    <a
                      href={`tel:${lead.customerPhone}`}
                      className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors"
                      title={`Call ${lead.customerPhone}`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </a>
                  )}
                </div>

                <QuickStatusButtons leadId={lead.id} status={lead.status} />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="text-sm font-semibold text-green-700">All caught up!</p>
          <p className="text-xs text-green-600 mt-0.5">No leads requiring action right now.</p>
        </div>
      )}

      <Link
        href="/staff/leads"
        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:shadow-sm"
      >
        <div>
          <p className="font-semibold text-gray-900 text-sm">View All My Leads</p>
          <p className="text-xs text-gray-500">Full list with filters</p>
        </div>
        <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`rounded-2xl ${bg} border border-gray-100 p-3 text-center`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
