import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../lib/admin.js';
import { writeAuditLog } from '../lib/audit.js';
import { SubmitQrLeadSchema, maskName, maskPhone, maskEmail } from '@shinebuild/shared';

export const submitQrLead = onCall(
  { enforceAppCheck: process.env['FUNCTIONS_EMULATOR'] !== 'true', region: 'asia-south1' },
  async (request) => {
    const parsed = SubmitQrLeadSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.errors[0]?.message ?? 'Invalid input');
    }
    const input = parsed.data;
    const db = adminDb();

    // Get agentId from token doc
    const tokenSnap = await db.collection('qrTokens').doc(input.tokenId).get();
    if (!tokenSnap.exists) throw new HttpsError('not-found', 'Token not found');
    const agentId = tokenSnap.data()!['agentId'] as string;

    // Idempotency: check if lead already exists for this tokenId
    const existingSnap = await db.collection('leads').where('qrTokenId', '==', input.tokenId).limit(1).get();
    if (!existingSnap.empty) {
      const existing = existingSnap.docs[0]!;
      const avSnap = await existing.ref.collection('agentView').doc('data').get();
      return { leadId: existing.id, referenceId: avSnap.data()?.['referenceId'] ?? existing.id.slice(-6).toUpperCase() };
    }

    // Duplicate detection by phone
    const dupSnap = await db.collection('leads').where('customer.phoneE164', '==', input.phone).limit(1).get();
    const isDuplicate = !dupSnap.empty;
    const duplicateOfLeadId = isDuplicate ? dupSnap.docs[0]!.id : undefined;

    const leadRef = db.collection('leads').doc();
    const leadId = leadRef.id;
    const referenceId = leadId.slice(-6).toUpperCase();
    const now = FieldValue.serverTimestamp();

    await leadRef.set({
      source: 'qr_self_entry',
      agentId,
      qrTokenId: input.tokenId,
      assignedStaffIds: [],
      customer: { name: input.name, phoneE164: input.phone, email: input.email ?? null },
      requirementNotes: input.requirementNotes,
      city: input.city,
      geo: null,
      photos: [],
      ...(duplicateOfLeadId ? { duplicateOfLeadId } : {}),
      status: {
        current: isDuplicate ? 'duplicate' : 'new',
        history: [{ status: isDuplicate ? 'duplicate' : 'new', at: now, by: agentId }],
      },
      incentive: null,
      createdAt: now,
      createdBy: agentId,
    });

    await leadRef.collection('agentView').doc('data').set({
      agentId,
      referenceId,
      maskedName: maskName(input.name),
      maskedPhone: maskPhone(input.phone),
      maskedEmail: maskEmail(input.email ?? null),
      source: 'qr_self_entry',
      status: isDuplicate ? 'duplicate' : 'new',
      incentiveAmount: 0,
      city: input.city,
      createdAt: now,
    });

    await writeAuditLog({
      actorUid: agentId,
      role: 'agent',
      action: 'lead.created',
      targetType: 'lead',
      targetId: leadId,
      metadata: { source: 'qr_self_entry', isDuplicate, city: input.city },
    });

    return { leadId, referenceId };
  }
);
