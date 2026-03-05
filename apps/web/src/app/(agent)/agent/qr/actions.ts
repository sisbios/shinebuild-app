'use server';

import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { generateToken, sha256Hex } from '@shinebuild/shared';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@shinebuild/firebase';

interface GenerateQrResult {
  error?: string;
  qrUrl?: string;
  tokenId?: string;
}

export async function generateQrTokenAction(): Promise<GenerateQrResult> {
  const session = await getServerSession();
  if (!session || session.role !== 'agent' || session.status !== 'approved') {
    return { error: 'Unauthorized' };
  }

  try {
    const db = getAdminDb();
    const rawToken = generateToken(32); // 64-char hex
    const tokenHash = sha256Hex(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const tokenRef = await db.collection(COLLECTIONS.QR_TOKENS).add({
      agentId: session.uid,
      tokenHash,
      expiresAt: Timestamp.fromDate(expiresAt),
      usedAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Audit
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session.uid,
      role: 'agent',
      action: 'qr.generated',
      targetType: 'qrToken',
      targetId: tokenRef.id,
      createdAt: FieldValue.serverTimestamp(),
      metadata: {},
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://shinebuild.sisbios.cloud';
    return {
      qrUrl: `${appUrl}/qr/${rawToken}`,
      tokenId: tokenRef.id,
    };
  } catch (err: any) {
    console.error('generateQrTokenAction error:', err);
    return { error: 'Failed to generate QR token' };
  }
}
