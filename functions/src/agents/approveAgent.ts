import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { adminDb, adminAuth } from '../lib/admin.js';
import { requireRole } from '../lib/auth-claims.js';
import { writeAuditLog } from '../lib/audit.js';
import type { AgentStatus } from '@shinebuild/shared';

export const approveAgent = onCall(
  { enforceAppCheck: process.env['FUNCTIONS_EMULATOR'] !== 'true', region: 'asia-south1' },
  async (request) => {
    const { uid, claims } = requireRole(request, ['admin', 'superadmin']);
    const { targetUid, action } = request.data as { targetUid: string; action: AgentStatus };

    if (!['approved', 'rejected', 'deactivated'].includes(action)) {
      throw new HttpsError('invalid-argument', 'Invalid action');
    }

    const db = adminDb();
    const auth = adminAuth();

    const userSnap = await db.collection('users').doc(targetUid).get();
    if (!userSnap.exists || userSnap.data()!['role'] !== 'agent') {
      throw new HttpsError('not-found', 'Agent not found');
    }

    await db.collection('users').doc(targetUid).update({ status: action });
    await auth.setCustomUserClaims(targetUid, { role: 'agent', status: action });
    await auth.revokeRefreshTokens(targetUid);

    await writeAuditLog({
      actorUid: uid,
      role: claims['role'] as string,
      action: action === 'approved' ? 'agent.approved' : action === 'rejected' ? 'agent.rejected' : 'agent.deactivated',
      targetType: 'user',
      targetId: targetUid,
      metadata: { action },
    });

    return { success: true };
  }
);
