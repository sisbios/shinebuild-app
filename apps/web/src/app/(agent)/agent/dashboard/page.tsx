export const dynamic = 'force-dynamic';

import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import Link from 'next/link';
import { COLLECTIONS } from '@shinebuild/firebase';

export default async function AgentDashboardPage() {
  const session = await getServerSession();
  const db = getAdminDb();

  let agentName = '';
  let totalLeads = 0;
  let qualifiedLeads = 0;
  let ledgerBalance = 0;

  try {
    const [userSnap, leadsSnap, qualifiedSnap, ledgerSnap] = await Promise.all([
      db.collection(COLLECTIONS.USERS).doc(session!.uid).get(),
      db.collectionGroup(COLLECTIONS.AGENT_VIEW).where('agentId', '==', session!.uid).get(),
      db.collectionGroup(COLLECTIONS.AGENT_VIEW)
        .where('agentId', '==', session!.uid)
        .where('status', 'in', ['qualified', 'converted'])
        .get(),
      db.collection(COLLECTIONS.INCENTIVE_LEDGER).doc(session!.uid).get(),
    ]);

    agentName = userSnap.data()?.['name'] ?? '';
    totalLeads = leadsSnap.size;
    qualifiedLeads = qualifiedSnap.size;
    if (ledgerSnap.exists) ledgerBalance = ledgerSnap.data()!['balance'] ?? 0;
  } catch {
    // No data yet
  }

  const firstName = agentName.split(' ')[0] || 'Agent';

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500">Welcome back,</p>
        <h1 className="text-2xl font-bold text-gray-900">{firstName} <span className="text-gradient-brand">to Shine Connect</span></h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Leads" value={totalLeads} />
        <StatCard label="Qualified" value={qualifiedLeads} />
        <StatCard label="Balance" value={`₹${ledgerBalance}`} highlight />
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Quick Actions</h2>
        <Link
          href="/agent/leads/new"
          className="flex items-center gap-3 rounded-2xl brand-gradient px-4 py-3.5 text-white shadow-md"
        >
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Add New Lead</p>
            <p className="text-xs text-white/70">Direct entry with geo + photo</p>
          </div>
          <svg className="h-5 w-5 ml-auto text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/agent/qr"
          className="flex items-center gap-3 rounded-2xl glass-card px-4 py-3.5"
        >
          <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Generate QR Code</p>
            <p className="text-xs text-gray-500">Let customer self-enter details</p>
          </div>
          <svg className="h-5 w-5 ml-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Incentive hint if balance > 0 */}
      {ledgerBalance > 0 && (
        <div className="glass-card rounded-2xl p-4 border-l-4 border-green-500">
          <p className="text-sm font-bold text-gray-900">You have ₹{ledgerBalance} in incentives</p>
          <p className="text-xs text-gray-500 mt-0.5">Contact your admin to redeem your earnings.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`glass-card rounded-2xl p-3 text-center ${highlight ? 'border-l-2 border-red-600' : ''}`}>
      <p className={`text-xl font-bold ${highlight ? 'text-red-800' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
