import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import Link from 'next/link';
import type { LeadStatus } from '@shinebuild/shared';
import { QuickStatusButtons } from './QuickStatusButtons';

export const dynamic = 'force-dynamic';

export default async function StaffLeadsPage() {
  const session = await getServerSession();
  const db = getAdminDb();

  type LeadRow = {
    id: string;
    customerName: string;
    customerPhone: string;
    city: string;
    status: LeadStatus;
    requirementNotes: string;
    createdAt: Date;
  };

  let leads: LeadRow[] = [];

  try {
    const snap = await db
      .collection(COLLECTIONS.LEADS)
      .where('assignedStaffIds', 'array-contains', session!.uid)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    leads = snap.docs.map((doc) => {
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
    });
  } catch (e) {
    console.error('StaffLeadsPage error:', e);
  }

  const pending = leads.filter((l) => l.status === 'new' || l.status === 'contacted').length;
  const qualified = leads.filter((l) => l.status === 'qualified').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Leads</h1>
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="font-semibold text-orange-600">{pending} pending</span>
          <span className="font-semibold text-green-600">{qualified} qualified</span>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">No leads assigned yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              {/* Top row: name + status + phone button */}
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/staff/leads/${lead.id}`}
                      className="font-semibold text-gray-900 hover:text-red-800 truncate"
                    >
                      {lead.customerName}
                    </Link>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {lead.city}
                    {lead.requirementNotes && (
                      <> · <span className="text-gray-400">{lead.requirementNotes.slice(0, 60)}{lead.requirementNotes.length > 60 ? '…' : ''}</span></>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lead.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Phone call button */}
                {lead.customerPhone && (
                  <a
                    href={`tel:${lead.customerPhone}`}
                    className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors"
                    title={`Call ${lead.customerPhone}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Quick status buttons */}
              <QuickStatusButtons leadId={lead.id} status={lead.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
