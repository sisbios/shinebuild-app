import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import type { LeadStatus } from '@shinebuild/shared';
import Link from 'next/link';
import { LeadCard } from './LeadCard';

export const dynamic = 'force-dynamic';

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'rejected',  label: 'Rejected' },
] as const;

type FilterKey = typeof FILTERS[number]['key'];

function matchesFilter(status: LeadStatus, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'pending') return status === 'new' || status === 'contacted';
  return status === filter;
}

interface Props {
  searchParams: Promise<{ filter?: string }>;
}

export default async function StaffLeadsPage({ searchParams }: Props) {
  const { filter: rawFilter } = await searchParams;
  const activeFilter = (FILTERS.map((f) => f.key).includes(rawFilter as FilterKey)
    ? rawFilter
    : 'all') as FilterKey;

  const session = await getServerSession();
  const db = getAdminDb();

  type LeadRow = {
    id: string; customerName: string; customerPhone: string;
    city: string; status: LeadStatus; requirementNotes: string; createdAt: Date;
  };

  let allLeads: LeadRow[] = [];

  try {
    // No orderBy — array-contains + orderBy requires a composite index.
    // Sort in memory below instead.
    const snap = await db
      .collection(COLLECTIONS.LEADS)
      .where('assignedStaffIds', 'array-contains', session!.uid)
      .get();

    allLeads = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        customerName: d['customer']?.['name'] ?? '—',
        customerPhone: d['customer']?.['phoneE164'] ?? '',
        city: d['city'] ?? '',
        status: d['status']?.['current'] as LeadStatus,
        requirementNotes: d['requirementNotes'] ?? '',
        createdAt: d['createdAt']?.toDate() ?? new Date(),
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e) {
    console.error('StaffLeadsPage error:', e);
  }

  const counts: Record<FilterKey, number> = {
    all: allLeads.length,
    pending: allLeads.filter((l) => l.status === 'new' || l.status === 'contacted').length,
    qualified: allLeads.filter((l) => l.status === 'qualified').length,
    rejected: allLeads.filter((l) => l.status === 'rejected').length,
  };

  const filtered = allLeads.filter((l) => matchesFilter(l.status, activeFilter));

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{allLeads.length} total leads assigned</p>
        </div>
        <Link
          href="/staff/leads/new"
          className="flex items-center gap-1.5 rounded-xl brand-gradient px-3.5 py-2 text-sm font-semibold text-white shadow-sm flex-shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Lead
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {FILTERS.map((f) => {
          const active = f.key === activeFilter;
          const count = counts[f.key];
          const isPending = f.key === 'pending' && count > 0;
          return (
            <Link
              key={f.key}
              href={f.key === 'all' ? '/staff/leads' : `/staff/leads?filter=${f.key}`}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                active
                  ? 'brand-gradient text-white shadow-md'
                  : 'glass text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.label}
              <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                active
                  ? 'bg-white/20 text-white'
                  : isPending
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Lead cards grid */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-3xl py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-semibold text-gray-500">
            {activeFilter === 'all' ? 'No leads assigned yet' : `No ${activeFilter} leads`}
          </p>
          {activeFilter !== 'all' && (
            <Link href="/staff/leads" className="mt-2 inline-block text-xs text-red-700 font-medium hover:underline">
              View all leads
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
