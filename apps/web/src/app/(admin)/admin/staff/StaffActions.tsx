'use client';

import { useState } from 'react';
import { updateStaffStatus, deleteStaffMember, toggleAssessmentAssignment, promoteToSuperAdmin } from './actions';

interface Props { uid: string; name: string; currentStatus: string; assignedForAssessment: boolean; canPromote?: boolean; }

export function StaffActions({ uid, name, currentStatus, assignedForAssessment: initAssigned, canPromote }: Props) {
  const [loading, setLoading] = useState('');
  const [assigned, setAssigned] = useState(initAssigned);

  const run = async (action: () => Promise<{ error?: string }>, key: string) => {
    setLoading(key);
    const res = await action();
    setLoading('');
    if (res.error) alert(res.error);
  };

  const handleToggleAssessment = async () => {
    setLoading('qa');
    const next = !assigned;
    const res = await toggleAssessmentAssignment(uid, next);
    setLoading('');
    if (res.error) { alert(res.error); return; }
    setAssigned(next);
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Promote to superadmin — superadmin only */}
      {canPromote && (
        <button
          disabled={!!loading}
          onClick={() => {
            if (confirm(`Promote "${name}" to Super Admin? They will gain full system access.`))
              run(() => promoteToSuperAdmin(uid), 'promote');
          }}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 transition-colors"
          title="Promote to Super Admin"
        >
          {loading === 'promote' ? '…' : '★ SA'}
        </button>
      )}
      {/* QA Assessment toggle */}
      <button
        disabled={!!loading}
        onClick={handleToggleAssessment}
        title={assigned ? 'Remove from QA assignment' : 'Assign for lead quality assessment'}
        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
          assigned
            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {loading === 'qa' ? '…' : assigned ? 'QA ✓' : 'QA'}
      </button>
      {currentStatus === 'active' ? (
        <button
          disabled={!!loading}
          onClick={() => run(() => updateStaffStatus(uid, 'deactivated'), 'deact')}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 transition-colors"
        >
          {loading === 'deact' ? '…' : 'Deactivate'}
        </button>
      ) : (
        <button
          disabled={!!loading}
          onClick={() => run(() => updateStaffStatus(uid, 'active'), 'act')}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 disabled:opacity-50 transition-colors"
        >
          {loading === 'act' ? '…' : 'Activate'}
        </button>
      )}
      <button
        disabled={!!loading}
        onClick={() => {
          if (confirm(`Delete staff member "${name}"? This cannot be undone.`))
            run(() => deleteStaffMember(uid), 'del');
        }}
        className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
        title="Delete"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
