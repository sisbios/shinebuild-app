import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';
import { Badge } from '@shinebuild/ui';
import type { AgentStatus } from '@shinebuild/shared';

export const dynamic = 'force-dynamic';

const STATUS_VARIANT: Record<AgentStatus, any> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  deactivated: 'deactivated',
};

export default async function AdminAgentsPage() {
  const db = getAdminDb();
  let agents: Array<{ uid: string; name: string; phone: string; status: AgentStatus; city?: string; createdAt: Date }> = [];

  try {
    const snap = await db
      .collection(COLLECTIONS.USERS)
      .where('role', '==', 'agent')
      .limit(100)
      .get();

    agents = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        uid: doc.id,
        name: d['name'],
        phone: d['phone'],
        status: d['status'] as AgentStatus,
        city: d['metadata']?.['city'],
        createdAt: d['createdAt']?.toDate() ?? new Date(),
      };
    });
    agents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (err) {
    console.error('AdminAgentsPage error:', err);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Agents</h1>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Agent</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">City</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agents.map((agent) => (
              <tr key={agent.uid} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{agent.name}</td>
                <td className="px-4 py-3 text-gray-600">{agent.phone}</td>
                <td className="px-4 py-3 text-gray-600">{agent.city ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[agent.status]}>{agent.status}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {agent.createdAt.toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/agents/${agent.uid}`} className="text-xs text-orange-600 hover:underline">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No agents yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
