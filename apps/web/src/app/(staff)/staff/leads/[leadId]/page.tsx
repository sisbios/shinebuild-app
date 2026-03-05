import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { StaffQcForm } from './StaffQcForm';
import type { LeadStatus } from '@shinebuild/shared';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ leadId: string }>;
}

export default async function StaffLeadDetailPage({ params }: Props) {
  const { leadId } = await params;
  const session = await getServerSession();
  const db = getAdminDb();

  const snap = await db.collection(COLLECTIONS.LEADS).doc(leadId).get();
  if (!snap.exists) notFound();

  const d = snap.data()!;
  // Staff can only see assigned leads
  if (!d['assignedStaffIds']?.includes(session!.uid)) notFound();

  const lead = {
    id: leadId,
    customerName: d['customer']?.['name'],
    customerPhone: d['customer']?.['phoneE164'],
    city: d['city'],
    requirementNotes: d['requirementNotes'],
    status: d['status']?.['current'] as LeadStatus,
    qc: d['qc'] as { notes?: string; nextFollowUpAt?: any; lastContactAt?: any } | undefined,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/staff/leads" className="text-gray-400 hover:text-gray-600">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900">Lead Detail</h1>
        <LeadStatusBadge status={lead.status} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <Row label="Customer">{lead.customerName}</Row>
        <Row label="Phone">{lead.customerPhone}</Row>
        <Row label="City">{lead.city}</Row>
        <Row label="Requirement">
          <span className="text-sm text-gray-700 max-w-xs text-right">{lead.requirementNotes}</span>
        </Row>
      </div>

      <StaffQcForm leadId={leadId} currentStatus={lead.status} currentQc={lead.qc} />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900">{children}</span>
    </div>
  );
}
