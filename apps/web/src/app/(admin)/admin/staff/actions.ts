'use server';

import { requireRole, getServerSession } from '@/lib/session';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

export async function addStaffMember(formData: FormData): Promise<{ error?: string }> {
  const session = await requireRole('admin', 'superadmin');
  const name = (formData.get('name') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim();

  if (!name || !phone) return { error: 'Name and phone are required' };

  const db = getAdminDb();
  const auth = getAdminAuth();

  try {
    // Check if phone already exists
    const existing = await db.collection(COLLECTIONS.USERS).where('phone', '==', phone).get();
    if (!existing.empty) {
      const existingRole = existing.docs[0].data()['role'];
      if (existingRole === 'staff') return { error: 'A staff member with this phone already exists' };
    }

    // Create Firebase Auth user (phone auth — they'll sign in with OTP)
    let uid: string;
    try {
      const user = await auth.getUserByPhoneNumber(phone);
      uid = user.uid;
    } catch {
      // Create new auth record
      const user = await auth.createUser({ phoneNumber: phone, displayName: name });
      uid = user.uid;
    }

    // Set custom claims
    await auth.setCustomUserClaims(uid, { role: 'staff' });

    // Create Firestore user doc
    await db.collection(COLLECTIONS.USERS).doc(uid).set({
      role: 'staff',
      name,
      phone,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      createdBy: session!.uid,
    }, { merge: true });

    // Audit
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session!.uid,
      role: session!.role,
      action: 'staff.created',
      targetType: 'user',
      targetId: uid,
      createdAt: FieldValue.serverTimestamp(),
      metadata: { name, phone },
    });

    revalidatePath('/admin/staff');
    return {};
  } catch (err: any) {
    console.error('addStaffMember error:', err);
    return { error: err.message ?? 'Failed to add staff member' };
  }
}

export async function updateStaffStatus(uid: string, status: 'active' | 'deactivated'): Promise<{ error?: string }> {
  const session = await requireRole('admin', 'superadmin');
  const db = getAdminDb();
  const auth = getAdminAuth();

  try {
    await db.collection(COLLECTIONS.USERS).doc(uid).update({ status });
    if (status === 'deactivated') {
      await auth.revokeRefreshTokens(uid);
      await auth.setCustomUserClaims(uid, { role: 'staff', status: 'deactivated' });
    } else {
      await auth.setCustomUserClaims(uid, { role: 'staff' });
    }
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session!.uid,
      role: session!.role,
      action: `staff.${status}`,
      targetType: 'user',
      targetId: uid,
      createdAt: FieldValue.serverTimestamp(),
      metadata: { status },
    });
    revalidatePath('/admin/staff');
    return {};
  } catch (err: any) {
    console.error('updateStaffStatus error:', err);
    return { error: 'Failed to update status' };
  }
}

export async function deleteStaffMember(uid: string): Promise<{ error?: string }> {
  const session = await requireRole('admin', 'superadmin');
  const db = getAdminDb();
  const auth = getAdminAuth();

  try {
    // Remove custom claims and revoke sessions
    await auth.setCustomUserClaims(uid, {});
    await auth.revokeRefreshTokens(uid);
    // Soft-delete: mark as deleted in Firestore (preserve history)
    await db.collection(COLLECTIONS.USERS).doc(uid).update({
      status: 'deleted',
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: session!.uid,
    });
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session!.uid,
      role: session!.role,
      action: 'staff.deleted',
      targetType: 'user',
      targetId: uid,
      createdAt: FieldValue.serverTimestamp(),
      metadata: {},
    });
    revalidatePath('/admin/staff');
    return {};
  } catch (err: any) {
    console.error('deleteStaffMember error:', err);
    return { error: 'Failed to delete staff member' };
  }
}
