'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@shinebuild/ui';
import { redeemIncentive } from './actions';

interface Props {
  agentId: string;
  balance: number;
}

export function RedeemButton({ agentId, balance }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    if (!confirm(`Mark ₹${balance} as redeemed for this agent?`)) return;
    setLoading(true);
    setError('');
    try {
      const result = await redeemIncentive(agentId, balance);
      if (result.error) { setError(result.error); return; }
      router.refresh();
    } catch {
      setError('Failed to redeem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button size="sm" variant="success" loading={loading} onClick={handle}>
        Mark Paid
      </Button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
