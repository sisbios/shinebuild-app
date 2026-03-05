'use server';

import { requireRole } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

interface CreateRuleInput {
  name: string;
  baseAmount: number;
  convertedBonus: number;
  effectiveFrom: string;
}

export async function createIncentiveRule(input: CreateRuleInput): Promise<{ error?: string }> {
  const session = await requireRole('superadmin');
  const db = getAdminDb();

  if (input.baseAmount <= 0) return { error: 'Base amount must be positive' };

  try {
    // Deactivate all existing active rules
    const activeSnap = await db
      .collection(COLLECTIONS.INCENTIVE_RULES)
      .where('active', '==', true)
      .get();

    const batch = db.batch();
    activeSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        active: false,
        effectiveTo: Timestamp.fromDate(new Date(input.effectiveFrom)),
      });
    });

    // Create new rule
    const ruleRef = db.collection(COLLECTIONS.INCENTIVE_RULES).doc();
    batch.set(ruleRef, {
      name: input.name,
      baseAmount: input.baseAmount,
      convertedBonus: input.convertedBonus,
      effectiveFrom: Timestamp.fromDate(new Date(input.effectiveFrom)),
      effectiveTo: null,
      createdBy: session.uid,
      active: true,
    });

    await batch.commit();
    return {};
  } catch (err: any) {
    return { error: 'Failed to create rule' };
  }
}
