'use server';

import { requireRole } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { maskName, maskPhone } from '@shinebuild/shared';

export interface StaffLeadInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  city: string;
  requirementNotes: string;
  services: string[];
  photos: string[];
  staffNotes: string;
}

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return '+' + digits;
  if (digits.length === 10) return '+91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
  return '+' + digits;
}

export async function getServiceItemsForStaff(): Promise<Array<{ id: string; name: string }>> {
  try {
    const db = getAdminDb();
    const snap = await db.collection(COLLECTIONS.SERVICE_ITEMS)
      .where('active', '==', true)
      .orderBy('order', 'asc')
      .get();
    return snap.docs.map((d) => ({ id: d.id, name: d.data()['name'] as string }));
  } catch { return []; }
}

export async function submitStaffLead(input: StaffLeadInput): Promise<{ error?: string; leadId?: string }> {
  const session = await requireRole('staff', 'admin', 'superadmin');

  const name = input.customerName.trim();
  const phone = toE164(input.customerPhone.trim());
  const city = input.city.trim();
  const notes = input.requirementNotes.trim();

  if (!name || name.length < 2) return { error: 'Customer name must be at least 2 characters' };
  if (!phone.match(/^\+[1-9]\d{7,14}$/)) return { error: 'Invalid phone number. Enter a 10-digit Indian number or E.164 format.' };
  if (!city || city.length < 2) return { error: 'City is required' };
  if (!notes || notes.length < 5) return { error: 'Requirement notes must be at least 5 characters' };

  const db = getAdminDb();

  try {
    // Duplicate check by phone
    const dupSnap = await db.collection(COLLECTIONS.LEADS)
      .where('customer.phoneE164', '==', phone)
      .limit(1)
      .get();

    const leadRef = db.collection(COLLECTIONS.LEADS).doc();
    const leadId = leadRef.id;
    const referenceId = leadId.slice(-6).toUpperCase();
    const now = FieldValue.serverTimestamp();

    const isDuplicate = !dupSnap.empty;
    const duplicateOfLeadId = isDuplicate ? dupSnap.docs[0]!.id : undefined;

    await leadRef.set({
      source: 'staff_direct',
      agentId: null,
      enteredByStaffId: session!.uid,
      assignedStaffIds: [session!.uid],
      customer: {
        name,
        phoneE164: phone,
        email: input.customerEmail?.trim() || null,
      },
      requirementNotes: notes,
      city,
      photos: input.photos,
      services: input.services,
      staffNotes: input.staffNotes.trim() || null,
      geo: null,
      ...(isDuplicate ? { duplicateOfLeadId, status: { current: 'duplicate', history: [{ status: 'duplicate', at: Timestamp.now(), by: session!.uid, note: 'Auto-detected duplicate on entry' }] } } : {
        status: { current: 'new', history: [{ status: 'new', at: Timestamp.now(), by: session!.uid }] },
      }),
      incentive: null,
      createdAt: now,
      createdBy: session!.uid,
    });

    // agentView subcollection (masked) — for reporting consistency
    await leadRef.collection('agentView').doc('data').set({
      agentId: session!.uid,
      referenceId,
      maskedName: maskName(name),
      maskedPhone: maskPhone(phone),
      maskedEmail: input.customerEmail ? '***' : null,
      source: 'staff_direct',
      status: isDuplicate ? 'duplicate' : 'new',
      incentiveAmount: 0,
      city,
      createdAt: now,
    });

    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session!.uid,
      role: session!.role,
      action: 'lead.created',
      targetType: 'lead',
      targetId: leadId,
      createdAt: now,
      metadata: { source: 'staff_direct', city, isDuplicate },
    });

    revalidatePath('/staff/leads');
    revalidatePath('/staff/dashboard');
    return { leadId };
  } catch (err: any) {
    console.error('submitStaffLead error:', err);
    return { error: 'Failed to submit lead. Please try again.' };
  }
}
