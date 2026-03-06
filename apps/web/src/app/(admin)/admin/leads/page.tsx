import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import type { LeadStatus } from '@shinebuild/shared';

export const dynamic = 'force-dynamic';

interface Props { searchParams: Promise<{ status?: string; city?: string }> }

export default async function AdminLeadsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = getAdminDb();
  let leads: Array<{
    id: string; agentId: string; customerName: string; customerPhone: string;
    status: LeadStatus; city: string; source: string; createdAt: Date;
  }> = [];

  try {
    let q = db.collection(COLLECTIONS.LEADS).orderBy('createdAt', 'desc').limit(100) as any;
    if (sp.status) q = q.where('status.current', '==', sp.status);
    if (sp.city) q = q.where('city', '==', sp.city);
    const snap = await q.get();
    leads = snap.docs.map((doc: any) => {
      const d = doc.data();
      return {
        id: doc.id, agentId: d['agentId'],
        customerName: d['customer']?.['name'] ?? '—',
        customerPhone: d['customer']?.['phoneE164'] ?? '—',
        status: d['status']?.['current'] as LeadStatus,
        city: d['city'], source: d['source'],
        createdAt: d['createdAt']?.toDate() ?? new Date(),
      };
    });
  } catch {}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leads <span className="text-sm font-normal text-gray-400">({leads.length})</span></h1>
      </div>

      {/* Filters */}
      <form className="flex gap-2 flex-wrap">
        <select name="status" defaultValue={sp.status ?? ''}
          className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
          <option value="">All Status</option>
          {['new','contacted','qualified','rejected','duplicate','converted'].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <input name="city" defaultValue={sp.city ?? ''} placeholder="Filter by city"
          className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 flex-1 min-w-[120px]" />
        <button type="submit" className="rounded-xl brand-gradient px-4 py-2 text-sm font-semibold text-white">Filter</button>
      </form>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {leads.length === 0 ? (
          <p className="py-10 text-center text-gray-400 text-sm">No leads found</p>
        ) : leads.map((lead) => (
          <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="glass-card rounded-2xl p-4 block hover-lift">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{lead.customerName}</p>
                <p className="text-sm text-gray-500">{lead.customerPhone}</p>
              </div>
              <LeadStatusBadge status={lead.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
              <span className="bg-gray-100 px-2 py-0.5 rounded-full">{lead.city}</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded-full">{lead.source === 'agent_direct' ? 'Direct' : 'QR'}</span>
              <span>{lead.createdAt.toLocaleDateString('en-IN')}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden sm:block glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/30">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{lead.customerName}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.customerPhone}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.city}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{lead.source === 'agent_direct' ? 'Direct' : 'QR'}</td>
                  <td className="px-4 py-3"><LeadStatusBadge status={lead.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{lead.createdAt.toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${lead.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">No leads found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
