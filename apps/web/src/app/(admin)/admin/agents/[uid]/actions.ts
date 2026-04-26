'use server';

import { requireRole } from '@/lib/session';
import { getAdminDb, getAdminAuth, getAdminStorage } from '@/lib/firebase-server';
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

interface PermanentDeleteResult {
  error?: string;
  removed?: {
    leads: number;
    agentViews: number;
    qrTokens: number;
    ledger: number;
    ledgerTx: number;
    audits: number;
    photos: number;
    user: number;
    authUser: number;
  };
}

// Permanent agent removal — wipes the user, all their leads, agentView subdocs,
// QR tokens, incentive ledger entries, audit log entries (as actor or target),
// associated storage objects (lead photos), and the Firebase Auth account.
// Super-admin only. Use updateAgentStatus(...,'deactivated') for a temporary disable.
export async function deleteAgent(targetUid: string): Promise<PermanentDeleteResult> {
  const session = await requireRole('superadmin');
  const db = getAdminDb();
  const auth = getAdminAuth();

  try {
    const userRef = db.collection(COLLECTIONS.USERS).doc(targetUid);
    const userSnap = await userRef.get();
    if (!userSnap.exists || userSnap.data()!['role'] !== 'agent') {
      return { error: 'Agent not found' };
    }

    const removed = {
      leads: 0,
      agentViews: 0,
      qrTokens: 0,
      ledger: 0,
      ledgerTx: 0,
      audits: 0,
      photos: 0,
      user: 0,
      authUser: 0,
    };

    let bucket: ReturnType<ReturnType<typeof getAdminStorage>['bucket']> | null = null;
    try {
      const bucketName = process.env['FIREBASE_STORAGE_BUCKET'] || process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'];
      bucket = getAdminStorage().bucket(bucketName);
    } catch {
      bucket = null;
    }

    // 1) Leads + agentView subcollection + photo storage
    const leadsSnap = await db.collection(COLLECTIONS.LEADS).where('agentId', '==', targetUid).get();
    for (const lead of leadsSnap.docs) {
      const photos = (lead.data()['photos'] as string[] | undefined) ?? [];
      if (bucket) {
        for (const path of photos) {
          if (typeof path !== 'string' || !path) continue;
          try { await bucket.file(path).delete({ ignoreNotFound: true }); removed.photos++; } catch { /* best effort */ }
        }
        // sweep any stray files under leads/{leadId}/
        try {
          const [files] = await bucket.getFiles({ prefix: `leads/${lead.id}/` });
          for (const f of files) {
            try { await f.delete({ ignoreNotFound: true }); removed.photos++; } catch { /* ignore */ }
          }
        } catch { /* ignore */ }
      }
      const av = await lead.ref.collection(COLLECTIONS.AGENT_VIEW).get();
      for (const a of av.docs) { await a.ref.delete(); removed.agentViews++; }
      await lead.ref.delete();
      removed.leads++;
    }

    // 2) QR tokens this agent issued
    const tokSnap = await db.collection(COLLECTIONS.QR_TOKENS).where('agentId', '==', targetUid).get();
    for (const t of tokSnap.docs) { await t.ref.delete(); removed.qrTokens++; }

    // 3) Incentive ledger
    const ledgerRef = db.collection(COLLECTIONS.INCENTIVE_LEDGER).doc(targetUid);
    const ledgerDoc = await ledgerRef.get();
    if (ledgerDoc.exists) {
      const tx = await ledgerRef.collection('transactions').get();
      for (const t of tx.docs) { await t.ref.delete(); removed.ledgerTx++; }
      await ledgerRef.delete();
      removed.ledger++;
    }

    // 4) Audits — full erasure as actor and as target
    const auditAsActor = await db.collection(COLLECTIONS.AUDITS).where('actorUid', '==', targetUid).get();
    for (const a of auditAsActor.docs) { await a.ref.delete(); removed.audits++; }
    const auditAsTarget = await db.collection(COLLECTIONS.AUDITS).where('targetId', '==', targetUid).get();
    for (const a of auditAsTarget.docs) { await a.ref.delete(); removed.audits++; }

    // 5) Per-agent storage prefix (anything not already covered by lead paths)
    if (bucket) {
      try {
        const [files] = await bucket.getFiles({ prefix: `agents/${targetUid}/` });
        for (const f of files) {
          try { await f.delete({ ignoreNotFound: true }); removed.photos++; } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }

    // 6) Firestore user doc
    await userRef.delete();
    removed.user++;

    // 7) Firebase Auth user
    try {
      await auth.deleteUser(targetUid);
      removed.authUser++;
    } catch (err: any) {
      if (err?.code !== 'auth/user-not-found') throw err;
    }

    // Note: we do NOT write a final audit row pointing at targetUid — the user
    // explicitly wants no trace so the phone can be reused (e.g., promoted
    // to a different role). The actor's audit log preserves the deletion event:
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session.uid,
      role: session.role,
      action: 'agent.deleted.permanent',
      targetType: 'user',
      targetId: null,
      createdAt: FieldValue.serverTimestamp(),
      metadata: { removed, anonymizedTargetUidLast4: targetUid.slice(-4) },
    });

    return { removed };
  } catch (err: any) {
    console.error('deleteAgent error:', err);
    return { error: 'Failed to delete agent' };
  }
}
