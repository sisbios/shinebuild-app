import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';
import type { AgentStatus } from '@shinebuild/shared';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  deactivated: 'bg-gray-100 text-gray-500',
};

interface Props { searchParams: Promise<{ status?: string; sort?: string }> }

export default async function AdminAgentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = getAdminDb();
  let agents: Array<{ uid: string; name: string; phone: string; status: AgentStatus; city?: string; createdAt: Date; leadCount: number }> = [];

  try {
    let q: any = db.collection(COLLECTIONS.USERS).where('role', '==', 'agent');
    if (sp.status) q = q.where('status', '==', sp.status);
    const snap = await q.limit(200).get();
    const raw = snap.docs.map((doc: any) => {
      const d = doc.data();
      return { uid: doc.id, name: d['name'] ?? '—', phone: d['phone'] ?? '—',
        status: (d['status'] ?? 'pending') as AgentStatus, city: d['metadata']?.['city'],
        createdAt: d['createdAt']?.toDate() ?? new Date(), leadCount: 0 };
    });
    const counts = await Promise.all(
      raw.map((a: any) => db.collection(COLLECTIONS.LEADS).where('agentId', '==', a.uid).get()
        .then((s: any) => s.size).catch(() => 0))
    );
    agents = raw.map((a: any, i: number) => ({ ...a, leadCount: counts[i] }));
    if (sp.sort === 'leads') agents.sort((a, b) => b.leadCount - a.leadCount);
    else if (sp.sort === 'name') agents.sort((a, b) => a.name.localeCompare(b.name));
    else agents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (err) { console.error('AdminAgentsPage error:', err); }

  const cnts = { pending: 0, approved: 0, rejected: 0, deactivated: 0 };
  agents.forEach((a) => { if (a.status in cnts) cnts[a.status as keyof typeof cnts]++; });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
        <p className="text-sm text-gray-500 mt-0.5">{agents.length} total</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(['', 'pending', 'approved', 'rejected', 'deactivated'] as const).map((s) => (
          <Link key={s} href={s ? `/admin/agents?status=${s}` : '/admin/agents'}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              sp.status === s || (!sp.status && s === '') ? 'brand-gradient text-white shadow-sm' : 'glass text-gray-600 hover:text-gray-900'
            }`}>
            {s || 'All'} {s && `(${cnts[s as keyof typeof cnts]})`}
          </Link>
        ))}
        <span className="ml-auto flex gap-2">
          {['date','leads','name'].map((sort) => (
            <Link key={sort} href={`/admin/agents?${sp.status ? `status=${sp.status}&` : ''}sort=${sort}`}
              className="rounded-full px-3 py-1.5 text-xs font-semibold glass text-gray-600 hover:text-gray-900 capitalize">
              {sort}
            </Link>
          ))}
        </span>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {agents.length === 0 ? (
          <p className="py-10 text-center text-gray-400 text-sm">No agents found</p>
        ) : agents.map((agent) => (
          <div key={agent.uid} className="glass-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full brand-gradient flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.phone}</p>
                </div>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0 ${STATUS_STYLE[agent.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {agent.status}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                {agent.city && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{agent.city}</span>}
                <span>{agent.leadCount} leads</span>
                <span>{agent.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
              </div>
              <Link href={`/admin/agents/${agent.uid}`}
                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">
                Manage <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/40">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Agent</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hidden md:table-cell">City</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Leads</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hidden lg:table-cell">Joined</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/30">
              {agents.map((agent) => (
                <tr key={agent.uid} className="hover:bg-white/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 truncate max-w-[120px]">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{agent.phone}</td>
                  <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{agent.city ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[agent.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium">{agent.leadCount}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400 hidden lg:table-cell">
                    {agent.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/admin/agents/${agent.uid}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors">
                      Manage <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  </td>
                </tr>
              ))}
              {agents.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">No agents found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
