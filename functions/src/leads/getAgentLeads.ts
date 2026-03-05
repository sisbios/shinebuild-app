import { onCall } from 'firebase-functions/v2/https';
import { adminDb } from '../lib/admin.js';
import { requireApprovedAgent } from '../lib/auth-claims.js';

export const getAgentLeads = onCall(
  { enforceAppCheck: process.env['FUNCTIONS_EMULATOR'] !== 'true', region: 'asia-south1' },
  async (request) => {
    const { uid } = requireApprovedAgent(request);
    const { pageSize = 20, startAfter } = request.data as { pageSize?: number; startAfter?: string };

    const db = adminDb();
    let q = db
      .collectionGroup('agentView')
      .where('agentId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(Math.min(pageSize, 50)) as any;

    if (startAfter) {
      const cursorDoc = await db.doc(startAfter).get();
      q = q.startAfter(cursorDoc);
    }

    const snap = await q.get();
    const leads = snap.docs.map((doc: any) => ({
      id: doc.ref.parent.parent.id,
      ...doc.data(),
      createdAt: doc.data()['createdAt']?.toDate?.()?.toISOString(),
    }));

    return { leads, hasMore: leads.length === Math.min(pageSize, 50) };
  }
);
