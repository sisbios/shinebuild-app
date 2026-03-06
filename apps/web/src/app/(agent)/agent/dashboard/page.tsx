export const dynamic = 'force-dynamic';

import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import Link from 'next/link';
import { COLLECTIONS } from '@shinebuild/firebase';

export default async function AgentDashboardPage() {
  const session = await getServerSession();
  const db = getAdminDb();

  // Get agent's lead stats from agentView
  let totalLeads = 0;
  let qualifiedLeads = 0;
  let ledgerBalance = 0;

  try {
    const leadsSnap = await db
      .collectionGroup(COLLECTIONS.AGENT_VIEW)
      .where('agentId', '==', session!.uid)
      .get();
    totalLeads = leadsSnap.size;

    const qualifiedSnap = await db
      .collectionGroup(COLLECTIONS.AGENT_VIEW)
      .where('agentId', '==', session!.uid)
      .where('status', 'in', ['qualified', 'converted'])
      .get();
    qualifiedLeads = qualifiedSnap.size;

    const ledgerSnap = await db.collection(COLLECTIONS.INCENTIVE_LEDGER).doc(session!.uid).get();
    if (ledgerSnap.exists) {
      ledgerBalance = ledgerSnap.data()!['balance'] ?? 0;
    }
  } catch {
    // Emulator might not have data yet
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500">Welcome back</p>
        <h1 className="text-xl font-bold text-gray-900">Agent Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Leads" value={totalLeads} />
        <StatCard label="Qualified" value={qualifiedLeads} />
        <StatCard label="Balance" value={`₹${ledgerBalance}`} highlight />
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Quick Actions</h2>
        <Link
          href="/agent/leads/new"
          className="flex items-center gap-3 rounded-xl bg-red-700 px-4 py-3 text-white shadow-sm"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <div>
            <p className="font-semibold">Add New Lead</p>
            <p className="text-xs text-red-100">Direct entry with geo + photo</p>
          </div>
        </Link>
        <Link
          href="/agent/qr"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
        >
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <div>
            <p className="font-semibold text-gray-900">Generate QR Code</p>
            <p className="text-xs text-gray-500">Let customer self-enter their details</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${highlight ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <p className={`text-xl font-bold ${highlight ? 'text-red-800' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
