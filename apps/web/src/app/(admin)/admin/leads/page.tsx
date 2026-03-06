import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import type { LeadStatus } from '@shinebuild/shared';

export const dynamic = 'force-dynamic';

interface SearchParams {
  status?: string;
  city?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function AdminLeadsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = getAdminDb();
  let leads: Array<{
    id: string;
    agentId: string;
    customerName: string;
    customerPhone: string;
    status: LeadStatus;
    city: string;
    source: string;
    createdAt: Date;
  }> = [];

  try {
    let q = db.collection(COLLECTIONS.LEADS).orderBy('createdAt', 'desc').limit(100) as any;
    if (sp.status) q = q.where('status.current', '==', sp.status);
    if (sp.city) q = q.where('city', '==', sp.city);

    const snap = await q.get();
    leads = snap.docs.map((doc: any) => {
      const d = doc.data();
      return {
        id: doc.id,
        agentId: d['agentId'],
        customerName: d['customer']?.['name'] ?? '—',
        customerPhone: d['customer']?.['phoneE164'] ?? '—',
        status: d['status']?.['current'] as LeadStatus,
        city: d['city'],
        source: d['source'],
        createdAt: d['createdAt']?.toDate() ?? new Date(),
      };
    });
  } catch {}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
      </div>

      {/* Filters */}
      <form className="flex gap-2 flex-wrap">
        <select name="status" defaultValue={sp.status ?? ''} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-700">
          <option value="">All Status</option>
          {['new','contacted','qualified','rejected','duplicate','converted'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input name="city" defaultValue={sp.city ?? ''} placeholder="Filter by city"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-700" />
        <button type="submit" className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white">
          Filter
        </button>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">City</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Source</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{lead.customerName}</td>
                <td className="px-4 py-3 text-gray-600">{lead.customerPhone}</td>
                <td className="px-4 py-3 text-gray-600">{lead.city}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {lead.source === 'agent_direct' ? 'Direct' : 'QR'}
                </td>
                <td className="px-4 py-3">
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {lead.createdAt.toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/leads/${lead.id}`} className="text-xs text-red-800 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No leads found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
