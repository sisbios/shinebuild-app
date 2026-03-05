import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const db = getAdminDb();

  let totalLeads = 0;
  let newLeads = 0;
  let qualifiedLeads = 0;
  let pendingAgents = 0;

  try {
    const [leadsSnap, newSnap, qualSnap, pendingSnap] = await Promise.all([
      db.collection(COLLECTIONS.LEADS).count().get(),
      db.collection(COLLECTIONS.LEADS).where('status.current', '==', 'new').count().get(),
      db.collection(COLLECTIONS.LEADS).where('status.current', '==', 'qualified').count().get(),
      db.collection(COLLECTIONS.USERS).where('role', '==', 'agent').where('status', '==', 'pending').count().get(),
    ]);
    totalLeads = leadsSnap.data().count;
    newLeads = newSnap.data().count;
    qualifiedLeads = qualSnap.data().count;
    pendingAgents = pendingSnap.data().count;
  } catch {}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total Leads" value={totalLeads} />
        <Stat label="New Leads" value={newLeads} highlight />
        <Stat label="Qualified" value={qualifiedLeads} />
        <Stat label="Pending Agents" value={pendingAgents} warning={pendingAgents > 0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <QuickLink href="/admin/leads" title="Manage Leads" desc="View, assign, and update lead status" />
        <QuickLink href="/admin/agents" title="Agent Approvals" desc={`${pendingAgents} agent(s) pending approval`} />
        <QuickLink href="/admin/incentives" title="Incentives" desc="View agent earnings and mark payouts" />
        <QuickLink href="/admin/staff" title="Staff" desc="Manage staff assignments" />
      </div>
    </div>
  );
}

function Stat({ label, value, highlight, warning }: { label: string; value: number; highlight?: boolean; warning?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-orange-200 bg-orange-50' : warning ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'}`}>
      <p className={`text-2xl font-bold ${highlight ? 'text-orange-600' : warning ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-orange-300 hover:shadow-sm transition-all">
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </Link>
  );
}
