import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LeadStatusUpdater } from './LeadStatusUpdater';
import type { LeadStatus } from '@shinebuild/shared';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ leadId: string }>;
}

export default async function AdminLeadDetailPage({ params }: Props) {
  const { leadId } = await params;
  const db = getAdminDb();

  const snap = await db.collection(COLLECTIONS.LEADS).doc(leadId).get();
  if (!snap.exists) notFound();

  const d = snap.data()!;
  const lead = {
    id: leadId,
    agentId: d['agentId'],
    source: d['source'],
    customer: d['customer'] as { name: string; phoneE164: string; email?: string },
    requirementNotes: d['requirementNotes'],
    city: d['city'],
    status: d['status'] as { current: LeadStatus; history: Array<{ status: string; at: any; by: string; note?: string }> },
    geo: d['geo'],
    photos: d['photos'] as string[],
    duplicateOfLeadId: d['duplicateOfLeadId'],
    assignedStaffIds: d['assignedStaffIds'] as string[],
    incentive: d['incentive'],
    createdAt: d['createdAt']?.toDate() ?? new Date(),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/leads" className="text-gray-400 hover:text-gray-600">← Leads</Link>
        <h1 className="text-xl font-bold text-gray-900">Lead Detail</h1>
        <LeadStatusBadge status={lead.status.current} />
      </div>

      {lead.duplicateOfLeadId && (
        <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
          <p className="text-sm text-orange-800">
            Duplicate of lead{' '}
            <Link href={`/admin/leads/${lead.duplicateOfLeadId}`} className="underline font-medium">
              {lead.duplicateOfLeadId.slice(-6).toUpperCase()}
            </Link>
          </p>
        </div>
      )}

      {/* Customer PII */}
      <section className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <div className="px-4 py-2 bg-gray-50 rounded-t-xl">
          <h2 className="text-xs font-semibold uppercase text-gray-500">Customer Details</h2>
        </div>
        <Row label="Name">{lead.customer.name}</Row>
        <Row label="Phone">{lead.customer.phoneE164}</Row>
        {lead.customer.email && <Row label="Email">{lead.customer.email}</Row>}
        <Row label="City">{lead.city}</Row>
        <Row label="Source">{lead.source === 'agent_direct' ? 'Agent Direct' : 'QR Self-Entry'}</Row>
        <Row label="Requirement">
          <span className="max-w-xs text-right text-sm text-gray-700">{lead.requirementNotes}</span>
        </Row>
      </section>

      {/* Geo */}
      {lead.geo && (
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase text-gray-500 mb-2">Location</h2>
          <p className="text-sm text-gray-700">
            {lead.geo.lat.toFixed(5)}, {lead.geo.lng.toFixed(5)} ± {Math.round(lead.geo.accuracy)}m
          </p>
        </section>
      )}

      {/* Status update */}
      <LeadStatusUpdater leadId={leadId} currentStatus={lead.status.current} />

      {/* Status history */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase text-gray-500 mb-3">Status History</h2>
        <div className="space-y-2">
          {lead.status.history.map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
              <LeadStatusBadge status={h.status as LeadStatus} />
              <span>by {h.by.slice(-6)}</span>
              {h.note && <span>— {h.note}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Incentive */}
      {lead.incentive && (
        <section className="rounded-xl border border-green-200 bg-green-50 p-4">
          <h2 className="text-xs font-semibold uppercase text-green-700 mb-2">Incentive</h2>
          <p className="text-lg font-bold text-green-700">₹{lead.incentive.amount}</p>
          {lead.incentive.redeemedAt && (
            <p className="text-xs text-green-600 mt-1">Redeemed</p>
          )}
        </section>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{children}</span>
    </div>
  );
}
