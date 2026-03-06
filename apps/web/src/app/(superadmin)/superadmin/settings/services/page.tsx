export const dynamic = 'force-dynamic';

import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import Link from 'next/link';
import { ServicesManager } from './ServicesManager';

export default async function ServicesPage() {
  const db = getAdminDb();
  let items: Array<{ id: string; name: string; active: boolean; order: number }> = [];

  try {
    const snap = await db.collection(COLLECTIONS.SERVICE_ITEMS)
      .orderBy('order', 'asc')
      .get();
    items = snap.docs.map((d) => ({
      id: d.id,
      name: d.data()['name'] as string,
      active: d.data()['active'] as boolean,
      order: d.data()['order'] as number,
    }));
  } catch { /* empty collection */ }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/superadmin/settings" className="text-gray-400 hover:text-gray-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Services / Products</h1>
          <p className="text-xs text-gray-500 mt-0.5">These appear as checkboxes in the agent lead form</p>
        </div>
      </div>

      <ServicesManager initialItems={items} />
    </div>
  );
}
