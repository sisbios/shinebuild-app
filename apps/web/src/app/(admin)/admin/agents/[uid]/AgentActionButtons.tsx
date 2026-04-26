'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@shinebuild/ui';
import { updateAgentStatus, deleteAgent } from './actions';
import type { AgentStatus } from '@shinebuild/shared';

interface Props {
  uid: string;
  agentName: string;
  currentStatus: AgentStatus;
  leadCount: number;
  isSuperAdmin: boolean;
}

export function AgentActionButtons({ uid, agentName, currentStatus, leadCount, isSuperAdmin }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<AgentStatus | 'delete' | null>(null);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState('');

  const handle = async (action: AgentStatus) => {
    setLoading(action);
    setError('');
    try {
      const result = await updateAgentStatus(uid, action);
      if (result.error) { setError(result.error); return; }
      router.refresh();
    } catch {
      setError('Action failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    setLoading('delete');
    setError('');
    try {
      const result = await deleteAgent(uid);
      if (result.error) { setError(result.error); return; }
      router.replace('/admin/agents');
    } catch {
      setError('Delete failed. Please try again.');
    } finally {
      setLoading(null);
      setConfirmDelete(false);
      setTyped('');
    }
  };

  const expected = (agentName ?? '').trim();
  const canSubmitDelete = isSuperAdmin && typed.trim() === expected && expected.length > 0;

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {currentStatus === 'pending' && (
        <div className="flex gap-2">
          <Button
            variant="success"
            size="full"
            loading={loading === 'approved'}
            onClick={() => handle('approved')}
          >
            Approve Agent
          </Button>
          <Button
            variant="destructive"
            size="full"
            loading={loading === 'rejected'}
            onClick={() => handle('rejected')}
          >
            Reject
          </Button>
        </div>
      )}

      {currentStatus === 'approved' && (
        <Button
          variant="destructive"
          size="full"
          loading={loading === 'deactivated'}
          onClick={() => handle('deactivated')}
        >
          Deactivate Agent (temporary)
        </Button>
      )}

      {(currentStatus === 'rejected' || currentStatus === 'deactivated') && (
        <Button
          variant="success"
          size="full"
          loading={loading === 'approved'}
          onClick={() => handle('approved')}
        >
          Re-Activate Agent
        </Button>
      )}

      {/* Permanent delete — super admin only */}
      <div className="pt-3 border-t border-gray-200">
        {!isSuperAdmin ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Only the super admin can permanently delete an agent. Use deactivate above for a temporary disable.
          </div>
        ) : !confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
          >
            Permanently Delete (wipe all data)
          </button>
        ) : (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 space-y-2.5">
            <p className="text-sm font-semibold text-red-800">Permanent delete — this cannot be undone</p>
            <ul className="text-xs text-red-700 space-y-0.5 list-disc list-inside">
              <li>Firestore user document</li>
              <li>Firebase Auth account (the phone number can be re-used immediately after)</li>
              <li>{leadCount} lead(s) + their agent views</li>
              <li>QR tokens issued by this agent</li>
              <li>Incentive ledger entries (if any)</li>
              <li>Audit log entries referencing this agent</li>
              <li>Stored photos under <code>leads/&#123;leadId&#125;/</code></li>
            </ul>
            <p className="text-xs text-red-700">
              For a temporary disable, click <span className="font-semibold">Deactivate</span> instead.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-red-800">
                Type the agent's name to confirm: <span className="font-mono">{expected || '(no name)'}</span>
              </label>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                disabled={loading === 'delete'}
                className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-700 focus:outline-none focus:ring-1 focus:ring-red-700"
                placeholder="Type name exactly"
                autoComplete="off"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); setTyped(''); }}
                disabled={loading === 'delete'}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canSubmitDelete || loading === 'delete'}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading === 'delete' ? 'Deleting…' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
