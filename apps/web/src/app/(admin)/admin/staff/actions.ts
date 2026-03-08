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
  const assignedForAssessment = formData.get('assignedForAssessment') !== 'false';
  const rawRole = (formData.get('role') as string)?.trim();
  const role = (['staff', 'admin', 'superadmin'].includes(rawRole) ? rawRole : 'staff') as 'staff' | 'admin' | 'superadmin';

  // Only superadmin can create admin or superadmin roles
  if ((role === 'admin' || role === 'superadmin') && session!.role !== 'superadmin') {
    return { error: 'Only a superadmin can create admin or superadmin accounts' };
  }

  if (!name || !phone) return { error: 'Name and phone are required' };

  const db = getAdminDb();
  const auth = getAdminAuth();

  try {
    // Check if phone already exists in Firestore
    const existing = await db.collection(COLLECTIONS.USERS).where('phone', '==', phone).get();
    if (!existing.empty) {
      const existingDoc = existing.docs[0]!;
      const existingData = existingDoc.data();
      const existingStatus = existingData['status'];

      // Allow re-adding if the previous user was soft-deleted or hard-deleted leftover
      if (existingStatus === 'deleted') {
        // Wipe the stale doc so we get a clean slate below
        await existingDoc.ref.delete();
      } else {
        return { error: `A user with this phone already exists (${existingData['role']})` };
      }
    }

    // Get or create Firebase Auth user
    let uid: string;
    try {
      const user = await auth.getUserByPhoneNumber(phone);
      uid = user.uid;
      // Revoke old tokens in case they were previously active
      await auth.revokeRefreshTokens(uid).catch(() => {});
    } catch {
      const user = await auth.createUser({ phoneNumber: phone, displayName: name });
      uid = user.uid;
    }

    // Set custom claims for new role
    await auth.setCustomUserClaims(uid, { role });

    // Write Firestore user doc (overwrite any remnant)
    await db.collection(COLLECTIONS.USERS).doc(uid).set({
      role,
      name,
      phone,
      status: 'active',
      assignedForAssessment: role === 'staff' ? assignedForAssessment : false,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: session!.uid,
    });

    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session!.uid,
      role: session!.role,
      action: 'staff.created',
      targetType: 'user',
      targetId: uid,
      createdAt: FieldValue.serverTimestamp(),
      metadata: { name, phone, role },
    });

    revalidatePath('/admin/staff');
    revalidatePath('/superadmin/staff');
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

export async function toggleAssessmentAssignment(uid: string, assigned: boolean): Promise<{ error?: string }> {
  await requireRole('admin', 'superadmin');
  const db = getAdminDb();
  try {
    await db.collection(COLLECTIONS.USERS).doc(uid).update({ assignedForAssessment: assigned });
    revalidatePath('/admin/staff');
    return {};
  } catch (err: any) {
    console.error('toggleAssessmentAssignment error:', err);
    return { error: 'Failed to update assessment assignment' };
  }
}

export async function promoteToSuperAdmin(uid: string): Promise<{ error?: string }> {
  const session = await requireRole('superadmin');
  const db = getAdminDb();
  const auth = getAdminAuth();
  try {
    await auth.setCustomUserClaims(uid, { role: 'superadmin' });
    await db.collection(COLLECTIONS.USERS).doc(uid).update({ role: 'superadmin' });
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session!.uid,
      role: session!.role,
      action: 'staff.promoted_to_superadmin',
      targetType: 'user',
      targetId: uid,
      createdAt: FieldValue.serverTimestamp(),
      metadata: {},
    });
    revalidatePath('/admin/staff');
    return {};
  } catch (err: any) {
    console.error('promoteToSuperAdmin error:', err);
    return { error: 'Failed to promote user' };
  }
}

export async function deleteStaffMember(uid: string): Promise<{ error?: string }> {
  const session = await requireRole('admin', 'superadmin');
  const db = getAdminDb();
  const auth = getAdminAuth();

  try {
    await auth.setCustomUserClaims(uid, {});
    await auth.revokeRefreshTokens(uid);
    await db.collection(COLLECTIONS.USERS).doc(uid).update({
      status: 'deleted',
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: session!.uid,
    });
    db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session!.uid, role: session!.role, action: 'staff.deleted',
      targetType: 'user', targetId: uid, createdAt: FieldValue.serverTimestamp(), metadata: {},
    }).catch(console.error);
    revalidatePath('/admin/staff');
    return {};
  } catch (err: any) {
    console.error('deleteStaffMember error:', err);
    return { error: 'Failed to delete staff member' };
  }
}

export async function editStaffMember(
  uid: string,
  data: { name: string; phone: string }
): Promise<{ error?: string }> {
  const session = await requireRole('superadmin');
  const db = getAdminDb();
  const auth = getAdminAuth();
  const name = data.name.trim();
  const phone = data.phone.trim();
  if (!name || !phone) return { error: 'Name and phone are required' };
  try {
    await Promise.all([
      db.collection(COLLECTIONS.USERS).doc(uid).update({ name, phone }),
      auth.updateUser(uid, { displayName: name, phoneNumber: phone }).catch(() => {}),
    ]);
    db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session!.uid, role: session!.role, action: 'staff.edited',
      targetType: 'user', targetId: uid, createdAt: FieldValue.serverTimestamp(), metadata: { name, phone },
    }).catch(console.error);
    revalidatePath('/admin/staff');
    revalidatePath('/superadmin/staff');
    return {};
  } catch (err: any) {
    console.error('editStaffMember error:', err);
    return { error: err.message ?? 'Failed to update staff member' };
  }
}

