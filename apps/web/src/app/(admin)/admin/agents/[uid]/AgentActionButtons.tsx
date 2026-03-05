'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@shinebuild/ui';
import { updateAgentStatus } from './actions';
import type { AgentStatus } from '@shinebuild/shared';

interface Props {
  uid: string;
  currentStatus: AgentStatus;
}

export function AgentActionButtons({ uid, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<AgentStatus | null>(null);
  const [error, setError] = useState('');

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
    </div>
  );
}
