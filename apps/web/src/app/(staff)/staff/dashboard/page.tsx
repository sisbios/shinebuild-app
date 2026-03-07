import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import type { LeadStatus } from '@shinebuild/shared';
import { LeadCard } from '@/app/(staff)/staff/leads/LeadCard';

export const dynamic = 'force-dynamic';

// Sort order: pending first, then contacted, then qualified, then rejected
const STATUS_ORDER: Record<LeadStatus, number> = {
  new: 0, contacted: 1, qualified: 2, converted: 3, rejected: 4, duplicate: 5,
};

export default async function StaffDashboardPage() {
  const session = await getServerSession();
  const db = getAdminDb();

  let staffName = '';
  let totalAssigned = 0;
  let pendingCount = 0;
  let qualifiedCount = 0;
  let rejectedCount = 0;

  type LeadRow = {
    id: string; customerName: string; customerPhone: string;
    city: string; status: LeadStatus; requirementNotes: string; createdAt: Date;
  };
  let leads: LeadRow[] = [];

  try {
    const [userSnap, leadsSnap] = await Promise.all([
      db.collection(COLLECTIONS.USERS).doc(session!.uid).get(),
      db.collection(COLLECTIONS.LEADS)
        .where('assignedStaffIds', 'array-contains', session!.uid)
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get(),
    ]);

    staffName = userSnap.data()?.['name'] ?? '';
    totalAssigned = leadsSnap.size;

    leads = leadsSnap.docs.map((doc) => {
      const d = doc.data();
      const st = d['status']?.['current'] as LeadStatus;
      if (st === 'new' || st === 'contacted') pendingCount++;
      else if (st === 'qualified') qualifiedCount++;
      else if (st === 'rejected') rejectedCount++;
      return {
        id: doc.id,
        customerName: d['customer']?.['name'] ?? '—',
        customerPhone: d['customer']?.['phoneE164'] ?? '',
        city: d['city'] ?? '',
        status: st,
        requirementNotes: d['requirementNotes'] ?? '',
        createdAt: d['createdAt']?.toDate() ?? new Date(),
      };
    });

    // Pending first, then by most recent within each group
    leads.sort((a, b) => {
      const orderDiff = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      if (orderDiff !== 0) return orderDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (e) {
    console.error('StaffDashboard error:', e);
  }

  const firstName = staffName.split(' ')[0] || 'Staff';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-5">

      {/* ── Hero ── */}
      <div className="glass-card rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-red-600/10 blur-2xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-20 w-20 rounded-full bg-red-400/8 blur-xl pointer-events-none" />
        <div className="relative">
          <p className="text-sm text-gray-500">{greeting},</p>
          <h1 className="text-2xl font-bold text-gray-900">{firstName}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {pendingCount > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-semibold text-orange-700">
                {pendingCount} lead{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} action
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-gray-900">{totalAssigned}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Total</p>
        </div>
        <div className={`glass-card rounded-2xl p-3 text-center ${pendingCount > 0 ? 'ring-1 ring-orange-300 bg-orange-50/40' : ''}`}>
          <p className="text-xl font-bold text-orange-600">{pendingCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Pending</p>
        </div>
        <div className="glass-card rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-green-600">{qualifiedCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Qualified</p>
        </div>
      </div>

      {/* ── All lead cards ── */}
      {leads.length === 0 ? (
        <div className="glass-card rounded-3xl py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 border border-gray-200">
            <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-500">No leads assigned yet</p>
          <p className="text-xs text-gray-400 mt-1">Check back later or contact your admin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
