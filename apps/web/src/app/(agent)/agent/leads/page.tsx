import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import type { LeadStatus } from '@shinebuild/shared';

export const dynamic = 'force-dynamic';

export default async function AgentLeadsPage() {
  const session = await getServerSession();
  const db = getAdminDb();

  let leads: Array<{ id: string; referenceId: string; maskedName: string; maskedPhone: string; status: LeadStatus; city: string; incentiveAmount: number; createdAt: Date }> = [];

  try {
    // Query without orderBy to avoid composite index requirement while indexes build.
    // Sort in memory instead.
    const snap = await db
      .collectionGroup(COLLECTIONS.AGENT_VIEW)
      .where('agentId', '==', session!.uid)
      .limit(100)
      .get();

    leads = snap.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.ref.parent.parent!.id,
          referenceId: d['referenceId'] ?? doc.ref.parent.parent!.id.slice(-6).toUpperCase(),
          maskedName: d['maskedName'] ?? '***',
          maskedPhone: d['maskedPhone'] ?? '***',
          status: (d['status'] as LeadStatus) ?? 'new',
          city: d['city'] ?? '',
          incentiveAmount: d['incentiveAmount'] ?? 0,
          createdAt: d['createdAt']?.toDate() ?? new Date(),
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e) {
    console.error('AgentLeadsPage query error:', e);
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Leads</h1>
        <Link
          href="/agent/leads/new"
          className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-semibold text-white"
        >
          + New
        </Link>
      </div>

      {leads.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <p className="text-sm">No leads yet.</p>
          <Link href="/agent/leads/new" className="mt-2 block text-sm text-red-700 underline">
            Add your first lead
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/agent/leads/${lead.id}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">{lead.maskedName}</span>
                  <LeadStatusBadge status={lead.status} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {lead.maskedPhone} · {lead.city}
                </p>
                <p className="text-xs text-gray-400">
                  Ref: {lead.referenceId} · {lead.createdAt.toLocaleDateString('en-IN')}
                </p>
              </div>
              {lead.incentiveAmount > 0 && (
                <span className="text-xs font-semibold text-green-600">₹{lead.incentiveAmount}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
