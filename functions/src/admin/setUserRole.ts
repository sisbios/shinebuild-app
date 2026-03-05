import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { adminDb, adminAuth } from '../lib/admin.js';
import { requireRole } from '../lib/auth-claims.js';
import { writeAuditLog } from '../lib/audit.js';
import { SetUserRoleSchema } from '@shinebuild/shared';

export const setUserRole = onCall(
  { enforceAppCheck: process.env['FUNCTIONS_EMULATOR'] !== 'true', region: 'asia-south1' },
  async (request) => {
    const { uid } = requireRole(request, ['superadmin']);
    const parsed = SetUserRoleSchema.safeParse(request.data);
    if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid input');

    const { targetUid, role } = parsed.data;
    const db = adminDb();
    const auth = adminAuth();

    await db.collection('users').doc(targetUid).set({ role }, { merge: true });
    await auth.setCustomUserClaims(targetUid, { role });
    await auth.revokeRefreshTokens(targetUid);

    await writeAuditLog({
      actorUid: uid,
      role: 'superadmin',
      action: 'role.set',
      targetType: 'user',
      targetId: targetUid,
      metadata: { role },
    });

    return { success: true };
  }
);
