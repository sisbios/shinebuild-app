import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';
import type { LeadStatus } from '@shinebuild/shared';
import { LeadCard } from '@/app/(staff)/staff/leads/LeadCard';

export const dynamic = 'force-dynamic';

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
  let pendingLeads: LeadRow[] = [];

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

    pendingLeads = allLeadsSnap.docs
      .filter((doc) => {
        const st = doc.data()['status']?.['current'] as LeadStatus;
        return st === 'new' || st === 'contacted';
      })
      .slice(0, 6)
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          customerName: d['customer']?.['name'] ?? '—',
          customerPhone: d['customer']?.['phoneE164'] ?? '',
          city: d['city'] ?? '',
          status: d['status']?.['current'] as LeadStatus,
          requirementNotes: d['requirementNotes'] ?? '',
          createdAt: d['createdAt']?.toDate() ?? new Date(),
        };
      });
  } catch (e) {
    console.error('StaffDashboard error:', e);
  }

  const firstName = staffName.split(' ')[0] || 'Staff';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">

      {/* ── Hero greeting ── */}
      <div className="glass-card rounded-3xl p-5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-red-600/10 blur-2xl pointer-events-none" />
        <div className="absolute -right-4 -bottom-6 h-24 w-24 rounded-full bg-red-400/8 blur-xl pointer-events-none" />
        <div className="relative">
          <p className="text-sm text-gray-500">{greeting},</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{firstName}</h1>
          <p className="text-xs text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {pendingCount > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-semibold text-orange-700">
                {pendingCount} lead{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} attention
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Assigned"
          value={totalAssigned}
          iconBg="from-gray-500 to-gray-700"
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          href="/staff/leads"
          valueColor="text-gray-900"
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          iconBg="from-orange-400 to-orange-600"
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          href="/staff/leads?filter=pending"
          valueColor="text-orange-700"
          highlight={pendingCount > 0}
        />
        <StatCard
          label="Qualified"
          value={qualifiedCount}
          iconBg="from-green-400 to-green-600"
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          href="/staff/leads?filter=qualified"
          valueColor="text-green-700"
        />
        <StatCard
          label="Rejected"
          value={rejectedCount}
          iconBg="from-red-400 to-red-600"
          icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          href="/staff/leads?filter=rejected"
          valueColor="text-red-700"
        />
      </div>

      {/* ── Pending leads ── */}
      {pendingLeads.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Needs Attention</h2>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            </div>
            <Link href="/staff/leads" className="text-xs font-semibold text-red-700 hover:underline">
              View all →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </section>
      ) : (
        <div className="glass-card rounded-3xl p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 border border-green-200">
            <svg className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-green-700">All caught up!</p>
          <p className="text-xs text-gray-400 mt-1">No leads needing attention right now.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, iconBg, icon, href, valueColor, highlight,
}: {
  label: string; value: number; iconBg: string; icon: React.ReactNode;
  href: string; valueColor: string; highlight?: boolean;
}) {
  return (
    <Link href={href} className={`glass-card rounded-2xl p-4 hover-lift block relative overflow-hidden ${highlight ? 'ring-1 ring-orange-300' : ''}`}>
      {highlight && <div className="absolute inset-0 bg-orange-50/40 pointer-events-none rounded-2xl" />}
      <div className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${iconBg} text-white shadow-sm mb-3`}>
        {icon}
      </div>
      <p className={`relative text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="relative text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
    </Link>
  );
}
