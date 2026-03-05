import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { LeadStatus } from '@shinebuild/shared';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ leadId: string }>;
}

export default async function AgentLeadDetailPage({ params }: Props) {
  const { leadId } = await params;
  const session = await getServerSession();
  const db = getAdminDb();

  let lead: {
    referenceId: string;
    maskedName: string;
    maskedPhone: string;
    maskedEmail: string | null;
    status: LeadStatus;
    city: string;
    source: string;
    incentiveAmount: number;
    createdAt: Date;
  } | null = null;

  try {
    const snap = await db
      .collection(COLLECTIONS.LEADS)
      .doc(leadId)
      .collection(COLLECTIONS.AGENT_VIEW)
      .doc('data')
      .get();

    if (!snap.exists) notFound();

    const d = snap.data()!;
    if (d['agentId'] !== session!.uid) notFound();

    lead = {
      referenceId: d['referenceId'],
      maskedName: d['maskedName'],
      maskedPhone: d['maskedPhone'],
      maskedEmail: d['maskedEmail'],
      status: d['status'] as LeadStatus,
      city: d['city'],
      source: d['source'],
      incentiveAmount: d['incentiveAmount'] ?? 0,
      createdAt: d['createdAt']?.toDate() ?? new Date(),
    };
  } catch {
    notFound();
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/agent/leads" className="text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Lead #{lead.referenceId}</h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <Row label="Status"><LeadStatusBadge status={lead.status} /></Row>
        <Row label="Customer">{lead.maskedName}</Row>
        <Row label="Phone">{lead.maskedPhone}</Row>
        {lead.maskedEmail && <Row label="Email">{lead.maskedEmail}</Row>}
        <Row label="City">{lead.city}</Row>
        <Row label="Source">{lead.source === 'agent_direct' ? 'Direct Entry' : 'QR Self-Entry'}</Row>
        <Row label="Submitted">{lead.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Row>
        {lead.incentiveAmount > 0 && (
          <Row label="Incentive">
            <span className="font-semibold text-green-600">₹{lead.incentiveAmount}</span>
          </Row>
        )}
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2">
        <p className="text-xs text-blue-800">
          Customer contact details are hidden to protect privacy. Our team will follow up directly.
        </p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{children}</span>
    </div>
  );
}
