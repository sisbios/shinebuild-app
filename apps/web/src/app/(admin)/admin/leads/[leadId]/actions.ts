'use server';

import { requireRole } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import type { LeadStatus } from '@shinebuild/shared';

const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'rejected', 'duplicate'],
  contacted: ['qualified', 'rejected'],
  qualified: ['converted', 'rejected'],
  rejected: ['contacted'],
  duplicate: [],
  converted: [],
};

export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  note?: string
): Promise<{ error?: string }> {
  const session = await requireRole('admin', 'superadmin', 'staff');
  const db = getAdminDb();

  try {
    const leadRef = db.collection(COLLECTIONS.LEADS).doc(leadId);
    const snap = await leadRef.get();
    if (!snap.exists) return { error: 'Lead not found' };

    const current = snap.data()!['status']['current'] as LeadStatus;
    const allowed = VALID_TRANSITIONS[current] ?? [];
    if (!allowed.includes(newStatus)) {
      return { error: `Cannot transition from ${current} to ${newStatus}` };
    }

    const historyEntry = {
      status: newStatus,
      at: Timestamp.now(), // serverTimestamp() not allowed inside arrayUnion
      by: session.uid,
      ...(note ? { note } : {}),
    };

    await leadRef.update({
      'status.current': newStatus,
      'status.history': FieldValue.arrayUnion(historyEntry),
    });

    // Sync status to agentView
    const agentViewRef = leadRef.collection(COLLECTIONS.AGENT_VIEW).doc('data');
    const avSnap = await agentViewRef.get();
    if (avSnap.exists) {
      await agentViewRef.update({ status: newStatus });
    }

    // Trigger incentive computation on qualified
    if (newStatus === 'qualified') {
      await computeIncentive(leadId, snap.data()!['agentId'] as string, db);
    }

    // Audit
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session.uid,
      role: session.role,
      action: 'lead.status_updated',
      targetType: 'lead',
      targetId: leadId,
      createdAt: FieldValue.serverTimestamp(),
      metadata: { previousStatus: current, newStatus, note: note ?? null },
    });

    // Revalidate staff and admin pages so they reflect the new status immediately
    revalidatePath('/staff/leads');
    revalidatePath('/staff/dashboard');
    revalidatePath('/admin/leads');

    return {};
  } catch (err: any) {
    console.error('updateLeadStatus error:', err);
    return { error: 'Failed to update status' };
  }
}

async function computeIncentive(
  leadId: string,
  agentId: string,
  db: ReturnType<typeof getAdminDb>
): Promise<void> {
  try {
    // Find active incentive rule
    const rulesSnap = await db
      .collection(COLLECTIONS.INCENTIVE_RULES)
      .where('active', '==', true)
      .orderBy('effectiveFrom', 'desc')
      .limit(1)
      .get();

    if (rulesSnap.empty) return;

    const ruleDoc = rulesSnap.docs[0]!;
    const rule = ruleDoc.data();
    const amount = rule['baseAmount'] as number;
    const now = FieldValue.serverTimestamp();

    // Write incentive on lead
    await db.collection(COLLECTIONS.LEADS).doc(leadId).update({
      incentive: {
        amount,
        ruleId: ruleDoc.id,
        earnedAt: now,
        redeemedAt: null,
      },
    });

    // Update ledger (upsert)
    const ledgerRef = db.collection(COLLECTIONS.INCENTIVE_LEDGER).doc(agentId);
    await db.runTransaction(async (tx) => {
      const ledgerSnap = await tx.get(ledgerRef);
      if (!ledgerSnap.exists) {
        tx.set(ledgerRef, {
          agentId,
          totalEarned: amount,
          totalRedeemed: 0,
          balance: amount,
        });
      } else {
        const prev = ledgerSnap.data()!;
        tx.update(ledgerRef, {
          totalEarned: (prev['totalEarned'] ?? 0) + amount,
          balance: (prev['balance'] ?? 0) + amount,
        });
      }
    });

    // Write transaction
    await db
      .collection(COLLECTIONS.INCENTIVE_LEDGER)
      .doc(agentId)
      .collection(COLLECTIONS.INCENTIVE_LEDGER_TRANSACTIONS)
      .add({
        type: 'earn',
        amount,
        leadId,
        createdAt: now,
        note: `Incentive for lead ${leadId.slice(-6).toUpperCase()} (rule: ${rule['name']})`,
      });

    // Sync to agentView
    const avRef = db.collection(COLLECTIONS.LEADS).doc(leadId).collection(COLLECTIONS.AGENT_VIEW).doc('data');
    const avSnap = await avRef.get();
    if (avSnap.exists) {
      await avRef.update({ incentiveAmount: amount });
    }

    // Audit
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: agentId,
      role: 'agent',
      action: 'incentive.earned',
      targetType: 'lead',
      targetId: leadId,
      createdAt: now,
      metadata: { amount, ruleId: ruleDoc.id },
    });
  } catch (err) {
    console.error('computeIncentive error:', err);
  }
}
