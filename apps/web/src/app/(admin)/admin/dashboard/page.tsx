import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const db = getAdminDb();
  let totalLeads = 0, newLeads = 0, qualifiedLeads = 0, pendingAgents = 0, totalStaff = 0;

  try {
    const [leadsSnap, newSnap, qualSnap, pendingSnap, staffSnap] = await Promise.all([
      db.collection(COLLECTIONS.LEADS).get(),
      db.collection(COLLECTIONS.LEADS).where('status.current', '==', 'new').get(),
      db.collection(COLLECTIONS.LEADS).where('status.current', '==', 'qualified').get(),
      db.collection(COLLECTIONS.USERS).where('role', '==', 'agent').where('status', '==', 'pending').get(),
      db.collection(COLLECTIONS.USERS).where('role', '==', 'staff').get(),
    ]);
    totalLeads = leadsSnap.size;
    newLeads = newSnap.size;
    qualifiedLeads = qualSnap.size;
    pendingAgents = pendingSnap.size;
    totalStaff = staffSnap.size;
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your lead collection platform</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Leads" value={totalLeads} href="/admin/leads" color="blue" />
        <StatCard label="New Leads" value={newLeads} href="/admin/leads?status=new" color="orange" highlight />
        <StatCard label="Qualified" value={qualifiedLeads} href="/admin/leads?status=qualified" color="green" />
        <StatCard label="Pending Agents" value={pendingAgents} href="/admin/agents" color="amber" warning={pendingAgents > 0} />
        <StatCard label="Staff" value={totalStaff} href="/admin/staff" color="purple" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink href="/admin/leads" title="Manage Leads" desc="View, assign & update status" icon="📋" />
          <QuickLink
            href="/admin/agents"
            title="Agent Approvals"
            desc={pendingAgents > 0 ? `${pendingAgents} pending` : 'All caught up'}
            icon="👥"
            badge={pendingAgents > 0 ? pendingAgents : undefined}
          />
          <QuickLink href="/admin/staff" title="Staff Management" desc="Add & manage staff" icon="🧑‍💼" />
          <QuickLink href="/admin/incentives" title="Incentives" desc="Track agent earnings" icon="💰" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href, color, highlight, warning }: {
  label: string; value: number; href: string; color: string; highlight?: boolean; warning?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-red-700 to-red-800',
    green: 'from-green-500 to-green-600',
    amber: 'from-amber-500 to-amber-600',
    purple: 'from-purple-500 to-purple-600',
  };
  return (
    <Link href={href} className="glass-card rounded-2xl p-4 hover-lift block">
      <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-3 shadow-sm`}>
        <span className="text-white text-xs font-bold">{value > 99 ? '99+' : value}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </Link>
  );
}

function QuickLink({ href, title, desc, icon, badge }: {
  href: string; title: string; desc: string; icon: string; badge?: number;
}) {
  return (
    <Link href={href} className="glass-card rounded-2xl p-4 hover-lift flex items-start gap-3 group">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 text-sm group-hover:text-red-800 transition-colors truncate">{title}</p>
          {badge !== undefined && (
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-red-700 text-white text-xs flex items-center justify-center font-bold">{badge}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{desc}</p>
      </div>
      <svg className="h-4 w-4 text-gray-300 group-hover:text-red-600 transition-colors flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
