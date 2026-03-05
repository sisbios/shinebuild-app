import 'server-only';
import { getAdminDb } from './firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Returns the next active staff member UID using round-robin,
 * or null if no active staff exists.
 * Uses a Firestore counter doc (_meta/roundRobin) for persistence.
 */
export async function getNextStaffRoundRobin(): Promise<string | null> {
  const db = getAdminDb();

  // Fetch all active staff
  const staffSnap = await db
    .collection(COLLECTIONS.USERS)
    .where('role', '==', 'staff')
    .where('status', '==', 'active')
    .get();

  if (staffSnap.empty) return null;

  const staffIds = staffSnap.docs.map((d) => d.id).sort(); // sort for determinism

  // Atomic increment of counter
  const counterRef = db.collection('_meta').doc('roundRobin');
  const idx = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = (snap.exists ? snap.data()!['counter'] : 0) as number;
    const next = (current + 1) % staffIds.length;
    tx.set(counterRef, { counter: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return current % staffIds.length;
  });

  return staffIds[idx] ?? null;
}
