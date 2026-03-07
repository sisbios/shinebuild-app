import Link from 'next/link';
import type { LeadStatus } from '@shinebuild/shared';
import { QuickStatusButtons } from './QuickStatusButtons';

const STATUS_STYLES: Record<LeadStatus, { bg: string; text: string; label: string; dot: string }> = {
  new:       { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700',   label: 'New',       dot: 'bg-blue-500' },
  contacted: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'Contacted', dot: 'bg-purple-500' },
  qualified: { bg: 'bg-green-50 border-green-200',  text: 'text-green-700',  label: 'Qualified', dot: 'bg-green-500' },
  rejected:  { bg: 'bg-red-50 border-red-200',     text: 'text-red-700',    label: 'Rejected',  dot: 'bg-red-500' },
  duplicate: { bg: 'bg-gray-50 border-gray-200',   text: 'text-gray-600',   label: 'Duplicate', dot: 'bg-gray-400' },
  converted: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Converted', dot: 'bg-emerald-500' },
};

const AVATAR_COLORS = [
  'from-red-500 to-red-700',
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
  'from-green-500 to-green-700',
  'from-orange-500 to-orange-700',
  'from-teal-500 to-teal-700',
];

function avatarColor(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

interface LeadRow {
  id: string;
  customerName: string;
  customerPhone: string;
  city: string;
  status: LeadStatus;
  requirementNotes: string;
  createdAt: Date;
}

export function LeadCard({ lead }: { lead: LeadRow }) {
  const st = STATUS_STYLES[lead.status] ?? STATUS_STYLES.new;
  const initials = lead.customerName
    .split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase() || '?';
  const grad = avatarColor(lead.customerName);
  const isPending = lead.status === 'new' || lead.status === 'contacted';

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col hover-lift transition-all">

      {/* Card top: accent stripe based on status */}
      <div className={`h-1 w-full ${st.dot}`} />

      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Row 1: avatar + info + phone button */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`flex-shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}>
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>

          {/* Name + city + date */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/staff/leads/${lead.id}`}
              className="font-semibold text-gray-900 hover:text-red-800 truncate block text-sm leading-tight"
            >
              {lead.customerName}
            </Link>
            {lead.city && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 truncate">
                <svg className="h-3 w-3 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {lead.city}
              </p>
            )}
            <p className="text-[10px] text-gray-400 mt-0.5">
              {lead.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Phone call button */}
          {lead.customerPhone ? (
            <a
              href={`tel:${lead.customerPhone}`}
              className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-green-500 text-white shadow-sm hover:bg-green-600 active:scale-95 transition-all"
              title={`Call ${lead.customerPhone}`}
            >
              <svg className="h-4.5 w-4.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>
          ) : (
            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-gray-100 text-gray-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          )}
        </div>

        {/* Requirement snippet */}
        {lead.requirementNotes && (
          <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50/80 rounded-lg px-2.5 py-2 border border-gray-100">
            {lead.requirementNotes}
          </p>
        )}

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${st.bg} ${st.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
          {lead.customerPhone && (
            <span className="text-[10px] text-gray-400 truncate flex-1">{lead.customerPhone}</span>
          )}
        </div>

        {/* Quick action buttons (only when actionable) */}
        {isPending && (
          <div className="border-t border-gray-100 pt-3">
            <QuickStatusButtons leadId={lead.id} status={lead.status} variant="card" />
          </div>
        )}
      </div>
    </div>
  );
}
