import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';
import type { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

function dayKey(d: Date) { return d.toISOString().slice(0, 10); }

function last30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return dayKey(d);
  });
}

function fmtDay(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
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
  } catch (e) { console.error('Dashboard fetch error:', e); }

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

  const days = last30Days();
  const today = dayKey(new Date());
  const chartData = days.map((day) => ({ day, count: byDay[day] ?? 0 }));
  const maxCount = Math.max(...chartData.map((c) => c.count), 1);
  const periodTotal = chartData.reduce((s, c) => s + c.count, 0);

  // SVG chart dimensions
  const SVG_H = 110;
  const SVG_W = 300;
  const BAR_W = Math.floor((SVG_W - (chartData.length - 1) * 2) / chartData.length);
  const GAP = 2;

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
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="glass-card rounded-2xl p-4 hover-lift block">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} mb-3 shadow-sm`}>
              <span className="text-sm font-bold text-white">{stat.value > 99 ? '99+' : stat.value}</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Performance Graph: Leads vs Day (SVG) */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Lead Performance</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Last 30 days &mdash; <span className="font-semibold text-gray-700">{periodTotal}</span> leads total
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#bf0000' }} />Today
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-300" />Past
            </span>
          </div>
        </div>

        {/* SVG Bar Chart */}
        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H + 20}`}
            preserveAspectRatio="none"
            className="w-full"
            style={{ height: '140px' }}
            aria-label="Lead activity chart"
          >
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>
              <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d10000" />
                <stop offset="100%" stopColor="#bf0000" />
              </linearGradient>
            </defs>

            {/* Y-axis gridlines */}
            {[0.25, 0.5, 0.75, 1].map((pct) => {
              const y = SVG_H - pct * SVG_H;
              return (
                <line key={pct} x1={0} y1={y} x2={SVG_W} y2={y}
                  stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3,3" />
              );
            })}

            {/* Bars */}
            {chartData.map(({ day, count }, i) => {
              const barH = count === 0 ? 2 : Math.max(4, Math.round((count / maxCount) * (SVG_H - 4)));
              const x = i * (BAR_W + GAP);
              const y = SVG_H - barH;
              const isToday = day === today;
              return (
                <g key={day}>
                  <rect
                    x={x} y={y} width={BAR_W} height={barH} rx={1.5}
                    fill={isToday ? 'url(#todayGrad)' : count === 0 ? '#f3f4f6' : 'url(#barGrad)'}
                  />
                  {/* Count label on top of bar if has data */}
                  {count > 0 && (
                    <text x={x + BAR_W / 2} y={y - 2} textAnchor="middle"
                      fontSize="6" fill={isToday ? '#bf0000' : '#6b7280'} fontWeight="600">
                      {count}
                    </text>
                  )}
                </g>
              );
            })}

            {/* X-axis: show every 5th day label */}
            {chartData.map(({ day }, i) => {
              if (i % 5 !== 0 && i !== chartData.length - 1) return null;
              const x = i * (BAR_W + GAP) + BAR_W / 2;
              const label = i === chartData.length - 1 ? 'Today' : fmtDay(day);
              return (
                <text key={day} x={x} y={SVG_H + 14} textAnchor="middle"
                  fontSize="7" fill={day === today ? '#bf0000' : '#9ca3af'} fontWeight={day === today ? '700' : '400'}>
                  {label}
                </text>
              );
            })}
          </svg>
        </div>

        {periodTotal === 0 && (
          <p className="text-center text-xs text-gray-400 mt-2">No leads recorded in the last 30 days</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: '/admin/leads', label: 'All Leads' },
            { href: '/admin/agents', label: 'Agents' },
            { href: '/admin/staff', label: 'Staff' },
            { href: '/superadmin/reports', label: 'Export Reports' },
            { href: '/superadmin/settings/incentive-rules', label: 'Incentive Rules' },
            { href: '/admin/incentives', label: 'Incentive Ledger' },
          ].map((a) => (
            <Link key={a.href} href={a.href}
              className="flex items-center justify-between rounded-xl glass px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover-lift">
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
