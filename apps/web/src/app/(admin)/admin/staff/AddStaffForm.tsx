'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addStaffMember } from './actions';
import { PhoneInput } from '@/components/shared/PhoneInput';

const ROLE_OPTIONS = [
  { value: 'staff',      label: 'Staff',       desc: 'Manages assigned leads & QC',      color: 'bg-gray-100 text-gray-700' },
  { value: 'admin',      label: 'Admin',        desc: 'Full lead & agent management',      color: 'bg-blue-50 text-blue-700' },
  { value: 'superadmin', label: 'Super Admin',  desc: 'Full system access & settings',     color: 'bg-purple-50 text-purple-700' },
];

export function AddStaffForm({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'staff' | 'admin' | 'superadmin'>('staff');
  const [assignedForAssessment, setAssignedForAssessment] = useState(true);
  const [phone, setPhone] = useState('+91');

  const visibleRoles = isSuperAdmin ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value === 'staff');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    fd.set('phone', phone);
    fd.set('role', role);
    fd.set('assignedForAssessment', assignedForAssessment ? 'true' : 'false');
    const res = await addStaffMember(fd);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setOpen(false);
    setRole('staff');
    setAssignedForAssessment(true);
    setPhone('+91');
    (e.target as HTMLFormElement).reset();
    router.refresh();
  };

  const selectedRoleInfo = ROLE_OPTIONS.find((r) => r.value === role)!;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 brand-gradient text-white text-sm font-semibold rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="glass-card rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Team Member</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <PhoneInput label="Phone" value={phone} onChange={setPhone} required />

              {/* Role selector */}
              {isSuperAdmin ? (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Role</label>
                  <div className="space-y-2">
                    {visibleRoles.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value as typeof role)}
                        className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                          role === opt.value
                            ? 'border-red-400 bg-red-50/60 ring-1 ring-red-400'
                            : 'border-gray-200 bg-white/70 hover:border-gray-300'
                        }`}
                      >
                        <div className={`flex-shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          role === opt.value ? 'border-red-600 bg-red-600' : 'border-gray-300'
                        }`}>
                          {role === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                            <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${opt.color}`}>{opt.value}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {role === 'superadmin' && (
                    <p className="mt-2 text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
                      ⚠ Super Admin has full system access including settings, staff management and reports.
                    </p>
                  )}
                </div>
              ) : (
                <input type="hidden" name="role" value="staff" />
              )}

              {/* QA Assessment toggle — only relevant for staff */}
              {role === 'staff' && (
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white/70 px-3.5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Lead Quality Assessment</p>
                    <p className="text-xs text-gray-400 mt-0.5">Assign incoming leads to this staff</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssignedForAssessment((v) => !v)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                      assignedForAssessment ? 'bg-red-600' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={assignedForAssessment}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                      assignedForAssessment ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white/70 py-2.5 text-sm font-semibold text-gray-600">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 brand-gradient rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {loading ? 'Adding…' : `Add ${selectedRoleInfo.label}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
