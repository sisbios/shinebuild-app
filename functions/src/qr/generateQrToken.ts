import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../lib/admin.js';
import { requireApprovedAgent } from '../lib/auth-claims.js';
import { writeAuditLog } from '../lib/audit.js';
import { generateToken, sha256Hex } from '@shinebuild/shared';

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://shinebuild.sisbios.cloud';

export const generateQrToken = onCall(
  {
    enforceAppCheck: process.env['FUNCTIONS_EMULATOR'] !== 'true',
    region: 'asia-south1',
  },
  async (request) => {
    const { uid } = requireApprovedAgent(request);
    const db = adminDb();

    const rawToken = generateToken(32); // 64-char hex, never stored
    const tokenHash = sha256Hex(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const tokenRef = await db.collection('qrTokens').add({
      agentId: uid,
      tokenHash,
      expiresAt: Timestamp.fromDate(expiresAt),
      usedAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    await writeAuditLog({
      actorUid: uid,
      role: 'agent',
      action: 'qr.generated',
      targetType: 'qrToken',
      targetId: tokenRef.id,
    });

    return {
      qrUrl: `${APP_URL}/qr/${rawToken}`,
      tokenId: tokenRef.id,
      expiresAt: expiresAt.toISOString(),
    };
  }
);
