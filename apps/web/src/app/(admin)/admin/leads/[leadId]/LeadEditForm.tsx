'use client';

import { useState } from 'react';
import { editLead } from './actions';

interface Props {
  leadId: string;
  initial: {
    customerName: string;
    customerPhone: string;
    city: string;
    requirementNotes: string;
  };
}

export function LeadEditForm({ leadId, initial }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Lead
      </button>
    );
  }

  const handleSave = async () => {
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      setError('Name and phone are required');
      return;
    }
    setSaving(true);
    setError('');
    const res = await editLead(leadId, form);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setOpen(false);
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-amber-200 bg-amber-50/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900">Edit Lead Details</h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Customer Name</label>
          <input
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Phone (E.164)</label>
          <input
            value={form.customerPhone}
            onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
            placeholder="+919876543210"
            className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Requirement Notes</label>
          <textarea
            rows={3}
            value={form.requirementNotes}
            onChange={(e) => setForm((f) => ({ ...f, requirementNotes: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          />
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 rounded-xl border border-gray-200 bg-white/70 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          disabled={saving}
          onClick={handleSave}
          className="flex-1 rounded-xl bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
