'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAgentDirectEntry } from './actions';

interface Props {
  uid: string;
  initialEnabled: boolean;
  canEdit: boolean;
}

export function DirectEntryToggle({ uid, initialEnabled, canEdit }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleToggle = async () => {
    if (!canEdit || saving) return;
    const next = !enabled;
    setSaving(true);
    setError('');
    setEnabled(next); // optimistic
    try {
      const res = await setAgentDirectEntry(uid, next);
      if (res.error) {
        setError(res.error);
        setEnabled(!next); // revert
      } else {
        router.refresh();
      }
    } catch {
      setError('Failed to update permission');
      setEnabled(!next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">Direct lead entry</p>
          <p className="mt-0.5 text-xs text-gray-600">
            When enabled, this agent can submit leads without the customer scanning a QR code —
            entering customer name and phone manually instead.
          </p>
          {!canEdit && (
            <p className="mt-1.5 text-[11px] font-medium text-amber-800">
              Only a super admin can change this permission.
            </p>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle direct lead entry"
          disabled={!canEdit || saving}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
            enabled ? 'bg-green-600' : 'bg-gray-300'
          } ${!canEdit || saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
