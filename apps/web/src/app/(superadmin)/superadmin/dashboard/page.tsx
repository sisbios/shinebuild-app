import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';
import type { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
const cnt = (q: any): Promise<number> => q.get().then((s: any) => s.size as number);

function dayKey(d: Date) { return d.toISOString().slice(0, 10); }

function last30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return dayKey(d);
  });
}

export default async function SuperAdminDashboardPage() {
  const db = getAdminDb();
  let totalLeads = 0, newLeads = 0, qualifiedLeads = 0, convertedLeads = 0;
  let totalAgents = 0, pendingAgents = 0, totalStaff = 0;
  const byDay: Record<string, number> = {};

  // Staff leads chart: staffId → count of leads assigned in last 7 days
  type StaffBar = { name: string; count: number; uid: string };
  let staffLeadBars: StaffBar[] = [];

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { Timestamp: FSTimestamp } = await import('firebase-admin/firestore');

    const [tl, nl, ql, cv, ta, pa, st, chartSnap, staffSnap, recentLeadsSnap] = await Promise.all([
      cnt(db.collection(COLLECTIONS.LEADS)),
      cnt(db.collection(COLLECTIONS.LEADS).where('status.current', '==', 'new')),
      cnt(db.collection(COLLECTIONS.LEADS).where('status.current', '==', 'qualified')),
      cnt(db.collection(COLLECTIONS.LEADS).where('status.current', '==', 'converted')),
      cnt(db.collection(COLLECTIONS.USERS).where('role', '==', 'agent')),
      cnt(db.collection(COLLECTIONS.USERS).where('role', '==', 'agent').where('status', '==', 'pending')),
      cnt(db.collection(COLLECTIONS.USERS).where('role', '==', 'staff')),
      // 30-day daily chart
      db.collection(COLLECTIONS.LEADS)
        .where('createdAt', '>=', FSTimestamp.fromDate(thirtyDaysAgo))
        .select('createdAt')
        .get(),
      // All active staff for name lookup
      db.collection(COLLECTIONS.USERS)
        .where('role', 'in', ['staff', 'admin'])
        .where('status', '==', 'active')
        .select('name')
        .get(),
      // Leads assigned in last 7 days — select only assignedStaffIds
      db.collection(COLLECTIONS.LEADS)
        .where('createdAt', '>=', FSTimestamp.fromDate(sevenDaysAgo))
        .select('assignedStaffIds')
        .get(),
    ]);

    totalLeads = tl; newLeads = nl; qualifiedLeads = ql; convertedLeads = cv;
    totalAgents = ta; pendingAgents = pa; totalStaff = st;

    for (const doc of (chartSnap as any).docs) {
      const ts = doc.data()['createdAt'] as Timestamp | undefined;
      if (ts?.toDate) {
        const k = dayKey(ts.toDate());
        byDay[k] = (byDay[k] ?? 0) + 1;
      }
    }

    // Build staffId → name map
    const staffMap: Record<string, string> = {};
    for (const doc of (staffSnap as any).docs) {
      staffMap[doc.id] = doc.data()['name'] ?? 'Unknown';
    }

    // Count leads per staff from last 7 days
    const staffCounts: Record<string, number> = {};
    for (const doc of (recentLeadsSnap as any).docs) {
      const ids: string[] = doc.data()['assignedStaffIds'] ?? [];
      for (const sid of ids) {
        staffCounts[sid] = (staffCounts[sid] ?? 0) + 1;
      }
    }

    staffLeadBars = Object.entries(staffCounts)
      .filter(([sid]) => staffMap[sid])
      .map(([sid, count]) => ({ uid: sid, name: staffMap[sid]!, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // top 10 staff
  } catch (e) { console.error('Dashboard fetch error:', e); }

  const days = last30Days();
  const today = dayKey(new Date());
  const chartData = days.map((day) => ({ day, count: byDay[day] ?? 0 }));
  const maxCount = Math.max(...chartData.map((c) => c.count), 1);
  const periodTotal = chartData.reduce((s, c) => s + c.count, 0);

  // Chart dimensions — fixed pixel width, horizontal scroll on narrow screens
  const BAR_W = 16;
  const GAP = 3;
  const SVG_W = chartData.length * (BAR_W + GAP) - GAP; // 567 for 30 bars
  const SVG_H = 96;   // bar area height
  const LABEL_H = 18; // label row height

  const stats = [
    { label: 'Total Leads', value: totalLeads, href: '/superadmin/leads', color: 'from-red-700 to-red-900' },
    { label: 'New Leads', value: newLeads, href: '/superadmin/leads?status=new', color: 'from-blue-500 to-blue-700' },
    { label: 'Qualified', value: qualifiedLeads, href: '/superadmin/leads?status=qualified', color: 'from-green-500 to-green-700' },
    { label: 'Converted', value: convertedLeads, href: '/superadmin/leads?status=converted', color: 'from-purple-500 to-purple-700' },
    { label: 'Total Agents', value: totalAgents, href: '/admin/agents', color: 'from-amber-500 to-amber-700' },
    { label: 'Pending Approval', value: pendingAgents, href: '/admin/agents?status=pending', color: 'from-red-500 to-red-700' },
    { label: 'Total Staff', value: totalStaff, href: '/superadmin/staff', color: 'from-teal-500 to-teal-700' },
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

      {/* Performance Graph */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Lead Performance</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Last 30 days &mdash; <span className="font-semibold text-gray-700">{periodTotal}</span> leads total
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-400 flex-shrink-0">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#bf0000' }} />Today
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-300" />Past
            </span>
          </div>
        </div>

        {/* Horizontally scrollable chart */}
        <div className="overflow-x-auto -mx-1 px-1">
          <svg
            width={SVG_W}
            height={SVG_H + LABEL_H}
            viewBox={`0 0 ${SVG_W} ${SVG_H + LABEL_H}`}
            style={{ display: 'block', minWidth: Math.min(SVG_W, 320) }}
            aria-label="Lead activity chart — last 30 days"
          >
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>
              <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d10000" />
                <stop offset="100%" stopColor="#9b0000" />
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

            {/* Bars + count labels + day labels */}
            {chartData.map(({ day, count }, i) => {
              const barH = count === 0 ? 2 : Math.max(6, Math.round((count / maxCount) * (SVG_H - 10)));
              const x = i * (BAR_W + GAP);
              const y = SVG_H - barH;
              const isToday = day === today;
              const date = new Date(day + 'T00:00:00');
              const dayNum = date.getDate();
              // Show "DD" for most days; "D/M" (e.g. "1 M") for 1st of month
              const dayLabel = dayNum === 1
                ? `1 ${date.toLocaleDateString('en-IN', { month: 'short' }).slice(0, 3)}`
                : String(dayNum).padStart(2, '0');
              const labelColor = isToday ? '#bf0000' : dayNum === 1 ? '#6b7280' : '#9ca3af';
              const labelWeight = isToday || dayNum === 1 ? '700' : '400';

              return (
                <g key={day}>
                  {/* Bar */}
                  <rect
                    x={x} y={y} width={BAR_W} height={barH} rx={2}
                    fill={isToday ? 'url(#todayGrad)' : count === 0 ? '#f3f4f6' : 'url(#barGrad)'}
                  />

                  {/* Count on top of bar */}
                  {count > 0 && (
                    <>
                      <rect x={x - 1} y={y - 8} width={BAR_W + 2} height={8} rx={2}
                        fill={isToday ? '#9b0000' : '#6b7280'} opacity="0.85" />
                      <text x={x + BAR_W / 2} y={y - 1.5} textAnchor="middle"
                        fontSize="5" fill="#ffffff" fontWeight="700">
                        {count}
                      </text>
                    </>
                  )}

                  {/* Day label below bar */}
                  <text
                    x={x + BAR_W / 2}
                    y={SVG_H + LABEL_H - 4}
                    textAnchor="middle"
                    fontSize={dayNum === 1 ? '5' : '5.5'}
                    fill={labelColor}
                    fontWeight={labelWeight}
                  >
                    {dayLabel}
                  </text>

                  {/* Today indicator dot */}
                  {isToday && (
                    <circle cx={x + BAR_W / 2} cy={SVG_H + 3} r={2} fill="#bf0000" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {periodTotal === 0 && (
          <p className="text-center text-xs text-gray-400 mt-2">No leads recorded in the last 30 days</p>
        )}
      </div>

      {/* Staff leads chart — last 7 days */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Leads per Staff</h2>
            <p className="text-xs text-gray-500 mt-0.5">Last 7 days — assigned lead count</p>
          </div>
          <Link href="/superadmin/staff" className="text-xs text-red-700 font-semibold hover:underline">
            Manage →
          </Link>
        </div>

        {staffLeadBars.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-6">No staff leads in the last 7 days</p>
        ) : (() => {
          const maxBar = Math.max(...staffLeadBars.map((s) => s.count), 1);
          const BAR_H = 20;
          const GAP = 8;
          const LABEL_W = 90;
          const COUNT_W = 28;
          const CHART_W = 260;
          const ROW_H = BAR_H + GAP;
          const SVG_H = staffLeadBars.length * ROW_H - GAP;

          return (
            <div className="overflow-x-auto -mx-1 px-1">
              <svg
                width="100%"
                viewBox={`0 0 ${LABEL_W + CHART_W + COUNT_W + 8} ${SVG_H}`}
                style={{ minWidth: 320 }}
                aria-label="Leads per staff member — last 7 days"
              >
                <defs>
                  <linearGradient id="staffBarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#b91c1c" />
                  </linearGradient>
                </defs>
                {staffLeadBars.map(({ uid, name, count }, i) => {
                  const y = i * ROW_H;
                  const barW = Math.max(4, Math.round((count / maxBar) * CHART_W));
                  const isTop = i === 0;
                  // Truncate name to ~14 chars
                  const displayName = name.length > 14 ? name.slice(0, 13) + '…' : name;

                  return (
                    <g key={uid}>
                      {/* Staff name */}
                      <text
                        x={LABEL_W - 6}
                        y={y + BAR_H / 2 + 4}
                        textAnchor="end"
                        fontSize="9"
                        fill={isTop ? '#b91c1c' : '#6b7280'}
                        fontWeight={isTop ? '700' : '500'}
                      >
                        {displayName}
                      </text>

                      {/* Track background */}
                      <rect
                        x={LABEL_W}
                        y={y}
                        width={CHART_W}
                        height={BAR_H}
                        rx={4}
                        fill="#f3f4f6"
                      />

                      {/* Filled bar */}
                      <rect
                        x={LABEL_W}
                        y={y}
                        width={barW}
                        height={BAR_H}
                        rx={4}
                        fill={isTop ? 'url(#staffBarGrad)' : '#fca5a5'}
                      />

                      {/* Count label */}
                      <text
                        x={LABEL_W + CHART_W + 6}
                        y={y + BAR_H / 2 + 4}
                        fontSize="9"
                        fill={isTop ? '#b91c1c' : '#374151'}
                        fontWeight={isTop ? '700' : '600'}
                      >
                        {count}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          );
        })()}
      </div>

      {/* Quick actions */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { href: '/superadmin/leads', label: 'Manage Leads' },
            { href: '/admin/agents', label: 'Agents' },
            { href: '/superadmin/staff', label: 'Manage Staff' },
            { href: '/superadmin/reports', label: 'Export Reports' },
            { href: '/superadmin/settings/services', label: 'Services List' },
            { href: '/superadmin/settings/incentive-rules', label: 'Incentive Rules' },
            { href: '/admin/incentives', label: 'Incentive Ledger' },
          ].map((a) => (
            <Link key={a.href} href={a.href}
              className="flex items-center justify-between rounded-xl glass px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover-lift">
              {a.label}
              <svg className="h-4 w-4 text-gray-400 flex-shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
