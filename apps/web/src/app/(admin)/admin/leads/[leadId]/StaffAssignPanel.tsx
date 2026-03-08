'use client';

import { useState } from 'react';
import { assignStaffToLead, removeStaffFromLead } from './actions';

interface StaffMember {
  uid: string;
  name: string;
  phone: string;
}

interface Props {
  leadId: string;
  assignedStaff: StaffMember[];
  allStaff: StaffMember[];
}

export function StaffAssignPanel({ leadId, assignedStaff, allStaff }: Props) {
  const [assigned, setAssigned] = useState<StaffMember[]>(assignedStaff);
  const [selectedUid, setSelectedUid] = useState('');
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState('');
  const [error, setError] = useState('');

  const assignedIds = new Set(assigned.map((s) => s.uid));
  const available = allStaff.filter((s) => !assignedIds.has(s.uid));

  const handleAssign = async () => {
    if (!selectedUid) return;
    const staff = allStaff.find((s) => s.uid === selectedUid);
    if (!staff) return;
    setLoadingAssign(true);
    setError('');
    const res = await assignStaffToLead(leadId, selectedUid);
    setLoadingAssign(false);
    if (res.error) { setError(res.error); return; }
    setAssigned((prev) => [...prev, staff]);
    setSelectedUid('');
  };

  const handleRemove = async (staffId: string) => {
    setLoadingRemove(staffId);
    setError('');
    const res = await removeStaffFromLead(leadId, staffId);
    setLoadingRemove('');
    if (res.error) { setError(res.error); return; }
    setAssigned((prev) => prev.filter((s) => s.uid !== staffId));
  };

  return (
    <section className="glass-card rounded-2xl p-4 space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Staff Assignment</h2>

      {/* Currently assigned */}
      {assigned.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No staff assigned yet</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {assigned.map((s) => (
            <div
              key={s.uid}
              className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 pl-2.5 pr-1.5 py-1"
            >
              <div className="h-5 w-5 rounded-full brand-gradient flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[9px] font-bold">{s.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-xs font-semibold text-blue-700">{s.name}</span>
              <button
                disabled={loadingRemove === s.uid}
                onClick={() => handleRemove(s.uid)}
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-700 disabled:opacity-40 transition-colors"
                title={`Remove ${s.name}`}
              >
                {loadingRemove === s.uid ? (
                  <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add staff */}
      {available.length > 0 && (
        <div className="flex gap-2">
          <select
            value={selectedUid}
            onChange={(e) => setSelectedUid(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <option value="">Select staff to assign…</option>
            {available.map((s) => (
              <option key={s.uid} value={s.uid}>{s.name} — {s.phone}</option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedUid || loadingAssign}
            className="flex-shrink-0 rounded-xl brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loadingAssign ? '…' : 'Assign'}
          </button>
        </div>
      )}

      {available.length === 0 && assigned.length > 0 && (
        <p className="text-xs text-gray-400 italic">All active staff are already assigned</p>
      )}

      {allStaff.length === 0 && (
        <p className="text-xs text-gray-400 italic">No active staff members found. Add staff first.</p>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
    </section>
  );
}
