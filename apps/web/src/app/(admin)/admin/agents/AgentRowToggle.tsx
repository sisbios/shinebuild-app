'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAgentDirectEntry } from './[uid]/actions';

interface Props {
  uid: string;
  initialEnabled: boolean;
  canEdit: boolean;
  size?: 'sm' | 'md';
  status?: string;
}

export function AgentRowToggle({ uid, initialEnabled, canEdit, size = 'md', status }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Cannot enable direct entry for an agent who isn't approved
  const eligible = !status || status === 'approved';
  const interactive = canEdit && eligible;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!interactive || saving) return;
    const next = !enabled;
    setSaving(true);
    setError('');
    setEnabled(next);
    try {
      const res = await setAgentDirectEntry(uid, next);
      if (res.error) {
        setError(res.error);
        setEnabled(!next);
      } else {
        router.refresh();
      }
    } catch {
      setError('Failed');
      setEnabled(!next);
    } finally {
      setSaving(false);
    }
  };

  const dims = size === 'sm'
    ? { track: 'h-5 w-9', thumb: 'h-4 w-4', on: 'translate-x-4', off: 'translate-x-0.5' }
    : { track: 'h-6 w-11', thumb: 'h-5 w-5', on: 'translate-x-5', off: 'translate-x-0.5' };

  let title = canEdit
    ? (eligible
        ? (enabled ? 'Direct entry: ON — click to disable' : 'Direct entry: OFF — click to enable')
        : 'Agent must be approved before enabling direct entry')
    : 'Only super admin can change this';

  return (
    <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Direct lead entry permission"
        title={title}
        disabled={!interactive || saving}
        onClick={handleClick}
        className={`relative inline-flex items-center rounded-full transition-colors ${dims.track} ${
          enabled ? 'bg-green-600' : 'bg-gray-300'
        } ${interactive ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
      >
        <span
          className={`inline-block transform rounded-full bg-white shadow-sm transition-transform ${dims.thumb} ${
            enabled ? dims.on : dims.off
          }`}
        />
      </button>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
