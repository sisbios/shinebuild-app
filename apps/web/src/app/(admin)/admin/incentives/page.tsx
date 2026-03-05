import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { RedeemButton } from './RedeemButton';

export const dynamic = 'force-dynamic';

export default async function AdminIncentivesPage() {
  const db = getAdminDb();
  let ledgers: Array<{ agentId: string; agentName: string; totalEarned: number; totalRedeemed: number; balance: number }> = [];

  try {
    const ledgerSnap = await db.collection(COLLECTIONS.INCENTIVE_LEDGER).get();
    const agentIds = ledgerSnap.docs.map((d) => d.id);

    // Batch-fetch agent names
    const agentDocs = await Promise.all(
      agentIds.map((id) => db.collection(COLLECTIONS.USERS).doc(id).get())
    );
    const agentMap = Object.fromEntries(
      agentDocs.map((d) => [d.id, d.data()?.['name'] ?? d.id.slice(-6)])
    );

    ledgers = ledgerSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        agentId: doc.id,
        agentName: agentMap[doc.id] ?? doc.id.slice(-6),
        totalEarned: d['totalEarned'] ?? 0,
        totalRedeemed: d['totalRedeemed'] ?? 0,
        balance: d['balance'] ?? 0,
      };
    });
  } catch {}

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Agent Incentives</h1>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Agent</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Earned</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Redeemed</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Balance</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ledgers.map((l) => (
              <tr key={l.agentId} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{l.agentName}</td>
                <td className="px-4 py-3 text-right text-gray-700">₹{l.totalEarned}</td>
                <td className="px-4 py-3 text-right text-gray-500">₹{l.totalRedeemed}</td>
                <td className="px-4 py-3 text-right font-bold text-green-600">₹{l.balance}</td>
                <td className="px-4 py-3">
                  {l.balance > 0 && <RedeemButton agentId={l.agentId} balance={l.balance} />}
                </td>
              </tr>
            ))}
            {ledgers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No incentive data yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
