'use server';

import { getServerSession } from '@/lib/session';
import { getAdminStorage } from '@/lib/firebase-server';

export async function uploadLeadPhoto(
  base64Data: string,
  fileName: string,
  leadDraftId: string
): Promise<{ path: string } | { error: string }> {
  const session = await getServerSession();
  if (!session || session.role !== 'agent') return { error: 'Unauthorized' };

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const storagePath = `leads/${leadDraftId}/photos/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const bucket = getAdminStorage().bucket();
    const file = bucket.file(storagePath);
    await file.save(buffer, { contentType: 'image/jpeg', resumable: false });
    return { path: storagePath };
  } catch (err: any) {
    console.error('uploadLeadPhoto error:', err);
    return { error: 'Upload failed. Please try again.' };
  }
}
