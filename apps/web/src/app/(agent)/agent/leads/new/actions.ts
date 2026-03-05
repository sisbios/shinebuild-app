'use server';

import { getServerSession } from '@/lib/session';
import { AgentLeadSchema } from '@shinebuild/shared';
import type { AgentLeadInput } from '@shinebuild/shared';

interface SubmitResult {
  error?: string;
  leadId?: string;
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
    const { FieldValue } = await import('firebase-admin/firestore');
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
        history: [{ status: 'new', at: now, by: session.uid }],
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
