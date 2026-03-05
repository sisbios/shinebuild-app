import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { destroySession } from '@/app/(public)/login/actions';
import { redirect } from 'next/navigation';
import { SignOutButton } from './SignOutButton';

export const dynamic = 'force-dynamic';

export default async function AgentProfilePage() {
  const session = await getServerSession();
  const db = getAdminDb();

  let user: { name: string; phone: string; city?: string } | null = null;
  try {
    const snap = await db.collection(COLLECTIONS.USERS).doc(session!.uid).get();
    if (snap.exists) {
      const d = snap.data()!;
      user = { name: d['name'], phone: d['phone'], city: d['metadata']?.['city'] };
    }
  } catch {}

  return (
    <div className="px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Profile</h1>

      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <Row label="Name">{user?.name ?? '—'}</Row>
        <Row label="Phone">{user?.phone ?? '—'}</Row>
        <Row label="City">{user?.city ?? '—'}</Row>
        <Row label="Status"><span className="text-green-600 font-medium">Approved</span></Row>
      </div>

      <SignOutButton />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{children}</span>
    </div>
  );
}
