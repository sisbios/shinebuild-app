'use server';

import { requireRole, getServerSession } from '@/lib/session';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import type { AgentStatus } from '@shinebuild/shared';

export async function updateAgentStatus(
  targetUid: string,
  newStatus: AgentStatus
): Promise<{ error?: string }> {
  const session = await requireRole('admin', 'superadmin');
  const db = getAdminDb();
  const auth = getAdminAuth();

  try {
    const userSnap = await db.collection(COLLECTIONS.USERS).doc(targetUid).get();
    if (!userSnap.exists || userSnap.data()!['role'] !== 'agent') {
      return { error: 'Agent not found' };
    }

    // Update user doc
    await db.collection(COLLECTIONS.USERS).doc(targetUid).update({
      status: newStatus,
    });

    // Set custom claims so token reflects new status
    await auth.setCustomUserClaims(targetUid, {
      role: 'agent',
      status: newStatus,
    });

    // Revoke sessions so they get new token on next sign-in
    await auth.revokeRefreshTokens(targetUid);

    // Audit
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session.uid,
      role: session.role,
      action: newStatus === 'approved' ? 'agent.approved' :
              newStatus === 'rejected' ? 'agent.rejected' : 'agent.deactivated',
      targetType: 'user',
      targetId: targetUid,
      createdAt: FieldValue.serverTimestamp(),
      metadata: { previousStatus: userSnap.data()!['status'], newStatus },
    });

    return {};
  } catch (err: any) {
    console.error('updateAgentStatus error:', err);
    return { error: 'Failed to update agent status' };
  }
}
