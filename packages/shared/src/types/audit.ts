export type AuditAction =
  | 'lead.created'
  | 'lead.status_updated'
  | 'lead.staff_assigned'
  | 'agent.registered'
  | 'agent.approved'
  | 'agent.rejected'
  | 'agent.deactivated'
  | 'role.set'
  | 'incentive.earned'
  | 'incentive.redeemed'
  | 'qr.generated'
  | 'qr.validated'
  | 'report.exported';

export interface AuditLog {
  id: string;
  actorUid: string;
  role: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  createdAt: Date;
  metadata: Record<string, unknown>;
}
