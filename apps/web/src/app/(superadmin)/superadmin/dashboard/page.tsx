import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';
import type { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function last14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return dayKey(d);
  });
}

function fmtDay(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default async function SuperAdminDashboardPage() {
  const db = getAdminDb();

  let leadsSnap: any = null;
  let usersSnap: any = null;

  try {
    [leadsSnap, usersSnap] = await Promise.all([
      db.collection(COLLECTIONS.LEADS).get(),
      db.collection(COLLECTIONS.USERS).get(),
    ]);
  } catch {}

  let totalLeads = 0, newLeads = 0, qualifiedLeads = 0, convertedLeads = 0;
  const byDay: Record<string, number> = {};

  if (leadsSnap) {
    totalLeads = leadsSnap.size;
    for (const doc of leadsSnap.docs) {
      const d = doc.data();
      const st = d['status']?.['current'];
      if (st === 'new') newLeads++;
      if (st === 'qualified') qualifiedLeads++;
      if (st === 'converted') convertedLeads++;
      const ts = d['createdAt'] as Timestamp | undefined;
      if (ts?.toDate) {
        const k = dayKey(ts.toDate());
        byDay[k] = (byDay[k] ?? 0) + 1;
      }
    }
  }

  let totalAgents = 0, pendingAgents = 0, totalStaff = 0;
  if (usersSnap) {
    for (const doc of usersSnap.docs) {
      const d = doc.data();
      if (d['role'] === 'agent') { totalAgents++; if (d['status'] === 'pending') pendingAgents++; }
      if (d['role'] === 'staff') totalStaff++;
    }
  }

  const days = last14Days();
  const today = dayKey(new Date());
  const chartData = days.map((day) => ({ day, count: byDay[day] ?? 0 }));
  const maxCount = Math.max(...chartData.map((c) => c.count), 1);
  const periodTotal = chartData.reduce((s, c) => s + c.count, 0);

  const stats = [
    { label: 'Total Leads', value: totalLeads, href: '/admin/leads', color: 'from-red-700 to-red-900' },
    { label: 'New Today', value: byDay[today] ?? 0, href: '/admin/leads?status=new', color: 'from-blue-500 to-blue-700' },
    { label: 'Qualified', value: qualifiedLeads, href: '/admin/leads?status=qualified', color: 'from-green-500 to-green-700' },
    { label: 'Converted', value: convertedLeads, href: '/admin/leads?status=converted', color: 'from-purple-500 to-purple-700' },
    { label: 'Total Agents', value: totalAgents, href: '/admin/agents', color: 'from-amber-500 to-amber-700' },
    { label: 'Pending Approval', value: pendingAgents, href: '/admin/agents?status=pending', color: 'from-red-500 to-red-700' },
    { label: 'Total Staff', value: totalStaff, href: '/admin/staff', color: 'from-teal-500 to-teal-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform overview · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="glass-card rounded-2xl p-4 hover-lift block">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} mb-3 shadow-sm`}>
              <span className="text-sm font-bold text-white">{stat.value > 99 ? '99+' : stat.value}</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium leading-tight">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Bar chart */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Lead Activity</h2>
            <p className="text-xs text-gray-500 mt-0.5">Last 14 days — {periodTotal} lead{periodTotal !== 1 ? 's' : ''} total</p>
          </div>
          {periodTotal === 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">No data yet</span>
          )}
        </div>

        {/* Bars */}
        <div className="flex items-end gap-[3px]" style={{ height: '120px' }}>
          {chartData.map(({ day, count }) => {
            const pct = count / maxCount;
            const barH = count === 0 ? 3 : Math.max(8, Math.round(pct * 116));
            const isToday = day === today;
            return (
              <div key={day} className="flex-1 relative group flex items-end h-full">
                <div
                  style={{ height: `${barH}px` }}
                  className={`w-full rounded-t-sm transition-all duration-200 ${
                    isToday ? 'brand-gradient shadow-sm' : count === 0 ? 'bg-gray-100' : 'bg-gradient-to-t from-red-700 to-red-400'
                  }`}
                />
                {/* Tooltip: anchored to top of column so it doesn't jump */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                  <div className="bg-gray-900 text-white text-[10px] font-bold rounded px-1.5 py-0.5 whitespace-nowrap">
                    {count} lead{count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex gap-[3px] mt-2">
          {chartData.map(({ day }, i) => (
            <div key={day} className="flex-1 text-center">
              {(i === 0 || i === 3 || i === 6 || i === 9 || i === 13) && (
                <span className={`text-[9px] font-medium ${day === today ? 'text-red-700' : 'text-gray-400'}`}>
                  {day === today ? 'Today' : fmtDay(day)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/40">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm brand-gradient" />
            <span className="text-[10px] text-gray-500">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-red-700 to-red-400" />
            <span className="text-[10px] text-gray-500">Previous days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-gray-100" />
            <span className="text-[10px] text-gray-500">No leads</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: '/admin/leads', label: 'View All Leads' },
            { href: '/admin/agents', label: 'Manage Agents' },
            { href: '/admin/staff', label: 'Manage Staff' },
            { href: '/superadmin/reports', label: 'Export Reports' },
            { href: '/superadmin/settings/incentive-rules', label: 'Incentive Rules' },
            { href: '/admin/incentives', label: 'Incentive Ledger' },
          ].map((a) => (
            <Link key={a.href} href={a.href}
              className="flex items-center justify-between rounded-xl glass px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover-lift"
            >
              {a.label}
              <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
