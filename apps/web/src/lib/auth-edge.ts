import type { NextRequest, NextResponse } from 'next/server';
import {
  getTokens,
  type Tokens,
} from 'next-firebase-auth-edge';
import type { UserRole, AgentStatus } from '@shinebuild/shared';

export const AUTH_EDGE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  cookieName: 'sb-session',
  cookieSignatureKeys: [
    process.env.COOKIE_SECRET_CURRENT!,
    process.env.COOKIE_SECRET_PREVIOUS!,
  ],
  cookieSerializeOptions: {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 12, // 12 hours
  },
  serviceAccount: {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  },
};

export interface SessionUser {
  uid: string;
  phone: string | null;
  role?: UserRole;
  status?: AgentStatus;
}

export async function getEdgeTokens(request: NextRequest): Promise<Tokens | null> {
  try {
    return await getTokens(request.cookies, AUTH_EDGE_CONFIG);
  } catch {
    return null;
  }
}
