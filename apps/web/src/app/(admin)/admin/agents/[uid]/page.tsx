import { requireRole } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { Badge } from '@shinebuild/ui';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AgentActionButtons } from './AgentActionButtons';
import { DirectEntryToggle } from './DirectEntryToggle';
import type { AgentStatus } from '@shinebuild/shared';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ uid: string }>;
}

export default async function AdminAgentDetailPage({ params }: Props) {
  const { uid } = await params;
  const session = await requireRole('admin', 'superadmin');
  const db = getAdminDb();

  const snap = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  if (!snap.exists || snap.data()!['role'] !== 'agent') notFound();

  const d = snap.data()!;
  const agent = {
    uid,
    name: d['name'],
    phone: d['phone'],
    status: (d['status'] ?? 'pending') as AgentStatus,
    city: d['metadata']?.['city'],
    district: d['metadata']?.['district'],
    directEntryEnabled: d['directEntryEnabled'] === true,
    createdAt: d['createdAt']?.toDate() ?? new Date(),
  };

  let leadCount = 0;
  try {
    const countSnap = await db
      .collection(COLLECTIONS.LEADS)
      .where('agentId', '==', uid)
      .get();
    leadCount = countSnap.size;
  } catch {}

  const isSuperAdmin = session.role === 'superadmin';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/agents" className="text-gray-400 hover:text-gray-600">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900">{agent.name}</h1>
        <Badge variant={agent.status}>{agent.status}</Badge>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <Row label="UID"><span className="font-mono text-xs">{agent.uid}</span></Row>
        <Row label="Phone">{agent.phone}</Row>
        <Row label="City">{agent.city ?? '—'}</Row>
        <Row label="District">{agent.district ?? '—'}</Row>
        <Row label="Joined">{agent.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</Row>
        <Row label="Leads Submitted">{leadCount}</Row>
        <Row label="Direct Entry">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
            agent.directEntryEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {agent.directEntryEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </Row>
      </div>

      <DirectEntryToggle
        uid={uid}
        initialEnabled={agent.directEntryEnabled}
        canEdit={isSuperAdmin}
      />

      <AgentActionButtons
        uid={uid}
        agentName={agent.name}
        currentStatus={agent.status}
        leadCount={leadCount}
        isSuperAdmin={isSuperAdmin}
      />
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
