'use server';

import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';

export async function getQualifiedLeadCount(agentId: string): Promise<number> {
  try {
    const db = getAdminDb();
    const snap = await db
      .collectionGroup(COLLECTIONS.AGENT_VIEW)
      .where('agentId', '==', agentId)
      .get();
    return snap.docs.filter((d) => {
      const s = d.data()['status'];
      return s === 'qualified' || s === 'converted';
    }).length;
  } catch {
    return 0;
  }
}
