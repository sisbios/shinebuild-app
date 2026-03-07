import Link from 'next/link';
import type { LeadStatus } from '@shinebuild/shared';
import { QuickStatusButtons } from './QuickStatusButtons';

const STATUS_STYLES: Record<LeadStatus, { stripe: string; bg: string; text: string; label: string; dot: string }> = {
  new:       { stripe: 'bg-blue-500',    bg: 'bg-blue-50 border-blue-200',      text: 'text-blue-700',    label: 'New',       dot: 'bg-blue-500' },
  contacted: { stripe: 'bg-purple-500',  bg: 'bg-purple-50 border-purple-200',  text: 'text-purple-700',  label: 'Contacted', dot: 'bg-purple-500' },
  qualified: { stripe: 'bg-green-500',   bg: 'bg-green-50 border-green-200',    text: 'text-green-700',   label: 'Qualified', dot: 'bg-green-500' },
  rejected:  { stripe: 'bg-red-400',     bg: 'bg-red-50 border-red-200',        text: 'text-red-700',     label: 'Rejected',  dot: 'bg-red-400' },
  duplicate: { stripe: 'bg-gray-400',    bg: 'bg-gray-50 border-gray-200',      text: 'text-gray-600',    label: 'Duplicate', dot: 'bg-gray-400' },
  converted: { stripe: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200',text: 'text-emerald-700', label: 'Converted', dot: 'bg-emerald-500' },
};

const AVATAR_GRADIENTS = [
  'from-red-400 to-red-600',
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-green-400 to-green-600',
  'from-orange-400 to-orange-600',
  'from-teal-400 to-teal-600',
  'from-pink-400 to-pink-600',
  'from-indigo-400 to-indigo-600',
];

function avatarGradient(name: string) {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
}

export interface LeadRow {
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
  const grad = avatarGradient(lead.customerName);
  const isPending = lead.status === 'new' || lead.status === 'contacted';

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Colored left stripe */}
      <div className="flex">
        <div className={`w-1 flex-shrink-0 ${st.stripe}`} />

        <div className="flex-1 p-4 space-y-3">
          {/* Top row: avatar + info + phone button */}
          <div className="flex items-start gap-3">

            {/* Avatar */}
            <div className={`flex-shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}>
              <span className="text-white text-sm font-bold tracking-wide">{initials}</span>
            </div>

            {/* Name, city, date */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/staff/leads/${lead.id}`}
                  className="font-bold text-gray-900 hover:text-red-700 transition-colors text-base leading-tight"
                >
                  {lead.customerName}
                </Link>
                {/* Status badge */}
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold flex-shrink-0 ${st.bg} ${st.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                  {st.label}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {lead.city && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <svg className="h-3 w-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {lead.city}
                  </span>
                )}
                <span className="text-[11px] text-gray-400">
                  {lead.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Phone call button */}
            {lead.customerPhone ? (
              <a
                href={`tel:${lead.customerPhone}`}
                className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-2xl bg-green-500 text-white shadow-md hover:bg-green-600 active:scale-95 transition-all"
                title={`Call ${lead.customerPhone}`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            ) : (
              <div className="flex-shrink-0 h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            )}
          </div>

          {/* Phone number row */}
          {lead.customerPhone && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {lead.customerPhone}
            </p>
          )}

          {/* Requirement notes */}
          {lead.requirementNotes && (
            <div className="rounded-xl bg-gray-50/80 border border-gray-100 px-3 py-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Requirement</p>
              <p className="text-xs text-gray-600 line-clamp-2">{lead.requirementNotes}</p>
            </div>
          )}

          {/* Action buttons */}
          {isPending && (
            <QuickStatusButtons leadId={lead.id} status={lead.status} variant="card" />
          )}

          {/* Completed status note */}
          {!isPending && (
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${st.bg} border`}>
              {lead.status === 'qualified' && (
                <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {lead.status === 'rejected' && (
                <svg className="h-4 w-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className={`text-xs font-semibold ${st.text}`}>
                {lead.status === 'qualified' ? 'Marked as qualified — incentive earned' :
                 lead.status === 'rejected' ? 'Marked as rejected' :
                 lead.status === 'converted' ? 'Converted to customer' :
                 lead.status === 'duplicate' ? 'Marked as duplicate' : st.label}
              </span>
              <Link
                href={`/staff/leads/${lead.id}`}
                className="ml-auto text-[10px] font-semibold text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                View →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
