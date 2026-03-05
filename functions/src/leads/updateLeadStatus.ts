import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../lib/admin.js';
import { requireRole } from '../lib/auth-claims.js';
import { writeAuditLog } from '../lib/audit.js';
import type { LeadStatus } from '@shinebuild/shared';

const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'rejected', 'duplicate'],
  contacted: ['qualified', 'rejected'],
  qualified: ['converted', 'rejected'],
  rejected: ['contacted'],
  duplicate: [],
  converted: [],
};

export const updateLeadStatus = onCall(
  { enforceAppCheck: process.env['FUNCTIONS_EMULATOR'] !== 'true', region: 'asia-south1' },
  async (request) => {
    const { uid, claims } = requireRole(request, ['staff', 'admin', 'superadmin']);
    const { leadId, status, note } = request.data as { leadId: string; status: LeadStatus; note?: string };

    const db = adminDb();
    const leadRef = db.collection('leads').doc(leadId);
    const snap = await leadRef.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Lead not found');

    const current = snap.data()!['status']['current'] as LeadStatus;
    if (!VALID_TRANSITIONS[current]?.includes(status)) {
      throw new HttpsError('failed-precondition', `Cannot transition from ${current} to ${status}`);
    }

    const now = FieldValue.serverTimestamp();
    const historyEntry = { status, at: now, by: uid, ...(note ? { note } : {}) };

    await leadRef.update({
      'status.current': status,
      'status.history': FieldValue.arrayUnion(historyEntry),
    });

    // Sync agentView status
    const avRef = leadRef.collection('agentView').doc('data');
    const avSnap = await avRef.get();
    if (avSnap.exists) await avRef.update({ status });

    await writeAuditLog({
      actorUid: uid,
      role: claims['role'] as string,
      action: 'lead.status_updated',
      targetType: 'lead',
      targetId: leadId,
      metadata: { previousStatus: current, newStatus: status, note: note ?? null },
    });

    return { success: true };
  }
);
