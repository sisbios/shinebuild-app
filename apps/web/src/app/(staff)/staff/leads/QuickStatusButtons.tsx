'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadStatusStaff } from './[leadId]/actions';
import type { LeadStatus } from '@shinebuild/shared';

const TRANSITIONS: Partial<Record<LeadStatus, LeadStatus[]>> = {
  new: ['contacted'],
  contacted: ['qualified', 'rejected'],
};

const BTN_STYLES: Record<string, string> = {
  contacted:
    'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
  qualified:
    'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
  rejected:
    'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
};

const BTN_LABELS: Record<string, string> = {
  contacted: 'Contacted',
  qualified: '✓ Qualify',
  rejected: '✗ Reject',
};

interface Props {
  leadId: string;
  status: LeadStatus;
}

export function QuickStatusButtons({ leadId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<LeadStatus | null>(null);
  const [done, setDone] = useState(false);

  const transitions = TRANSITIONS[status] ?? [];
  if (transitions.length === 0 || done) return null;

  const handleClick = async (next: LeadStatus, e: React.MouseEvent) => {
    e.preventDefault(); // don't follow the parent Link
    e.stopPropagation();
    setLoading(next);
    const result = await updateLeadStatusStaff(leadId, next);
    setLoading(null);
    if (!result.error) {
      setDone(true);
      router.refresh();
    }
  };

  return (
    <div className="flex gap-1.5 flex-wrap mt-2" onClick={(e) => e.preventDefault()}>
      {transitions.map((next) => (
        <button
          key={next}
          disabled={loading !== null}
          onClick={(e) => handleClick(next, e)}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${BTN_STYLES[next]}`}
        >
          {loading === next ? '…' : BTN_LABELS[next]}
        </button>
      ))}
    </div>
  );
}
