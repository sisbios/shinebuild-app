import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { ExportButton } from './ExportButton';

export const dynamic = 'force-dynamic';

export default async function SuperAdminReportsPage() {
  const db = getAdminDb();

  let stats = {
    totalLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
    totalAgents: 0,
    approvedAgents: 0,
    totalIncentivesPaid: 0,
  };

  try {
    const [leadsSnap, qualSnap, convSnap, agentsSnap, approvedSnap, ledgerSnap] =
      await Promise.all([
        db.collection(COLLECTIONS.LEADS).count().get(),
        db.collection(COLLECTIONS.LEADS).where('status.current', '==', 'qualified').count().get(),
        db.collection(COLLECTIONS.LEADS).where('status.current', '==', 'converted').count().get(),
        db.collection(COLLECTIONS.USERS).where('role', '==', 'agent').count().get(),
        db.collection(COLLECTIONS.USERS).where('role', '==', 'agent').where('status', '==', 'approved').count().get(),
        db.collection(COLLECTIONS.INCENTIVE_LEDGER).get(),
      ]);

    stats.totalLeads = leadsSnap.data().count;
    stats.qualifiedLeads = qualSnap.data().count;
    stats.convertedLeads = convSnap.data().count;
    stats.totalAgents = agentsSnap.data().count;
    stats.approvedAgents = approvedSnap.data().count;
    stats.totalIncentivesPaid = ledgerSnap.docs.reduce(
      (sum, doc) => sum + (doc.data()['totalRedeemed'] ?? 0),
      0
    );
  } catch {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <ExportButton />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Total Leads" value={stats.totalLeads} />
        <Stat label="Qualified" value={stats.qualifiedLeads} />
        <Stat label="Converted" value={stats.convertedLeads} />
        <Stat label="Total Agents" value={stats.totalAgents} />
        <Stat label="Active Agents" value={stats.approvedAgents} />
        <Stat label="Incentives Paid" value={`₹${stats.totalIncentivesPaid}`} />
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm text-amber-800">
          <strong>Export:</strong> Click "Export CSV" to download a full report. All exports are logged in the audit trail.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
