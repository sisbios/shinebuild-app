export const dynamic = 'force-dynamic';

import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';
import { NewLeadFlow } from './NewLeadFlow';

export default async function NewLeadPage() {
  const session = await getServerSession();
  const db = getAdminDb();

  let serviceItems: Array<{ id: string; name: string }> = [];
  try {
    const snap = await db.collection(COLLECTIONS.SERVICE_ITEMS)
      .where('active', '==', true)
      .orderBy('order', 'asc')
      .get();
    serviceItems = snap.docs.map((d) => ({ id: d.id, name: d.data()['name'] as string }));
  } catch { /* empty collection or no index yet */ }

  let directEntryEnabled = false;
  try {
    const userSnap = await db.collection(COLLECTIONS.USERS).doc(session!.uid).get();
    directEntryEnabled = userSnap.data()?.['directEntryEnabled'] === true;
  } catch { /* default false */ }

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

      <NewLeadFlow
        agentId={session!.uid}
        serviceItems={serviceItems}
        directEntryEnabled={directEntryEnabled}
      />
    </div>
  );
}
