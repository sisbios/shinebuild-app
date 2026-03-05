'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@shinebuild/ui';
import { updateLeadStatus } from './actions';
import type { LeadStatus } from '@shinebuild/shared';

const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'rejected', 'duplicate'],
  contacted: ['qualified', 'rejected'],
  qualified: ['converted', 'rejected'],
  rejected: ['contacted'],
  duplicate: [],
  converted: [],
};

interface Props {
  leadId: string;
  currentStatus: LeadStatus;
}

export function LeadStatusUpdater({ leadId, currentStatus }: Props) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState<LeadStatus | null>(null);
  const [error, setError] = useState('');

  const transitions = TRANSITIONS[currentStatus] ?? [];
  if (transitions.length === 0) return null;

  const handle = async (status: LeadStatus) => {
    setLoading(status);
    setError('');
    try {
      const result = await updateLeadStatus(leadId, status, note);
      if (result.error) { setError(result.error); return; }
      router.refresh();
      setNote('');
    } catch {
      setError('Update failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="text-xs font-semibold uppercase text-gray-500">Update Status</h2>
      <textarea
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
        placeholder="Optional note..."
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {transitions.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={status === 'rejected' ? 'destructive' : status === 'qualified' || status === 'converted' ? 'success' : 'secondary'}
            loading={loading === status}
            onClick={() => handle(status)}
          >
            Mark as {status}
          </Button>
        ))}
      </div>
    </section>
  );
}
