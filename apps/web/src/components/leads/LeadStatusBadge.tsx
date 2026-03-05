import { Badge } from '@shinebuild/ui';
import type { LeadStatus } from '@shinebuild/shared';

const STATUS_MAP: Record<LeadStatus, { label: string; variant: any }> = {
  new: { label: 'New', variant: 'new' },
  contacted: { label: 'Contacted', variant: 'contacted' },
  qualified: { label: 'Qualified', variant: 'qualified' },
  rejected: { label: 'Rejected', variant: 'rejected' },
  duplicate: { label: 'Duplicate', variant: 'duplicate' },
  converted: { label: 'Converted', variant: 'converted' },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const { label, variant } = STATUS_MAP[status] ?? { label: status, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
}
