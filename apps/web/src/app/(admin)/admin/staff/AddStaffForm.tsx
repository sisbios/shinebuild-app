'use client';

import { useState } from 'react';
import { addStaffMember } from './actions';

export function AddStaffForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const res = await addStaffMember(fd);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setOpen(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 brand-gradient text-white text-sm font-semibold rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Staff Member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="glass-card rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Staff Member</h2>
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
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone (E.164)</label>
                <input
                  name="phone"
                  required
                  placeholder="+919876543210"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white/70 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +91</p>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white/70 py-2.5 text-sm font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 brand-gradient rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading ? 'Adding…' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
