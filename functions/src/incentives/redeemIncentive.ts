import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../lib/admin.js';
import { requireRole } from '../lib/auth-claims.js';
import { writeAuditLog } from '../lib/audit.js';

export const redeemIncentive = onCall(
  { enforceAppCheck: process.env['FUNCTIONS_EMULATOR'] !== 'true', region: 'asia-south1' },
  async (request) => {
    const { uid, claims } = requireRole(request, ['admin', 'superadmin']);
    const { agentId, amount } = request.data as { agentId: string; amount: number };

    if (!agentId || amount <= 0) throw new HttpsError('invalid-argument', 'Invalid input');

    const db = adminDb();
    const ledgerRef = db.collection('incentiveLedger').doc(agentId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ledgerRef);
      if (!snap.exists) throw new HttpsError('not-found', 'Ledger not found');
      const balance = snap.data()!['balance'] ?? 0;
      if (balance < amount) throw new HttpsError('failed-precondition', 'Insufficient balance');

      tx.update(ledgerRef, {
        totalRedeemed: FieldValue.increment(amount),
        balance: FieldValue.increment(-amount),
      });
    });

    await ledgerRef.collection('transactions').add({
      type: 'redeem',
      amount,
      createdAt: FieldValue.serverTimestamp(),
      note: `Payout of ₹${amount}`,
      redeemedBy: uid,
    });

    await writeAuditLog({
      actorUid: uid,
      role: claims['role'] as string,
      action: 'incentive.redeemed',
      targetType: 'incentiveLedger',
      targetId: agentId,
      metadata: { amount },
    });

    return { success: true };
  }
);
