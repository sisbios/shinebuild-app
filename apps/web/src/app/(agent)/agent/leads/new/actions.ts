'use server';

import { getServerSession } from '@/lib/session';
import { AgentDirectLeadSchema } from '@shinebuild/shared';
import type { AgentDirectLeadInput } from '@shinebuild/shared';
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

// Step 2: Agent completes lead with geo, photos, services, notes (QR flow)
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

// Direct entry: agent submits a complete lead WITHOUT customer-side QR scan.
// Requires the agent's user doc to have directEntryEnabled === true (set by superadmin).
export async function submitAgentDirectLead(input: AgentDirectLeadInput): Promise<SubmitResult> {
  const session = await getServerSession();
  if (!session || session.role !== 'agent') return { error: 'Unauthorized' };

  const parsed = AgentDirectLeadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data;

  try {
    const { getAdminDb } = await import('@/lib/firebase-server');
    const { COLLECTIONS } = await import('@shinebuild/firebase');
    const { FieldValue, Timestamp } = await import('firebase-admin/firestore');
    const { maskName, maskPhone, maskEmail } = await import('@shinebuild/shared');
    const { getNextStaffRoundRobin } = await import('@/lib/round-robin');

    const db = getAdminDb();

    // Re-check permission server-side — never trust the client.
    const userSnap = await db.collection(COLLECTIONS.USERS).doc(session.uid).get();
    const userData = userSnap.data();
    if (!userSnap.exists || userData?.['role'] !== 'agent') return { error: 'Unauthorized' };
    if (userData?.['status'] !== 'approved') return { error: 'Account not active' };
    if (userData?.['directEntryEnabled'] !== true) {
      return { error: 'Direct lead entry is not enabled for your account. Use the QR flow.' };
    }

    // Duplicate detection by phone
    const dupSnap = await db
      .collection(COLLECTIONS.LEADS)
      .where('customer.phoneE164', '==', data.customerPhone)
      .limit(1)
      .get();
    const isDuplicate = !dupSnap.empty;
    const duplicateOfLeadId = isDuplicate ? dupSnap.docs[0]!.id : undefined;

    const assignedStaffIds = await getNextStaffRoundRobin()
      .then((s) => (s ? [s] : []))
      .catch(() => []);

    const leadRef = db.collection(COLLECTIONS.LEADS).doc();
    const leadId = leadRef.id;
    const referenceId = leadId.slice(-6).toUpperCase();
    const nowTs = Timestamp.now();
    const initialStatus = isDuplicate ? 'duplicate' : 'new';

    await leadRef.set({
      source: 'agent_direct',
      agentId: session.uid,
      assignedStaffIds,
      customer: {
        name: data.customerName,
        phoneE164: data.customerPhone,
        email: data.customerEmail || null,
      },
      requirementNotes: data.requirementNotes,
      city: data.city,
      geo: data.geo,
      photos: data.photoStoragePaths,
      services: data.services,
      agentNotes: data.agentNotes ?? '',
      ...(duplicateOfLeadId ? { duplicateOfLeadId } : {}),
      status: {
        current: initialStatus,
        history: [{ status: initialStatus, at: nowTs, by: session.uid }],
      },
      incentive: null,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: session.uid,
    });

    await leadRef.collection(COLLECTIONS.AGENT_VIEW).doc('data').set({
      agentId: session.uid,
      referenceId,
      maskedName: maskName(data.customerName),
      maskedPhone: maskPhone(data.customerPhone),
      maskedEmail: maskEmail(data.customerEmail || null),
      source: 'agent_direct',
      status: initialStatus,
      incentiveAmount: 0,
      city: data.city,
      createdAt: FieldValue.serverTimestamp(),
    });

    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session.uid,
      role: 'agent',
      action: 'lead.created',
      targetType: 'lead',
      targetId: leadId,
      createdAt: FieldValue.serverTimestamp(),
      metadata: { source: 'agent_direct', city: data.city, isDuplicate },
    });

    return { leadId };
  } catch (err: any) {
    console.error('submitAgentDirectLead error:', err);
    return { error: 'Failed to submit lead. Please try again.' };
  }
}
