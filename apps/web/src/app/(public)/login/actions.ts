'use server';

import { cookies } from 'next/headers';
import { createSessionCookie } from 'next-firebase-auth-edge';
import { AUTH_EDGE_CONFIG } from '@/lib/auth-edge';
import { getAdminAuth } from '@/lib/firebase-server';

interface SessionResult {
  error?: string;
  role?: string;
}

export async function createSession(idToken: string): Promise<SessionResult> {
  try {
    // Verify token and get claims
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const role = decoded['role'] as string | undefined;

    // Create signed session cookie (12h)
    const sessionCookie = await createSessionCookie(idToken, {
      ...AUTH_EDGE_CONFIG,
      expiresIn: 60 * 60 * 12 * 1000, // ms
    });

    const cookieStore = await cookies();
    cookieStore.set(AUTH_EDGE_CONFIG.cookieName, sessionCookie, {
      ...AUTH_EDGE_CONFIG.cookieSerializeOptions,
    });

    // Update lastLoginAt in Firestore (fire & forget)
    try {
      const { getAdminDb } = await import('@/lib/firebase-server');
      const db = getAdminDb();
      await db.collection('users').doc(decoded.uid).set(
        { lastLoginAt: new Date() },
        { merge: true }
      );
    } catch {
      // Non-fatal
    }

    return { role };
  } catch (err: any) {
    console.error('createSession error:', err);
    return { error: 'Authentication failed' };
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_EDGE_CONFIG.cookieName);
}
