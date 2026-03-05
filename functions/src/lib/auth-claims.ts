import type { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import type { UserRole, AgentStatus } from '@shinebuild/shared';

export interface CustomClaims {
  role: UserRole;
  status?: AgentStatus;
}

export function requireAuth(request: CallableRequest): { uid: string; claims: Partial<CustomClaims> } {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in');
  }
  return {
    uid: request.auth.uid,
    claims: (request.auth.token as any) ?? {},
  };
}

export function requireRole(request: CallableRequest, roles: UserRole[]): { uid: string; claims: Partial<CustomClaims> } {
  const { uid, claims } = requireAuth(request);
  const role = claims['role'] as UserRole | undefined;
  if (!role || !roles.includes(role)) {
    throw new HttpsError('permission-denied', 'Insufficient role');
  }
  return { uid, claims };
}

export function requireApprovedAgent(request: CallableRequest): { uid: string } {
  const { uid, claims } = requireRole(request, ['agent']);
  if (claims['status'] !== 'approved') {
    throw new HttpsError('permission-denied', 'Agent not approved');
  }
  return { uid };
}
