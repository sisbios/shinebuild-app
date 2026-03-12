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

    // Find the token document by hash
    const snap = await db
      .collection(COLLECTIONS.QR_TOKENS)
      .where('tokenHash', '==', tokenHash)
      .limit(1)
      .get();

    if (snap.empty) return { error: 'not-found' };

    const doc = snap.docs[0]!;
    const data = doc.data();

    // Validate without consuming — consumption happens atomically in submitQrLead
    if (data['usedAt'] != null) return { error: 'used' };
    if ((data['expiresAt'] as Timestamp).toDate() < new Date()) return { error: 'expired' };

    return { tokenId: doc.id, agentId: data['agentId'] };
  } catch (err: any) {
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
    const tokenRef = db.collection(COLLECTIONS.QR_TOKENS).doc(input.tokenId);

    // Idempotency: if a lead was already created for this token, return it
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

    // Get agentId from token doc
    const tokenSnap = await tokenRef.get();
    if (!tokenSnap.exists) return { error: 'Invalid token' };
    const agentId = tokenSnap.data()!['agentId'] as string;

    // Duplicate detection by phone
    const dupSnap = await db
      .collection(COLLECTIONS.LEADS)
      .where('customer.phoneE164', '==', input.phone)
      .limit(1)
      .get();

    const isDuplicate = !dupSnap.empty;
    const duplicateOfLeadId = isDuplicate ? dupSnap.docs[0]!.id : undefined;

    // Staff round-robin (outside transaction — async call)
    const assignedStaffIds = await getNextStaffRoundRobin()
      .then((s) => (s ? [s] : []))
      .catch(() => []);

    // Pre-create refs before the transaction
    const leadRef = db.collection(COLLECTIONS.LEADS).doc();
    const leadId = leadRef.id;
    const referenceId = leadId.slice(-6).toUpperCase();
    const agentViewRef = leadRef.collection(COLLECTIONS.AGENT_VIEW).doc('data');
    const nowTs = Timestamp.now();

    // Atomically consume token + create lead + create agentView
    await db.runTransaction(async (tx) => {
      const freshToken = await tx.get(tokenRef);
      if (!freshToken.exists) throw new Error('token-not-found');
      if (freshToken.data()!['usedAt'] != null) throw new Error('already-used');

      // Mark token consumed
      tx.update(tokenRef, { usedAt: FieldValue.serverTimestamp() });

      // Create lead
      tx.set(leadRef, {
        source: 'qr_self_entry',
        agentId,
        qrTokenId: input.tokenId,
        assignedStaffIds,
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
        createdAt: FieldValue.serverTimestamp(),
        createdBy: agentId,
      });

      // Create agentView
      tx.set(agentViewRef, {
        agentId,
        referenceId,
        maskedName: maskName(input.name),
        maskedPhone: maskPhone(input.phone),
        maskedEmail: maskEmail(input.email ?? null),
        source: 'qr_self_entry',
        status: isDuplicate ? 'duplicate' : 'new',
        incentiveAmount: 0,
        city: input.city,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    // Audit (outside transaction — best effort)
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: agentId,
      role: 'agent',
      action: 'lead.created',
      targetType: 'lead',
      targetId: leadId,
      createdAt: FieldValue.serverTimestamp(),
      metadata: { source: 'qr_self_entry', isDuplicate, city: input.city },
    });

    return { leadId, referenceId };
  } catch (err: any) {
    if (err.message === 'already-used') {
      // Race condition: another submit beat us — return the lead it created
      try {
        const db = getAdminDb();
        const racedLead = await db
          .collection(COLLECTIONS.LEADS)
          .where('qrTokenId', '==', input.tokenId)
          .limit(1)
          .get();
        if (!racedLead.empty) {
          const existing = racedLead.docs[0]!;
          const avSnap = await existing.ref.collection(COLLECTIONS.AGENT_VIEW).doc('data').get();
          return {
            leadId: existing.id,
            referenceId: avSnap.data()?.['referenceId'] ?? existing.id.slice(-6).toUpperCase(),
          };
        }
      } catch { /* fall through */ }
      return { error: 'This QR code has already been used. Please ask for a new one.' };
    }
    if (err.message === 'token-not-found') {
      return { error: 'Invalid QR token. Please ask for a new one.' };
    }
    console.error('submitQrLead error:', err);
    return { error: 'Failed to submit. Please try again.' };
  }
}
