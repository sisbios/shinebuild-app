export const dynamic = 'force-dynamic';

import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import Link from 'next/link';
import { COLLECTIONS } from '@shinebuild/firebase';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { maskName, maskPhone } from '@shinebuild/shared';
import type { LeadStatus } from '@shinebuild/shared';

export default async function AgentDashboardPage() {
  const session = await getServerSession();
  const db = getAdminDb();

  let agentName = '';
  let totalLeads = 0;
  let qualifiedLeads = 0;
  let ledgerBalance = 0;
  let leads: Array<{
    id: string; referenceId: string; maskedName: string; maskedPhone: string;
    status: LeadStatus; city: string; incentiveAmount: number; createdAt: Date;
  }> = [];
  let queryError = '';

  try {
    const userSnap = await db.collection(COLLECTIONS.USERS).doc(session!.uid).get();
    agentName = userSnap.data()?.['name'] ?? '';
  } catch { /* no user doc yet */ }

  try {
    if (!session?.uid) throw new Error('No session — user not authenticated');
    console.log('[AgentDashboard] querying leads for agentId:', session.uid);
    const [leadsSnap, ledgerSnap] = await Promise.all([
      db.collection(COLLECTIONS.LEADS).where('agentId', '==', session.uid).get(),
      db.collection(COLLECTIONS.INCENTIVE_LEDGER).doc(session.uid).get(),
    ]);

    totalLeads = leadsSnap.size;
    leads = leadsSnap.docs
      .map((doc) => {
        const d = doc.data();
        const customerName = d['customer']?.['name'] ?? '';
        const customerPhone = d['customer']?.['phoneE164'] ?? '';
        const s = d['status']?.['current'] as LeadStatus;
        if (s === 'qualified' || s === 'converted') qualifiedLeads++;
        return {
          id: doc.id,
          referenceId: doc.id.slice(-6).toUpperCase(),
          maskedName: customerName ? maskName(customerName) : '(Direct entry)',
          maskedPhone: customerPhone ? maskPhone(customerPhone) : '—',
          status: s ?? 'new',
          city: d['city'] ?? '',
          incentiveAmount: d['incentive']?.['amount'] ?? 0,
          createdAt: d['createdAt']?.toDate() ?? new Date(),
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (ledgerSnap.exists) ledgerBalance = ledgerSnap.data()!['balance'] ?? 0;
  } catch (e: any) {
    console.error('AgentDashboard query error:', e);
    queryError = e?.message ?? 'Failed to load leads';
  }

  const firstName = agentName.split(' ')[0] || 'Agent';

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500">Welcome back,</p>
        <h1 className="text-2xl font-bold text-gray-900">{firstName} <span className="text-gradient-brand">to Shine Connect</span></h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Leads" value={totalLeads} />
        <StatCard label="Qualified" value={qualifiedLeads} />
        <StatCard label="Balance" value={`₹${ledgerBalance}`} highlight />
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Quick Actions</h2>
        <Link
          href="/agent/leads/new"
          className="flex items-center gap-3 rounded-2xl brand-gradient px-4 py-3.5 text-white shadow-md"
        >
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Add New Lead</p>
            <p className="text-xs text-white/70">Direct entry with geo + photo</p>
          </div>
          <svg className="h-5 w-5 ml-auto text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/agent/qr"
          className="flex items-center gap-3 rounded-2xl glass-card px-4 py-3.5"
        >
          <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Generate QR Code</p>
            <p className="text-xs text-gray-500">Let customer self-enter details</p>
          </div>
          <svg className="h-5 w-5 ml-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Incentive hint if balance > 0 */}
      {ledgerBalance > 0 && (
        <div className="glass-card rounded-2xl p-4 border-l-4 border-green-500">
          <p className="text-sm font-bold text-gray-900">You have ₹{ledgerBalance} in incentives</p>
          <p className="text-xs text-gray-500 mt-0.5">Contact your admin to redeem your earnings.</p>
        </div>
      )}

      {/* Recent leads */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">My Leads</h2>
          {leads.length > 0 && (
            <Link href="/agent/leads" className="text-xs text-red-700 font-semibold hover:underline">
              View all →
            </Link>
          )}
        </div>

        {queryError ? (
          <div className="glass-card rounded-2xl p-4 border border-red-200 bg-red-50">
            <p className="text-sm text-red-700 font-medium">Could not load leads</p>
            <p className="text-xs text-red-500 mt-1">{queryError}</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="glass-card rounded-2xl py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 border border-gray-200">
              <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-500">No leads yet</p>
            <Link href="/agent/leads/new" className="mt-2 inline-block text-xs text-red-700 font-medium hover:underline">
              Add your first lead →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/agent/leads/${lead.id}`}
                className="glass-card rounded-2xl p-4 flex items-center gap-3 hover-lift block"
              >
                {/* Status stripe */}
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                  lead.status === 'new' ? 'bg-blue-500' :
                  lead.status === 'contacted' ? 'bg-purple-500' :
                  lead.status === 'qualified' ? 'bg-green-500' :
                  lead.status === 'converted' ? 'bg-emerald-500' :
                  lead.status === 'rejected' ? 'bg-red-400' : 'bg-gray-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{lead.maskedName}</span>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lead.maskedPhone}
                    {lead.city ? ` · ${lead.city}` : ''}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Ref: {lead.referenceId} · {lead.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                {lead.incentiveAmount > 0 && (
                  <span className="text-xs font-bold text-green-600 flex-shrink-0">₹{lead.incentiveAmount}</span>
                )}
                <svg className="h-4 w-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`glass-card rounded-2xl p-3 text-center ${highlight ? 'border-l-2 border-red-600' : ''}`}>
      <p className={`text-xl font-bold ${highlight ? 'text-red-800' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
