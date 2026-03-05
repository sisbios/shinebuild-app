'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase-server';
import { createSession } from '@/app/(public)/login/actions';
import { AgentRegisterSchema } from '@shinebuild/shared';
import { FieldValue } from 'firebase-admin/firestore';

interface RegisterInput {
  idToken: string;
  name: string;
  city: string;
  district?: string;
}

export async function registerAgent(input: RegisterInput): Promise<{ error?: string }> {
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(input.idToken);
    const phone = decoded.phone_number ?? '';

    // Validate profile
    const parsed = AgentRegisterSchema.safeParse({
      name: input.name,
      phone,
      city: input.city,
      district: input.district,
    });
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(decoded.uid);
    const snap = await userRef.get();

    if (snap.exists) {
      const data = snap.data()!;
      if (data['role'] && data['role'] !== 'agent') {
        return { error: 'Account already exists with a different role' };
      }
    }

    // Write user doc (status=pending)
    await userRef.set({
      uid: decoded.uid,
      role: 'agent',
      phone,
      name: input.name,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
      metadata: {
        city: input.city,
        ...(input.district ? { district: input.district } : {}),
      },
    });

    // Create session cookie so they're logged in
    await createSession(input.idToken);

    return {};
  } catch (err: any) {
    console.error('registerAgent error:', err);
    return { error: 'Registration failed. Please try again.' };
  }
}
