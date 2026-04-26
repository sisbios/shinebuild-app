'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@shinebuild/ui';
import { updateAgentStatus, deleteAgent } from './actions';
import type { AgentStatus } from '@shinebuild/shared';

interface Props {
  uid: string;
  currentStatus: AgentStatus;
  leadCount: number;
}

export function AgentActionButtons({ uid, currentStatus, leadCount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<AgentStatus | 'delete' | null>(null);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      if (result.mode === 'hard') {
        router.replace('/admin/agents');
      } else {
        router.refresh();
      }
    } catch {
      setError('Delete failed. Please try again.');
    } finally {
      setLoading(null);
      setConfirmDelete(false);
    }
  };

  const isDeleted = currentStatus === 'deleted';
  const willHardDelete = leadCount === 0;

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
          Deactivate Agent
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

      {!isDeleted && (
        <div className="pt-3 border-t border-gray-200">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
            >
              Delete Agent
            </button>
          ) : (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 space-y-2">
              <p className="text-sm font-semibold text-red-800">Confirm delete</p>
              <p className="text-xs text-red-700">
                {willHardDelete
                  ? 'This agent has no leads — the account will be permanently removed (Firestore + Auth).'
                  : `This agent has ${leadCount} lead(s). Account will be marked deleted and login disabled, but lead history will be preserved for audit and incentives.`}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={loading === 'delete'}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading === 'delete'}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {loading === 'delete' ? 'Deleting…' : willHardDelete ? 'Delete Permanently' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isDeleted && (
        <div className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          This agent has been deleted. Login is disabled and historical leads are preserved.
        </div>
      )}
    </div>
  );
}
