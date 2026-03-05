'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@shinebuild/ui';
import { submitQcUpdate, updateLeadStatusStaff } from './actions';
import type { LeadStatus } from '@shinebuild/shared';

interface Props {
  leadId: string;
  currentStatus: LeadStatus;
  currentQc?: { notes?: string };
}

const STAFF_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted'],
  contacted: ['qualified', 'rejected'],
  qualified: [],
  rejected: [],
  duplicate: [],
  converted: [],
};

export function StaffQcForm({ leadId, currentStatus, currentQc }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(currentQc?.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<LeadStatus | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const saveNotes = async () => {
    setLoading(true);
    setError('');
    try {
      await submitQcUpdate(leadId, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Save failed');
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (status: LeadStatus) => {
    setStatusLoading(status);
    setError('');
    try {
      const result = await updateLeadStatusStaff(leadId, status, notes);
      if (result.error) { setError(result.error); return; }
      router.refresh();
    } catch {
      setError('Update failed');
    } finally {
      setStatusLoading(null);
    }
  };

  const transitions = STAFF_TRANSITIONS[currentStatus] ?? [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
      <h2 className="text-sm font-semibold text-gray-700">QC Notes</h2>
      <textarea
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
        rows={4}
        placeholder="Add notes about this lead..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="secondary" loading={loading} onClick={saveNotes}>
          {saved ? 'Saved!' : 'Save Notes'}
        </Button>
        {transitions.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={status === 'rejected' ? 'destructive' : status === 'qualified' ? 'success' : 'default'}
            loading={statusLoading === status}
            onClick={() => changeStatus(status)}
          >
            Mark as {status}
          </Button>
        ))}
      </div>
    </div>
  );
}
