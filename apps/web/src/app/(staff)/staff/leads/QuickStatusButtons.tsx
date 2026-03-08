'use client';

import { useState } from 'react';
import { updateLeadStatusStaff } from './[leadId]/actions';
import type { LeadStatus } from '@shinebuild/shared';

const TRANSITIONS: Partial<Record<LeadStatus, LeadStatus[]>> = {
  new: ['contacted'],
  contacted: ['qualified', 'rejected'],
};

interface BtnConfig {
  label: string;
  icon: React.ReactNode;
  compact: string;  // compact list style
  card: string;     // card style
}

const BTN: Record<string, BtnConfig> = {
  contacted: {
    label: 'Mark Contacted',
    icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
    compact: 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    card: 'flex-1 bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
  },
  qualified: {
    label: 'Qualify',
    icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>,
    compact: 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
    card: 'flex-1 bg-green-600 text-white hover:bg-green-700 shadow-sm',
  },
  rejected: {
    label: 'Reject',
    icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>,
    compact: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    card: 'flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50',
  },
};

interface Props {
  leadId: string;
  status: LeadStatus;
  variant?: 'compact' | 'card';
}

export function QuickStatusButtons({ leadId, status, variant = 'compact' }: Props) {
  const [loading, setLoading] = useState<LeadStatus | null>(null);
  const [doneStatus, setDoneStatus] = useState<LeadStatus | null>(null);

  const transitions = TRANSITIONS[status] ?? [];
  if (transitions.length === 0) return null;

  // Show immediate local confirmation — no router.refresh() needed
  if (doneStatus) {
    const COLOR: Record<LeadStatus, string> = {
      qualified: 'text-green-700 bg-green-50 border-green-200',
      rejected: 'text-red-600 bg-red-50 border-red-200',
      contacted: 'text-blue-700 bg-blue-50 border-blue-200',
      converted: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      duplicate: 'text-gray-600 bg-gray-50 border-gray-200',
      new: 'text-gray-600 bg-gray-50 border-gray-200',
    };
    return (
      <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${COLOR[doneStatus] ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}>
        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Marked as {doneStatus}
      </div>
    );
  }

  const handleClick = async (next: LeadStatus, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(next);
    const result = await updateLeadStatusStaff(leadId, next);
    setLoading(null);
    if (!result.error) {
      setDoneStatus(next); // instant UI feedback — no page reload needed
    }
  };

  if (variant === 'card') {
    return (
      <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
        {transitions.map((next) => {
          const cfg = BTN[next];
          return (
            <button
              key={next}
              disabled={loading !== null}
              onClick={(e) => handleClick(next, e)}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${cfg.card}`}
            >
              {loading === next ? (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : cfg.icon}
              {cfg.label}
            </button>
          );
        })}
      </div>
    );
  }

  // compact (list) variant
  return (
    <div className="flex gap-1.5 flex-wrap mt-2" onClick={(e) => e.preventDefault()}>
      {transitions.map((next) => {
        const cfg = BTN[next];
        return (
          <button
            key={next}
            disabled={loading !== null}
            onClick={(e) => handleClick(next, e)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${cfg.compact}`}
          >
            {loading === next ? '…' : <>{cfg.icon} {cfg.label}</>}
          </button>
        );
      })}
    </div>
  );
}
