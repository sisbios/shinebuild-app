'use server';

import { requireRole } from '@/lib/session';
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

    await db.collection(COLLECTIONS.USERS).doc(targetUid).update({
      status: newStatus,
    });

    await auth.setCustomUserClaims(targetUid, {
      role: 'agent',
      status: newStatus,
    });

    await auth.revokeRefreshTokens(targetUid);

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

export async function setAgentDirectEntry(
  targetUid: string,
  enabled: boolean
): Promise<{ error?: string }> {
  const session = await requireRole('superadmin');
  const db = getAdminDb();

  try {
    const userSnap = await db.collection(COLLECTIONS.USERS).doc(targetUid).get();
    if (!userSnap.exists || userSnap.data()!['role'] !== 'agent') {
      return { error: 'Agent not found' };
    }

    await db.collection(COLLECTIONS.USERS).doc(targetUid).update({
      directEntryEnabled: enabled,
    });

    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session.uid,
      role: session.role,
      action: enabled ? 'agent.directEntry.enabled' : 'agent.directEntry.disabled',
      targetType: 'user',
      targetId: targetUid,
      createdAt: FieldValue.serverTimestamp(),
      metadata: { directEntryEnabled: enabled },
    });

    return {};
  } catch (err: any) {
    console.error('setAgentDirectEntry error:', err);
    return { error: 'Failed to update permission' };
  }
}

export async function deleteAgent(
  targetUid: string
): Promise<{ error?: string; mode?: 'hard' | 'soft' }> {
  const session = await requireRole('admin', 'superadmin');
  const db = getAdminDb();
  const auth = getAdminAuth();

  try {
    const userRef = db.collection(COLLECTIONS.USERS).doc(targetUid);
    const userSnap = await userRef.get();
    if (!userSnap.exists || userSnap.data()!['role'] !== 'agent') {
      return { error: 'Agent not found' };
    }

    const leadCountSnap = await db
      .collection(COLLECTIONS.LEADS)
      .where('agentId', '==', targetUid)
      .limit(1)
      .get();
    const hasLeads = !leadCountSnap.empty;

    const previousStatus = userSnap.data()!['status'];

    if (hasLeads) {
      // Soft delete — preserve history
      await userRef.update({
        status: 'deleted',
        directEntryEnabled: false,
        deletedAt: FieldValue.serverTimestamp(),
        deletedBy: session.uid,
      });
      try {
        await auth.updateUser(targetUid, { disabled: true });
        await auth.setCustomUserClaims(targetUid, { role: 'agent', status: 'deleted' });
        await auth.revokeRefreshTokens(targetUid);
      } catch (err: any) {
        if (err?.code !== 'auth/user-not-found') throw err;
      }

      await db.collection(COLLECTIONS.AUDITS).add({
        actorUid: session.uid,
        role: session.role,
        action: 'agent.deleted.soft',
        targetType: 'user',
        targetId: targetUid,
        createdAt: FieldValue.serverTimestamp(),
        metadata: { previousStatus, reason: 'has_leads' },
      });

      return { mode: 'soft' };
    }

    // Hard delete — no leads to preserve
    await userRef.delete();
    try {
      await auth.deleteUser(targetUid);
    } catch (err: any) {
      if (err?.code !== 'auth/user-not-found') throw err;
    }

    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session.uid,
      role: session.role,
      action: 'agent.deleted.hard',
      targetType: 'user',
      targetId: targetUid,
      createdAt: FieldValue.serverTimestamp(),
      metadata: { previousStatus },
    });

    return { mode: 'hard' };
  } catch (err: any) {
    console.error('deleteAgent error:', err);
    return { error: 'Failed to delete agent' };
  }
}
