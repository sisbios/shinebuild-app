'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { deleteLead } from './[leadId]/actions';
import type { LeadStatus } from '@shinebuild/shared';

interface Lead {
  id: string;
  customerName: string;
  customerPhone: string;
  status: LeadStatus;
  city: string;
  source: string;
  createdAt: Date;
}

interface Props {
  initialLeads: Lead[];
}

export function AdminLeadsList({ initialLeads }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = async (lead: Lead) => {
    // Optimistic: remove instantly from UI
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    setConfirmId(null);

    const res = await deleteLead(lead.id);
    if (res.error) {
      // Revert on failure
      setLeads((prev) => {
        const exists = prev.find((l) => l.id === lead.id);
        if (exists) return prev;
        return [lead, ...prev].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      });
      alert(`Delete failed: ${res.error}`);
    }
  };

  return (
    <>
      {/* Confirm modal */}
      {confirmId && (() => {
        const lead = leads.find((l) => l.id === confirmId);
        if (!lead) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmId(null)}
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
                  <h3 className="text-base font-bold text-gray-900">Delete Lead</h3>
                  <p className="text-xs text-gray-500 mt-0.5">This cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-5">
                Delete lead for <span className="font-semibold">{lead.customerName}</span>?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmId(null)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white/70 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(lead)}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 active:scale-[0.98] transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {leads.length === 0 ? (
          <p className="py-10 text-center text-gray-400 text-sm">No leads found</p>
        ) : leads.map((lead) => (
          <div key={lead.id} className="glass-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <Link href={`/admin/leads/${lead.id}`} className="font-semibold text-gray-900 truncate hover:text-red-700 transition-colors block">
                  {lead.customerName}
                </Link>
                <p className="text-sm text-gray-500">{lead.customerPhone}</p>
              </div>
              <LeadStatusBadge status={lead.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
              <span className="bg-gray-100 px-2 py-0.5 rounded-full">{lead.city}</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded-full">{lead.source === 'agent_direct' ? 'Direct' : 'QR'}</span>
              <span>{lead.createdAt.toLocaleDateString('en-IN')}</span>
              <button
                onClick={() => setConfirmId(lead.id)}
                className="ml-auto inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/30">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{lead.customerName}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.customerPhone}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.city}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{lead.source === 'agent_direct' ? 'Direct' : 'QR'}</td>
                  <td className="px-4 py-3"><LeadStatusBadge status={lead.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{lead.createdAt.toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/admin/leads/${lead.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors">
                        View
                      </Link>
                      <button
                        onClick={() => setConfirmId(lead.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">No leads found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
