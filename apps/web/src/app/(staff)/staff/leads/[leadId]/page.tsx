import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { StaffQcForm } from './StaffQcForm';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
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
  if (!d['assignedStaffIds']?.includes(session!.uid)) notFound();

  const photos = (d['photos'] as string[]) ?? [];
  const photoUrls = photos.map(
    (path) => `/api/photo?path=${encodeURIComponent(path)}`
  );

  const geo = d['geo'] as { lat: number; lng: number; accuracy: number } | null;
  const mapsUrl = geo ? `https://www.google.com/maps?q=${geo.lat},${geo.lng}` : null;

  const lead = {
    id: leadId,
    customerName: d['customer']?.['name'] as string,
    customerPhone: d['customer']?.['phoneE164'] as string,
    city: d['city'] as string,
    requirementNotes: d['requirementNotes'] as string,
    agentNotes: d['agentNotes'] as string | undefined,
    services: (d['services'] as string[]) ?? [],
    status: d['status']?.['current'] as LeadStatus,
    qc: d['qc'] as { notes?: string } | undefined,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/staff/leads" className="text-gray-400 hover:text-gray-600">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900">Lead Detail</h1>
        <LeadStatusBadge status={lead.status} />
      </div>

      <section className="glass-card rounded-2xl divide-y divide-gray-100 overflow-hidden">
        <Row label="Customer">{lead.customerName || '—'}</Row>
        <Row label="Phone">
          <a href={`tel:${lead.customerPhone}`} className="text-red-700 hover:underline">{lead.customerPhone}</a>
        </Row>
        <Row label="City">{lead.city}</Row>
        <Row label="Requirement">
          <span className="text-sm text-gray-700 max-w-xs text-right whitespace-pre-wrap">{lead.requirementNotes}</span>
        </Row>
        {lead.agentNotes && (
          <Row label="Agent Notes">
            <span className="text-sm text-gray-700 max-w-xs text-right whitespace-pre-wrap">{lead.agentNotes}</span>
          </Row>
        )}
        {lead.services.length > 0 && (
          <Row label="Services">
            <div className="flex flex-wrap gap-1 justify-end">
              {lead.services.map((s) => (
                <span key={s} className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs text-red-700">{s}</span>
              ))}
            </div>
          </Row>
        )}
      </section>

      {/* Location */}
      {geo && mapsUrl && (
        <section className="glass-card rounded-2xl p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Location</h2>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Open in Google Maps
            <span className="text-blue-400 text-xs ml-1">({geo.lat.toFixed(4)}, {geo.lng.toFixed(4)})</span>
          </a>
        </section>
      )}

      {/* Photos */}
      <section className="glass-card rounded-2xl p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Photos ({photos.length})</h2>
        <PhotoGallery urls={photoUrls} />
      </section>

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
