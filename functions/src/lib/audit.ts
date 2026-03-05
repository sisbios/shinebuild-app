import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './admin.js';
import type { AuditAction } from '@shinebuild/shared';

export async function writeAuditLog(params: {
  actorUid: string;
  role: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await adminDb().collection('audits').add({
    actorUid: params.actorUid,
    role: params.role,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    createdAt: FieldValue.serverTimestamp(),
    metadata: params.metadata ?? {},
  });
}
