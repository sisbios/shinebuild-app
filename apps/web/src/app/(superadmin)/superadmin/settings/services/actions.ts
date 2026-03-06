'use server';

import { getServerSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

export async function addServiceItem(name: string): Promise<{ error?: string }> {
  const session = await getServerSession();
  if (!session || session.role !== 'superadmin') return { error: 'Unauthorized' };
  if (!name.trim()) return { error: 'Name is required' };

  try {
    const db = getAdminDb();
    // Get current max order
    const snap = await db.collection(COLLECTIONS.SERVICE_ITEMS)
      .orderBy('order', 'desc').limit(1).get();
    const maxOrder = snap.empty ? 0 : (snap.docs[0]!.data()['order'] ?? 0);
    await db.collection(COLLECTIONS.SERVICE_ITEMS).add({
      name: name.trim(),
      active: true,
      order: maxOrder + 1,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: session.uid,
    });
    revalidatePath('/superadmin/settings/services');
    return {};
  } catch (err: any) {
    console.error('addServiceItem error:', err);
    return { error: 'Failed to add item' };
  }
}

export async function deleteServiceItem(id: string): Promise<{ error?: string }> {
  const session = await getServerSession();
  if (!session || session.role !== 'superadmin') return { error: 'Unauthorized' };

  try {
    const db = getAdminDb();
    await db.collection(COLLECTIONS.SERVICE_ITEMS).doc(id).delete();
    revalidatePath('/superadmin/settings/services');
    return {};
  } catch (err: any) {
    console.error('deleteServiceItem error:', err);
    return { error: 'Failed to delete item' };
  }
}

export async function toggleServiceItem(id: string, active: boolean): Promise<{ error?: string }> {
  const session = await getServerSession();
  if (!session || session.role !== 'superadmin') return { error: 'Unauthorized' };

  try {
    const db = getAdminDb();
    await db.collection(COLLECTIONS.SERVICE_ITEMS).doc(id).update({ active });
    revalidatePath('/superadmin/settings/services');
    return {};
  } catch (err: any) {
    return { error: 'Failed to update item' };
  }
}
