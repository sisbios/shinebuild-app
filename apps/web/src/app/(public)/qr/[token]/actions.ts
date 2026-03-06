'use server';

import { getAdminDb } from '@/lib/firebase-server';
import { sha256Hex, maskName, maskPhone, maskEmail } from '@shinebuild/shared';
import { COLLECTIONS } from '@shinebuild/firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getNextStaffRoundRobin } from '@/lib/round-robin';

interface ValidationResult {
  error?: 'not-found' | 'expired' | 'used';
  tokenId?: string;
  agentId?: string;
}

export async function validateQrToken(rawToken: string): Promise<ValidationResult> {
  if (!rawToken || rawToken.length !== 64) return { error: 'not-found' };

  try {
    const db = getAdminDb();
    const tokenHash = sha256Hex(rawToken);

    // Firestore transaction for atomic single-use enforcement
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(
        db.collection(COLLECTIONS.QR_TOKENS).where('tokenHash', '==', tokenHash).limit(1) as any
      );

      // Transaction on queries not supported directly — use collection group query outside
      return { found: !snap.empty };
    });

    // Query outside transaction, then update atomically
    const snap = await db
      .collection(COLLECTIONS.QR_TOKENS)
      .where('tokenHash', '==', tokenHash)
      .limit(1)
      .get();

    if (snap.empty) return { error: 'not-found' };

    const doc = snap.docs[0]!;
    const data = doc.data();

    if (data['usedAt'] !== null) return { error: 'used' };
    if ((data['expiresAt'] as Timestamp).toDate() < new Date()) return { error: 'expired' };

    // Atomic consume
    await db.runTransaction(async (tx) => {
      const freshSnap = await tx.get(doc.ref);
      const fresh = freshSnap.data()!;
      if (fresh['usedAt'] !== null) throw new Error('already-used');
      tx.update(doc.ref, { usedAt: FieldValue.serverTimestamp() });
    });

    // Audit
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: data['agentId'],
      role: 'agent',
      action: 'qr.validated',
      targetType: 'qrToken',
      targetId: doc.id,
      createdAt: FieldValue.serverTimestamp(),
      metadata: {},
    });

    return { tokenId: doc.id, agentId: data['agentId'] };
  } catch (err: any) {
    if (err.message === 'already-used') return { error: 'used' };
    console.error('validateQrToken error:', err);
    return { error: 'not-found' };
  }
}

interface SubmitQrLeadInput {
  tokenId: string;
  name: string;
  phone: string;
  email?: string;
  requirementNotes: string;
  city: string;
}

interface SubmitQrLeadResult {
  error?: string;
  leadId?: string;
  referenceId?: string;
}

export async function submitQrLead(input: SubmitQrLeadInput): Promise<SubmitQrLeadResult> {
  try {
    const db = getAdminDb();

    // Get agentId from token doc
    const tokenSnap = await db.collection(COLLECTIONS.QR_TOKENS).doc(input.tokenId).get();
    if (!tokenSnap.exists) return { error: 'Invalid token' };
    const agentId = tokenSnap.data()!['agentId'] as string;

    // Idempotency: check if lead already exists for this tokenId
    const existingSnap = await db
      .collection(COLLECTIONS.LEADS)
      .where('qrTokenId', '==', input.tokenId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const existing = existingSnap.docs[0]!;
      const avSnap = await existing.ref.collection(COLLECTIONS.AGENT_VIEW).doc('data').get();
      return {
        leadId: existing.id,
        referenceId: avSnap.data()?.['referenceId'] ?? existing.id.slice(-6).toUpperCase(),
      };
    }

    // Duplicate detection by phone
    const normalizedPhone = input.phone;
    const dupSnap = await db
      .collection(COLLECTIONS.LEADS)
      .where('customer.phoneE164', '==', normalizedPhone)
      .limit(1)
      .get();

    const leadRef = db.collection(COLLECTIONS.LEADS).doc();
    const leadId = leadRef.id;
    const referenceId = leadId.slice(-6).toUpperCase();
    const now = FieldValue.serverTimestamp();
    const nowTs = Timestamp.now();

    const isDuplicate = !dupSnap.empty;
    const duplicateOfLeadId = isDuplicate ? dupSnap.docs[0]!.id : undefined;

    await leadRef.set({
      source: 'qr_self_entry',
      agentId,
      qrTokenId: input.tokenId,
      assignedStaffIds: await getNextStaffRoundRobin().then((s) => s ? [s] : []).catch(() => []),
      customer: {
        name: input.name,
        phoneE164: input.phone,
        email: input.email ?? null,
      },
      requirementNotes: input.requirementNotes,
      city: input.city,
      geo: null,
      photos: [],
      services: [],
      agentNotes: '',
      ...(duplicateOfLeadId ? { duplicateOfLeadId } : {}),
      status: {
        current: isDuplicate ? 'duplicate' : 'new',
        history: [{ status: isDuplicate ? 'duplicate' : 'new', at: nowTs, by: agentId }],
      },
      incentive: null,
      createdAt: now,
      createdBy: agentId,
    });

    // agentView subcollection
    await leadRef.collection(COLLECTIONS.AGENT_VIEW).doc('data').set({
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

    // Audit
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: agentId,
      role: 'agent',
      action: 'lead.created',
      targetType: 'lead',
      targetId: leadId,
      createdAt: now,
      metadata: { source: 'qr_self_entry', isDuplicate, city: input.city },
    });

    return { leadId, referenceId };
  } catch (err: any) {
    console.error('submitQrLead error:', err);
    return { error: 'Failed to submit. Please try again.' };
  }
}
