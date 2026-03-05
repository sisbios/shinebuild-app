'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@shinebuild/ui';
import { createIncentiveRule } from './actions';

export function IncentiveRuleForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [convertedBonus, setConvertedBonus] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    if (!name || !baseAmount) { setError('Name and base amount are required'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await createIncentiveRule({
        name,
        baseAmount: Number(baseAmount),
        convertedBonus: Number(convertedBonus || 0),
        effectiveFrom,
      });
      if (result.error) { setError(result.error); return; }
      router.refresh();
      setName(''); setBaseAmount(''); setConvertedBonus('');
    } catch {
      setError('Failed to create rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Input label="Rule Name" placeholder="e.g. Standard Q1 2026" value={name} onChange={(e) => setName(e.target.value)} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Base Amount (₹)" type="number" placeholder="500" value={baseAmount} onChange={(e) => setBaseAmount(e.target.value)} required />
        <Input label="Converted Bonus (₹)" type="number" placeholder="200" value={convertedBonus} onChange={(e) => setConvertedBonus(e.target.value)} />
      </div>
      <Input label="Effective From" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button size="full" loading={loading} onClick={handle}>Create Rule</Button>
    </div>
  );
}
