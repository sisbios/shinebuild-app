'use server';

import { getServerSession } from '@/lib/session';
import { AgentLeadSchema } from '@shinebuild/shared';
import type { AgentLeadInput } from '@shinebuild/shared';
import type { GeoData } from '@/components/shared/GeoCapture';

interface SubmitResult {
  error?: string;
  leadId?: string;
}

// Generate QR token for new lead entry
export async function generateQrForNewLead(): Promise<{ error?: string; qrUrl?: string; tokenId?: string }> {
  const { generateQrTokenAction } = await import('@/app/(agent)/agent/qr/actions');
  return generateQrTokenAction();
}

// Poll: check if customer filled the QR form and a lead was created
export async function checkLeadFromToken(tokenId: string): Promise<{ leadId?: string }> {
  const session = await getServerSession();
  if (!session || session.role !== 'agent') return {};
  try {
    const { getAdminDb } = await import('@/lib/firebase-server');
    const { COLLECTIONS } = await import('@shinebuild/firebase');
    const db = getAdminDb();
    const snap = await db.collection(COLLECTIONS.LEADS)
      .where('qrTokenId', '==', tokenId)
      .where('agentId', '==', session.uid)
      .limit(1)
      .get();
    if (snap.empty) return {};
    return { leadId: snap.docs[0]!.id };
  } catch { return {}; }
}

// Fetch service items for the checklist
export async function getServiceItems(): Promise<Array<{ id: string; name: string }>> {
  try {
    const { getAdminDb } = await import('@/lib/firebase-server');
    const { COLLECTIONS } = await import('@shinebuild/firebase');
    const db = getAdminDb();
    const snap = await db.collection(COLLECTIONS.SERVICE_ITEMS)
      .where('active', '==', true)
      .orderBy('order', 'asc')
      .get();
    return snap.docs.map((d) => ({ id: d.id, name: d.data()['name'] as string }));
  } catch { return []; }
}

// Step 2: Agent completes lead with geo, photos, services, notes
export async function completeAgentLeadDetails(
  leadId: string,
  details: { geo: GeoData; photos: string[]; services: string[]; agentNotes: string }
): Promise<{ error?: string }> {
  const session = await getServerSession();
  if (!session || session.role !== 'agent') return { error: 'Unauthorized' };
  try {
    const { getAdminDb } = await import('@/lib/firebase-server');
    const { COLLECTIONS } = await import('@shinebuild/firebase');
    const { FieldValue } = await import('firebase-admin/firestore');
    const db = getAdminDb();
    const leadRef = db.collection(COLLECTIONS.LEADS).doc(leadId);
    const snap = await leadRef.get();
    if (!snap.exists) return { error: 'Lead not found' };
    if (snap.data()!['agentId'] !== session.uid) return { error: 'Unauthorized' };
    await leadRef.update({
      geo: details.geo,
      photos: details.photos,
      services: details.services,
      agentNotes: details.agentNotes,
      agentDetailsAt: FieldValue.serverTimestamp(),
    });
    return {};
  } catch (err: any) {
    console.error('completeAgentLeadDetails error:', err);
    return { error: 'Failed to save details. Please try again.' };
  }
}

export async function submitAgentLead(input: AgentLeadInput): Promise<SubmitResult> {
  const session = await getServerSession();
  if (!session || session.role !== 'agent') return { error: 'Unauthorized' };

  const parsed = AgentLeadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  try {
    // Call Cloud Function via Firebase Admin (server-to-server)
    // In production this calls the deployed Cloud Function
    // For now we call Firestore directly as server action
    const { getAdminDb } = await import('@/lib/firebase-server');
    const { FieldValue, Timestamp } = await import('firebase-admin/firestore');
    const { maskName, maskPhone, sha256Hex } = await import('@shinebuild/shared');
    const { getNextStaffRoundRobin } = await import('@/lib/round-robin');

    const db = getAdminDb();

    // Duplicate detection would query by normalized phone — skipped here (no customer phone in direct entry)
    const leadRef = db.collection('leads').doc();
    const leadId = leadRef.id;
    const referenceId = leadId.slice(-6).toUpperCase();

    const now = FieldValue.serverTimestamp();

    await leadRef.set({
      source: 'agent_direct',
      agentId: session.uid,
      assignedStaffIds: await getNextStaffRoundRobin().then((s) => s ? [s] : []).catch(() => []),
      customer: { name: '', phoneE164: '', email: null },
      requirementNotes: input.requirementNotes,
      city: input.city,
      geo: input.geo,
      photos: input.photoStoragePaths,
      status: {
        current: 'new',
        history: [{ status: 'new', at: Timestamp.now(), by: session.uid }],
      },
      incentive: null,
      createdAt: now,
      createdBy: session.uid,
    });

    // Write agentView subcollection
    await leadRef.collection('agentView').doc('data').set({
      agentId: session.uid,
      referenceId,
      maskedName: '***',
      maskedPhone: '***',
      maskedEmail: null,
      source: 'agent_direct',
      status: 'new',
      incentiveAmount: 0,
      city: input.city,
      createdAt: now,
    });

    // Audit log
    await db.collection('audits').add({
      actorUid: session.uid,
      role: 'agent',
      action: 'lead.created',
      targetType: 'lead',
      targetId: leadId,
      createdAt: now,
      metadata: { source: 'agent_direct', city: input.city },
    });

    return { leadId };
  } catch (err: any) {
    console.error('submitAgentLead error:', err);
    return { error: 'Failed to submit lead. Please try again.' };
  }
}
