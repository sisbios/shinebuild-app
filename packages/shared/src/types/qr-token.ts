export interface QrToken {
  id: string;
  agentId: string;
  tokenHash: string; // sha256(rawToken), NEVER raw token stored
  expiresAt: Date;
  usedAt: Date | null; // null = available; set atomically = consumed
  createdAt: Date;
}
