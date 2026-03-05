import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { IncentiveRuleForm } from './IncentiveRuleForm';
import type { IncentiveRule } from '@shinebuild/shared';

export const dynamic = 'force-dynamic';

export default async function IncentiveRulesPage() {
  const db = getAdminDb();
  let rules: Array<IncentiveRule & { id: string }> = [];

  try {
    const snap = await db.collection(COLLECTIONS.INCENTIVE_RULES).orderBy('effectiveFrom', 'desc').get();
    rules = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d['name'],
        baseAmount: d['baseAmount'],
        convertedBonus: d['convertedBonus'],
        effectiveFrom: d['effectiveFrom']?.toDate(),
        effectiveTo: d['effectiveTo']?.toDate() ?? null,
        createdBy: d['createdBy'],
        active: d['active'],
      } as IncentiveRule & { id: string };
    });
  } catch {}

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Incentive Rules</h1>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Base (₹)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Bonus (₹)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Effective From</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{rule.name}</td>
                <td className="px-4 py-3 text-right text-gray-700">₹{rule.baseAmount}</td>
                <td className="px-4 py-3 text-right text-gray-700">₹{rule.convertedBonus}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {rule.effectiveFrom instanceof Date
                    ? rule.effectiveFrom.toLocaleDateString('en-IN')
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${rule.active ? 'text-green-600' : 'text-gray-400'}`}>
                    {rule.active ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No rules yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Create New Rule</h2>
        <IncentiveRuleForm />
      </div>
    </div>
  );
}
