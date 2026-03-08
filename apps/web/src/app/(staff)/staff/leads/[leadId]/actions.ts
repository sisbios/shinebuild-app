'use server';

import { requireRole } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { updateLeadStatus } from '@/app/(admin)/admin/leads/[leadId]/actions';
import { revalidatePath } from 'next/cache';
import type { LeadStatus } from '@shinebuild/shared';

export async function submitQcUpdate(leadId: string, notes: string): Promise<void> {
  await requireRole('staff');
  const db = getAdminDb();
  await db.collection(COLLECTIONS.LEADS).doc(leadId).update({
    'qc.notes': notes,
    'qc.lastContactAt': FieldValue.serverTimestamp(),
  });
}

export async function updateLeadStatusStaff(
  leadId: string,
  status: LeadStatus,
  note?: string
): Promise<{ error?: string }> {
  // updateLeadStatus already handles the write; no extra revalidation needed
  // since the UI updates optimistically via QuickStatusButtons state
  return updateLeadStatus(leadId, status, note);
}
