'use server';

import { requireRole } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function redeemIncentive(
  agentId: string,
  amount: number
): Promise<{ error?: string }> {
  const session = await requireRole('admin', 'superadmin');
  const db = getAdminDb();

  try {
    const ledgerRef = db.collection(COLLECTIONS.INCENTIVE_LEDGER).doc(agentId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ledgerRef);
      if (!snap.exists) throw new Error('Ledger not found');
      const balance = snap.data()!['balance'] ?? 0;
      if (balance < amount) throw new Error('Insufficient balance');

      tx.update(ledgerRef, {
        totalRedeemed: FieldValue.increment(amount),
        balance: FieldValue.increment(-amount),
      });
    });

    // Write redemption transaction
    await ledgerRef
      .collection(COLLECTIONS.INCENTIVE_LEDGER_TRANSACTIONS)
      .add({
        type: 'redeem',
        amount,
        createdAt: FieldValue.serverTimestamp(),
        note: `Payout of ₹${amount}`,
        redeemedBy: session.uid,
      });

    // Audit
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session.uid,
      role: session.role,
      action: 'incentive.redeemed',
      targetType: 'incentiveLedger',
      targetId: agentId,
      createdAt: FieldValue.serverTimestamp(),
      metadata: { amount },
    });

    return {};
  } catch (err: any) {
    return { error: err.message ?? 'Failed to redeem' };
  }
}