export async function updateStaffRole(
  uid: string,
  role: 'staff' | 'admin' | 'superadmin'
): Promise<{ error?: string }> {
  const session = await requireRole('superadmin');
  const db = getAdminDb();
  const auth = getAdminAuth();
  try {
    await Promise.all([
      auth.setCustomUserClaims(uid, { role }),
      db.collection(COLLECTIONS.USERS).doc(uid).update({ role }),
    ]);
    await auth.revokeRefreshTokens(uid); // force re-login so new claims take effect
    db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session!.uid, role: session!.role, action: 'staff.role_changed',
      targetType: 'user', targetId: uid, createdAt: FieldValue.serverTimestamp(), metadata: { newRole: role },
    }).catch(console.error);
    revalidatePath('/admin/staff');
    revalidatePath('/superadmin/staff');
    return {};
  } catch (err: any) {
    console.error('updateStaffRole error:', err);
    return { error: 'Failed to update role' };
  }
}

export async function transferStaffLeads(
  fromUid: string,
  toUid: string
): Promise<{ error?: string; count?: number }> {
  const session = await requireRole('superadmin');
  if (!toUid) return { error: 'Target staff member is required' };
  const db = getAdminDb();
  try {
    const leadsSnap = await db
      .collection(COLLECTIONS.LEADS)
      .where('assignedStaffIds', 'array-contains', fromUid)
      .get();

    if (leadsSnap.empty) return { count: 0 };

    const batch1 = db.batch();
    for (const doc of leadsSnap.docs) {
      batch1.update(doc.ref, { assignedStaffIds: FieldValue.arrayRemove(fromUid) });
    }
    await batch1.commit();

    const batch2 = db.batch();
    for (const doc of leadsSnap.docs) {
      batch2.update(doc.ref, { assignedStaffIds: FieldValue.arrayUnion(toUid) });
    }
    await batch2.commit();

    db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session!.uid, role: session!.role, action: 'staff.leads_transferred',
      targetType: 'user', targetId: fromUid, createdAt: FieldValue.serverTimestamp(),
      metadata: { toUid, count: leadsSnap.size },
    }).catch(console.error);

    revalidatePath('/superadmin/staff');
    revalidatePath('/admin/staff');
    return { count: leadsSnap.size };
  } catch (err: any) {
    console.error('transferStaffLeads error:', err);
    return { error: 'Failed to transfer leads' };
  }
}

export async function hardDeleteStaff(
  uid: string,
  transferToUid?: string
): Promise<{ error?: string }> {
  const session = await requireRole('superadmin');
  const db = getAdminDb();
  const auth = getAdminAuth();
  try {
    // Transfer leads if requested
    if (transferToUid) {
      const leadsSnap = await db
        .collection(COLLECTIONS.LEADS)
        .where('assignedStaffIds', 'array-contains', uid)
        .get();

      if (!leadsSnap.empty) {
        const batch = db.batch();
        for (const doc of leadsSnap.docs) {
          batch.update(doc.ref, {
            assignedStaffIds: FieldValue.arrayRemove(uid),
          });
        }
        await batch.commit();

        // Add transferee in a second batch (arrayRemove + arrayUnion can't be in same update)
        const batch2 = db.batch();
        for (const doc of leadsSnap.docs) {
          batch2.update(doc.ref, {
            assignedStaffIds: FieldValue.arrayUnion(transferToUid),
          });
        }
        await batch2.commit();
      }
    } else {
      // Just remove from all leads without replacement
      const leadsSnap = await db
        .collection(COLLECTIONS.LEADS)
        .where('assignedStaffIds', 'array-contains', uid)
        .get();
      if (!leadsSnap.empty) {
        const batch = db.batch();
        for (const doc of leadsSnap.docs) {
          batch.update(doc.ref, { assignedStaffIds: FieldValue.arrayRemove(uid) });
        }
        await batch.commit();
      }
    }

    // Hard delete from Firebase Auth + Firestore
    await Promise.all([
      auth.deleteUser(uid).catch(() => {}), // ignore if already deleted
      db.collection(COLLECTIONS.USERS).doc(uid).delete(),
    ]);

    db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session!.uid, role: session!.role, action: 'staff.hard_deleted',
      targetType: 'user', targetId: uid, createdAt: FieldValue.serverTimestamp(),
      metadata: { transferToUid: transferToUid ?? null },
    }).catch(console.error);

    revalidatePath('/admin/staff');
    revalidatePath('/superadmin/staff');
    return {};
  } catch (err: any) {
    console.error('hardDeleteStaff error:', err);
    return { error: 'Failed to permanently delete staff member' };
  }
}
