import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';
import type { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

function getDayKey(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getLast14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(getDayKey(d));
  }
  return days;
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default async function SuperAdminDashboardPage() {
  const db = getAdminDb();

  const [leadsSnap, usersSnap] = await Promise.all([
    db.collection(COLLECTIONS.LEADS).get(),
    db.collection(COLLECTIONS.USERS).get(),
  ]).catch(() => [null, null]);

  let totalLeads = 0;
  let newLeads = 0;
  let qualifiedLeads = 0;
  let convertedLeads = 0;
  const leadsByDay: Record<string, number> = {};

  if (leadsSnap) {
    totalLeads = leadsSnap.size;
    for (const doc of leadsSnap.docs) {
      const d = doc.data();
      const currentStatus = d['status']?.['current'];
      if (currentStatus === 'new') newLeads++;
      if (currentStatus === 'qualified') qualifiedLeads++;
      if (currentStatus === 'converted') convertedLeads++;
      const createdAt = d['createdAt'] as Timestamp | null;
      if (createdAt?.toDate) {
        const key = getDayKey(createdAt.toDate());
        leadsByDay[key] = (leadsByDay[key] ?? 0) + 1;
      }
    }
  }

  let totalAgents = 0;
  let pendingAgents = 0;
  let totalStaff = 0;

  if (usersSnap) {
    for (const doc of usersSnap.docs) {
      const d = doc.data();
      if (d['role'] === 'agent') {
        totalAgents++;
        if (d['status'] === 'pending') pendingAgents++;
      }
      if (d['role'] === 'staff') totalStaff++;
    }
  }

  const days = getLast14Days();
  const chartData = days.map((day) => ({ day, count: leadsByDay[day] ?? 0 }));
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);
  const chartHeight = 120;

  const stats = [
    { label: 'Total Leads', value: totalLeads, href: '/admin/leads', color: 'from-red-700 to-red-900' },
    { label: 'New Leads', value: newLeads, href: '/admin/leads?status=new', color: 'from-blue-500 to-blue-700' },
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
        <p className="text-sm text-gray-500 mt-0.5">Platform overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="glass-card rounded-2xl p-4 hover-lift block"
          >
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} mb-3 shadow-sm`}>
              <span className="text-base font-bold text-white">{stat.value > 99 ? '99+' : stat.value}</span>
            </div>
            <p className="text-xs text-gray-500 font-medium leading-tight">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Daily lead count bar chart */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Leads — Last 14 Days</h2>
            <p className="text-xs text-gray-500 mt-0.5">Daily lead submissions</p>
          </div>
          <span className="text-xs text-gray-400 bg-white/60 px-2 py-1 rounded-lg font-medium">
            {chartData.reduce((s, d) => s + d.count, 0)} total
          </span>
        </div>

        <div className="flex items-end gap-1 h-36 w-full">
          {chartData.map(({ day, count }) => {
            const barHeight = count === 0 ? 4 : Math.max(8, (count / maxCount) * chartHeight);
            const isToday = day === getDayKey(new Date());
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-xs text-gray-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {count}
                </span>
                <div className="w-full flex items-end justify-center">
                  <div
                    style={{ height: `${barHeight}px` }}
                    className={`w-full rounded-t-md transition-all ${
                      isToday
                        ? 'brand-gradient shadow-sm'
                        : count === 0
                        ? 'bg-gray-100'
                        : 'bg-gradient-to-t from-red-700 to-red-500'
                    }`}
                  />
                </div>
                <span className="text-[9px] text-gray-400 rotate-45 origin-left w-6 truncate hidden sm:block">
                  {formatDay(day).replace(' ', '\u00a0')}
                </span>
              </div>
            );
          })}
        </div>

        {/* X-axis labels for mobile */}
        <div className="flex justify-between mt-2 sm:hidden">
          <span className="text-[10px] text-gray-400">{formatDay(days[0]!)}</span>
          <span className="text-[10px] text-gray-400">{formatDay(days[6]!)}</span>
          <span className="text-[10px] text-gray-400">Today</span>
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
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-between rounded-xl glass px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover-lift"
            >
              {action.label}
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
