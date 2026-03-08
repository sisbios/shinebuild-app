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

    // Write lead status + sync agentView in parallel
    const agentViewRef = leadRef.collection(COLLECTIONS.AGENT_VIEW).doc('data');
    await Promise.all([
      leadRef.update({
        'status.current': newStatus,
        'status.history': FieldValue.arrayUnion(historyEntry),
      }),
      agentViewRef.update({ status: newStatus }).catch(() => {}), // ignore if no agentView
    ]);

    // Incentive computation on qualified (can run in parallel with audit)
    const incentivePromise = newStatus === 'qualified'
      ? computeIncentive(leadId, snap.data()!['agentId'] as string, db)
      : Promise.resolve();

    // Non-blocking audit — don't make the user wait for this
    db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session.uid,
      role: session.role,
      action: 'lead.status_updated',
      targetType: 'lead',
      targetId: leadId,
      createdAt: FieldValue.serverTimestamp(),
      metadata: { previousStatus: current, newStatus, note: note ?? null },
    }).catch(console.error);

    await incentivePromise;

    return {};
  } catch (err: any) {
    console.error('updateLeadStatus error:', err);
    return { error: 'Failed to update status' };
  }
}

export async function deleteLead(leadId: string): Promise<{ error?: string }> {
  const session = await requireRole('admin', 'superadmin');
  const db = getAdminDb();
  try {
    const leadRef = db.collection(COLLECTIONS.LEADS).doc(leadId);
    const snap = await leadRef.get();
    if (!snap.exists) return { error: 'Lead not found' };

    const avRef = leadRef.collection(COLLECTIONS.AGENT_VIEW).doc('data');

    // Non-blocking audit + delete lead + delete agentView — all in parallel
    await Promise.all([
      leadRef.delete(),
      avRef.delete().catch(() => {}), // ignore if no agentView
    ]);

    // Audit is fire-and-forget — don't block the user
    db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session.uid,
      role: session.role,
      action: 'lead.deleted',
      targetType: 'lead',
      targetId: leadId,
      createdAt: FieldValue.serverTimestamp(),
      metadata: {
        customerName: snap.data()!['customer']?.['name'] ?? '',
        status: snap.data()!['status']?.['current'] ?? '',
      },
    }).catch(console.error);

    revalidatePath('/admin/leads');
    return {};
  } catch (err: any) {
    console.error('deleteLead error:', err);
    return { error: 'Failed to delete lead' };
  }
}

export async function editLead(
  leadId: string,
  data: { customerName: string; customerPhone: string; city: string; requirementNotes: string }
): Promise<{ error?: string }> {
  await requireRole('admin', 'superadmin');
  const db = getAdminDb();
  try {
    const leadRef = db.collection(COLLECTIONS.LEADS).doc(leadId);
    const snap = await leadRef.get();
    if (!snap.exists) return { error: 'Lead not found' };
    await leadRef.update({
      'customer.name': data.customerName.trim(),
      'customer.phoneE164': data.customerPhone.trim(),
      city: data.city.trim(),
      requirementNotes: data.requirementNotes.trim(),
    });
    revalidatePath(`/admin/leads/${leadId}`);
    revalidatePath('/admin/leads');
    return {};
  } catch (err: any) {
    console.error('editLead error:', err);
    return { error: 'Failed to update lead' };
  }
}

export async function assignStaffToLead(leadId: string, staffId: string): Promise<{ error?: string }> {
  const session = await requireRole('admin', 'superadmin');
  const db = getAdminDb();
  try {
    await db.collection(COLLECTIONS.LEADS).doc(leadId).update({
      assignedStaffIds: FieldValue.arrayUnion(staffId),
    });
    db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session.uid, role: session.role, action: 'lead.staff_assigned',
      targetType: 'lead', targetId: leadId,
      createdAt: FieldValue.serverTimestamp(), metadata: { staffId },
    }).catch(console.error);
    return {};
  } catch (err: any) {
    console.error('assignStaffToLead error:', err);
    return { error: 'Failed to assign staff' };
  }
}

export async function removeStaffFromLead(leadId: string, staffId: string): Promise<{ error?: string }> {
  const session = await requireRole('admin', 'superadmin');
  const db = getAdminDb();
  try {
    await db.collection(COLLECTIONS.LEADS).doc(leadId).update({
      assignedStaffIds: FieldValue.arrayRemove(staffId),
    });
    db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session.uid, role: session.role, action: 'lead.staff_removed',
      targetType: 'lead', targetId: leadId,
      createdAt: FieldValue.serverTimestamp(), metadata: { staffId },
    }).catch(console.error);
    return {};
  } catch (err: any) {
    console.error('removeStaffFromLead error:', err);
    return { error: 'Failed to remove staff' };
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
