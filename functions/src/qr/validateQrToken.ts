import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../lib/admin.js';
import { writeAuditLog } from '../lib/audit.js';
import { sha256Hex } from '@shinebuild/shared';

export const validateQrToken = onCall(
  {
    enforceAppCheck: process.env['FUNCTIONS_EMULATOR'] !== 'true',
    region: 'asia-south1',
  },
  async (request) => {
    const { token } = request.data as { token: string };
    if (!token || token.length !== 64) {
      throw new HttpsError('invalid-argument', 'Invalid token format');
    }

    const db = adminDb();
    const tokenHash = sha256Hex(token);

    // Query by tokenHash
    const snap = await db.collection('qrTokens').where('tokenHash', '==', tokenHash).limit(1).get();
    if (snap.empty) throw new HttpsError('not-found', 'QR token not found');

    const doc = snap.docs[0]!;
    const data = doc.data();

    if (data['usedAt'] !== null) throw new HttpsError('already-exists', 'QR token already used');
    if ((data['expiresAt'] as Timestamp).toDate() < new Date()) {
      throw new HttpsError('deadline-exceeded', 'QR token expired');
    }

    // Atomic consume via transaction
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(doc.ref);
      if (fresh.data()!['usedAt'] !== null) {
        throw new HttpsError('already-exists', 'QR token already used');
      }
      tx.update(doc.ref, { usedAt: FieldValue.serverTimestamp() });
    });

    const agentId = data['agentId'] as string;

    await writeAuditLog({
      actorUid: agentId,
      role: 'agent',
      action: 'qr.validated',
      targetType: 'qrToken',
      targetId: doc.id,
    });

    return { tokenId: doc.id, agentId };
  }
);
