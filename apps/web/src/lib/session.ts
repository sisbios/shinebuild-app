import 'server-only';
import { cookies } from 'next/headers';
import { getTokens } from 'next-firebase-auth-edge';
import { AUTH_EDGE_CONFIG, type SessionUser } from './auth-edge.js';
import type { UserRole } from '@shinebuild/shared';
import { redirect } from 'next/navigation';

export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const tokens = await getTokens(cookieStore, AUTH_EDGE_CONFIG);
    if (!tokens) return null;

    const { decodedToken } = tokens;
    return {
      uid: decodedToken.uid,
      phone: decodedToken.phone_number ?? null,
      role: (decodedToken['role'] as UserRole) ?? undefined,
      status: (decodedToken['status'] as any) ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getServerSession();
  if (!session) redirect('/login');
  return session;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!session.role || !roles.includes(session.role)) {
    redirect('/login');
  }
  return session;
}

export async function requireApprovedAgent(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== 'agent') redirect('/login');
  if (session.status !== 'approved') redirect('/agent/pending');
  return session;
}
