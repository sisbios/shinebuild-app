'use server';

import { cookies, headers } from 'next/headers';
import { refreshCookiesWithIdToken } from 'next-firebase-auth-edge/next/cookies';
import { AUTH_EDGE_CONFIG } from '@/lib/auth-edge';
import { getAdminAuth } from '@/lib/firebase-server';

interface SessionResult {
  error?: string;
  role?: string;
}

export async function createSession(idToken: string): Promise<SessionResult> {
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const role = decoded['role'] as string | undefined;

    // Set auth cookies using next-firebase-auth-edge
    const cookieStore = await cookies();
    const headerStore = await headers();
    // Build a Headers object from the incoming headers
    const reqHeaders = new Headers();
    headerStore.forEach((value, key) => reqHeaders.set(key, value));

    await refreshCookiesWithIdToken(idToken, reqHeaders, cookieStore, {
      ...AUTH_EDGE_CONFIG,
      cookieName: AUTH_EDGE_CONFIG.cookieName,
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
  // Also delete any multi-cookie variants (e.g. .0, .1, .2)
  for (let i = 0; i < 5; i++) {
    cookieStore.delete(`${AUTH_EDGE_CONFIG.cookieName}.${i}`);
  }
}
