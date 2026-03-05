import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../lib/admin.js';
import { requireApprovedAgent } from '../lib/auth-claims.js';
import { writeAuditLog } from '../lib/audit.js';
import { AgentLeadSchema } from '@shinebuild/shared';

export const submitAgentLead = onCall(
  { enforceAppCheck: process.env['FUNCTIONS_EMULATOR'] !== 'true', region: 'asia-south1' },
  async (request) => {
    const { uid } = requireApprovedAgent(request);
    const parsed = AgentLeadSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.errors[0]?.message ?? 'Invalid input');
    }

    const input = parsed.data;
    const db = adminDb();
    const leadRef = db.collection('leads').doc();
    const leadId = leadRef.id;
    const referenceId = leadId.slice(-6).toUpperCase();
    const now = FieldValue.serverTimestamp();

    await leadRef.set({
      source: 'agent_direct',
      agentId: uid,
      assignedStaffIds: [],
      customer: { name: '', phoneE164: '', email: null },
      requirementNotes: input.requirementNotes,
      city: input.city,
      geo: input.geo,
      photos: input.photoStoragePaths,
      status: { current: 'new', history: [{ status: 'new', at: now, by: uid }] },
      incentive: null,
      createdAt: now,
      createdBy: uid,
    });

    await leadRef.collection('agentView').doc('data').set({
      agentId: uid,
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

    await writeAuditLog({
      actorUid: uid,
      role: 'agent',
      action: 'lead.created',
      targetType: 'lead',
      targetId: leadId,
      metadata: { source: 'agent_direct', city: input.city },
    });

    return { leadId, referenceId };
  }
);
