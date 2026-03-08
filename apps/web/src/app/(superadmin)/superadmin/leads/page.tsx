import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { AdminLeadsList } from '@/app/(admin)/admin/leads/AdminLeadsList';
import type { LeadStatus } from '@shinebuild/shared';

export const dynamic = 'force-dynamic';

interface Props { searchParams: Promise<{ status?: string; city?: string }> }

export default async function SuperAdminLeadsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = getAdminDb();
  let leads: Array<{
    id: string; agentId: string; customerName: string; customerPhone: string;
    status: LeadStatus; city: string; source: string; createdAt: Date;
  }> = [];

  try {
    const snap = await db.collection(COLLECTIONS.LEADS).orderBy('createdAt', 'desc').limit(500).get();
    leads = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id, agentId: d['agentId'],
        customerName: d['customer']?.['name'] ?? '—',
        customerPhone: d['customer']?.['phoneE164'] ?? '—',
        status: d['status']?.['current'] as LeadStatus,
        city: d['city'] ?? '', source: d['source'] ?? '',
        createdAt: d['createdAt']?.toDate() ?? new Date(),
      };
    });
    if (sp.status) leads = leads.filter((l) => l.status === sp.status);
    if (sp.city) leads = leads.filter((l) => l.city?.toLowerCase().includes(sp.city!.toLowerCase()));
  } catch (e) {
    console.error('SuperAdminLeadsPage error:', e);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">{leads.length} leads — click a lead to edit, reassign staff, or delete</p>
        </div>
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

      {/* Superadmin tip */}
      <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-2.5 flex items-center gap-2 text-xs text-purple-700">
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Open any lead to <strong>edit details</strong>, <strong>reassign staff</strong>, update status, or <strong>delete</strong>. The amber "Edit Lead" button is superadmin-only.</span>
      </div>

      <AdminLeadsList initialLeads={leads} />
    </div>
  );
}
