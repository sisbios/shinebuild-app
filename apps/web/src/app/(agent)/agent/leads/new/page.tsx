import { getServerSession } from '@/lib/session';
import { LeadForm } from '@/components/leads/LeadForm';
import Link from 'next/link';

export default async function NewLeadPage() {
  const session = await getServerSession();

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/agent/leads" className="text-gray-400 hover:text-gray-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Lead</h1>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
        <p className="text-xs text-amber-800">
          Customer details are collected securely. You will only see a masked reference.
        </p>
      </div>

      <LeadForm agentId={session!.uid} />
    </div>
  );
}
