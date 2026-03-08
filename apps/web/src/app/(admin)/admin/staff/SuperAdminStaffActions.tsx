'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { editStaffMember, updateStaffRole, hardDeleteStaff, transferStaffLeads } from './actions';

interface StaffPeer { uid: string; name: string; }

interface Props {
  uid: string;
  name: string;
  phone: string;
  role: string;
  leadCount: number;
  otherStaff: StaffPeer[];
}

const ROLE_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Super Admin' },
];

const ROLE_COLORS: Record<string, string> = {
  staff: 'bg-gray-100 text-gray-700',
  admin: 'bg-blue-50 text-blue-700',
  superadmin: 'bg-purple-50 text-purple-700',
};

export function SuperAdminStaffActions({ uid, name, phone, role, leadCount, otherStaff }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editPhone, setEditPhone] = useState(phone);
  const [editRole, setEditRole] = useState(role);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [transferTo, setTransferTo] = useState('');

  // Transfer leads modal state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [transferResult, setTransferResult] = useState<string | null>(null);

  const handleEdit = async () => {
    setError('');
    if (!editName.trim() || !editPhone.trim()) { setError('Name and phone required'); return; }
    setLoading('edit');
    const tasks: Promise<{ error?: string }>[] = [
      editStaffMember(uid, { name: editName, phone: editPhone }),
    ];
    if (editRole !== role) tasks.push(updateStaffRole(uid, editRole as any));
    const results = await Promise.all(tasks);
    setLoading('');
    const fail = results.find((r) => r.error);
    if (fail) { setError(fail.error!); return; }
    setEditOpen(false);
    router.refresh();
  };

  const handleTransferLeads = async () => {
    setError('');
    if (!transferTarget) { setError('Select a target staff member'); return; }
    setLoading('transfer');
    const res = await transferStaffLeads(uid, transferTarget);
    setLoading('');
    if (res.error) { setError(res.error); return; }
    setTransferResult(`${res.count ?? 0} lead${(res.count ?? 0) !== 1 ? 's' : ''} transferred successfully`);
    router.refresh();
  };

  const handleHardDelete = async () => {
    setError('');
    setLoading('del');
    const res = await hardDeleteStaff(uid, transferTo || undefined);
    setLoading('');
    if (res.error) { setError(res.error); return; }
    setDeleteOpen(false);
    router.refresh();
  };

  return (
    <>
      {/* Inline buttons */}
      <div className="flex items-center justify-end gap-1">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600'}`}>
          {role}
        </span>
        <button
          onClick={() => { setEditOpen(true); setError(''); setEditName(name); setEditPhone(phone); setEditRole(role); }}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          Edit
        </button>
        {leadCount > 0 && otherStaff.length > 0 && (
          <button
            onClick={() => { setTransferOpen(true); setError(''); setTransferTarget(''); setTransferResult(null); }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            title="Transfer all leads to another staff member"
          >
            Transfer
          </button>
        )}
        <button
          onClick={() => { setDeleteOpen(true); setError(''); setTransferTo(''); }}
          className="rounded-lg px-2 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
          title="Permanently delete"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setEditOpen(false)}
        >
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Edit Staff Member</h3>
              <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone (E.164)</label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {editRole !== role && (
                  <p className="mt-1 text-xs text-amber-600">
                    ⚠ Changing role will revoke their current session — they will need to log in again.
                  </p>
                )}
              </div>
            </div>

            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-white/70 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={loading === 'edit'}
                onClick={handleEdit}
                className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading === 'edit' ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer leads modal */}
      {transferOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setTransferOpen(false)}
        >
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Transfer Leads</h3>
                <p className="text-xs text-gray-500 mt-0.5">{leadCount} lead{leadCount !== 1 ? 's' : ''} assigned to {name}</p>
              </div>
            </div>

            {transferResult ? (
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 mb-4 text-sm text-green-800 font-medium">
                {transferResult}
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-700 mb-3">
                  Reassign all leads from <span className="font-semibold">{name}</span> to:
                </p>
                <select
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4"
                >
                  <option value="">— Select staff member —</option>
                  {otherStaff.map((s) => (
                    <option key={s.uid} value={s.uid}>{s.name}</option>
                  ))}
                </select>
                {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setTransferOpen(false); setTransferResult(null); }}
                className="flex-1 rounded-xl border border-gray-200 bg-white/70 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                {transferResult ? 'Close' : 'Cancel'}
              </button>
              {!transferResult && (
                <button
                  disabled={loading === 'transfer'}
                  onClick={handleTransferLeads}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading === 'transfer' ? 'Transferring…' : 'Transfer All Leads'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hard delete modal */}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setDeleteOpen(false)}
        >
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Permanently Delete</h3>
                <p className="text-xs text-gray-500 mt-0.5">This cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-4">
              Delete <span className="font-semibold">{name}</span> permanently from Firebase Auth and Firestore?
            </p>

            {leadCount > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 mb-4">
                <p className="text-xs font-semibold text-amber-800 mb-2">
                  This staff member has {leadCount} assigned lead{leadCount !== 1 ? 's' : ''}.
                </p>
                <label className="block text-xs font-medium text-gray-600 mb-1">Transfer leads to:</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="">— Unassign leads (no transfer) —</option>
                  {otherStaff.map((s) => (
                    <option key={s.uid} value={s.uid}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-white/70 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={loading === 'del'}
                onClick={handleHardDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading === 'del' ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
