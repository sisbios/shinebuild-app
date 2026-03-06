import { getAdminDb, getAdminStorage } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LeadStatusUpdater } from './LeadStatusUpdater';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
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
  const photos = (d['photos'] as string[]) ?? [];

  // Generate signed URLs for photos (2-hour expiry)
  let photoUrls: string[] = [];
  if (photos.length > 0) {
    try {
      const bucket = getAdminStorage().bucket(
        process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      );
      photoUrls = await Promise.all(
        photos.map(async (path) => {
          const [url] = await bucket.file(path).getSignedUrl({
            action: 'read',
            expires: Date.now() + 2 * 60 * 60 * 1000,
          });
          return url;
        })
      );
    } catch { /* photos unavailable */ }
  }

  const lead = {
    id: leadId,
    agentId: d['agentId'] as string,
    source: d['source'] as string,
    customer: d['customer'] as { name: string; phoneE164: string; email?: string },
    requirementNotes: d['requirementNotes'] as string,
    agentNotes: d['agentNotes'] as string | undefined,
    services: (d['services'] as string[]) ?? [],
    city: d['city'] as string,
    status: d['status'] as { current: LeadStatus; history: Array<{ status: string; at: any; by: string; note?: string }> },
    geo: d['geo'] as { lat: number; lng: number; accuracy: number } | null,
    duplicateOfLeadId: d['duplicateOfLeadId'] as string | undefined,
    incentive: d['incentive'] as { amount: number; redeemedAt?: any } | null,
    createdAt: d['createdAt']?.toDate() ?? new Date(),
  };

  const mapsUrl = lead.geo
    ? `https://www.google.com/maps?q=${lead.geo.lat},${lead.geo.lng}`
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/leads" className="text-gray-400 hover:text-gray-600">← Leads</Link>
        <h1 className="text-xl font-bold text-gray-900">Lead Detail</h1>
        <LeadStatusBadge status={lead.status.current} />
      </div>

      {lead.duplicateOfLeadId && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-900">
            Duplicate of lead{' '}
            <Link href={`/admin/leads/${lead.duplicateOfLeadId}`} className="underline font-medium">
              {lead.duplicateOfLeadId.slice(-6).toUpperCase()}
            </Link>
          </p>
        </div>
      )}

      {/* Customer PII */}
      <section className="glass-card rounded-2xl divide-y divide-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50/80">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer Details</h2>
        </div>
        <Row label="Name">{lead.customer.name || '—'}</Row>
        <Row label="Phone">
          <a href={`tel:${lead.customer.phoneE164}`} className="text-red-700 hover:underline">
            {lead.customer.phoneE164}
          </a>
        </Row>
        {lead.customer.email && <Row label="Email">{lead.customer.email}</Row>}
        <Row label="City">{lead.city}</Row>
        <Row label="Source">{lead.source === 'agent_direct' ? 'Agent Direct' : 'QR Self-Entry'}</Row>
        <Row label="Requirement">
          <span className="max-w-xs text-right text-sm text-gray-700 whitespace-pre-wrap">{lead.requirementNotes}</span>
        </Row>
        {lead.agentNotes && (
          <Row label="Agent Notes">
            <span className="max-w-xs text-right text-sm text-gray-700 whitespace-pre-wrap">{lead.agentNotes}</span>
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
      {lead.geo && mapsUrl && (
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
            <span className="text-blue-400 text-xs ml-1">
              ({lead.geo.lat.toFixed(4)}, {lead.geo.lng.toFixed(4)} ±{Math.round(lead.geo.accuracy)}m)
            </span>
          </a>
        </section>
      )}

      {/* Photos */}
      <section className="glass-card rounded-2xl p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Photos ({photos.length})
        </h2>
        <PhotoGallery urls={photoUrls} />
      </section>

      {/* Status update */}
      <LeadStatusUpdater leadId={leadId} currentStatus={lead.status.current} />

      {/* Status history */}
      <section className="glass-card rounded-2xl p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Status History</h2>
        <div className="space-y-2">
          {lead.status.history.map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
              <LeadStatusBadge status={h.status as LeadStatus} />
              <span>by {h.by.slice(-6)}</span>
              {h.note && <span className="text-gray-400">— {h.note}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Incentive */}
      {lead.incentive && (
        <section className="glass-card rounded-2xl border border-green-200 bg-green-50/80 p-4">
          <h2 className="text-xs font-semibold uppercase text-green-700 mb-1">Incentive Earned</h2>
          <p className="text-2xl font-bold text-green-700">₹{lead.incentive.amount}</p>
          {lead.incentive.redeemedAt && <p className="text-xs text-green-600 mt-1">Redeemed</p>}
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
