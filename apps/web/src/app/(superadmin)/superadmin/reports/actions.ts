'use server';

import { requireRole } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';
import { COLLECTIONS } from '@shinebuild/firebase';
import { FieldValue } from 'firebase-admin/firestore';

interface ExportResult {
  error?: string;
  csv?: string;
}

export async function exportReport(): Promise<ExportResult> {
  const session = await requireRole('superadmin');
  const db = getAdminDb();

  try {
    const snap = await db.collection(COLLECTIONS.LEADS).orderBy('createdAt', 'desc').get();

    const headers = ['Lead ID','Reference','Source','Agent ID','Customer Name','Phone','Email','City','Status','Created'];
    const rows = snap.docs.map((doc) => {
      const d = doc.data();
      const referenceId = doc.id.slice(-6).toUpperCase();
      return [
        doc.id,
        referenceId,
        d['source'],
        d['agentId'],
        d['customer']?.['name'] ?? '',
        d['customer']?.['phoneE164'] ?? '',
        d['customer']?.['email'] ?? '',
        d['city'],
        d['status']?.['current'],
        d['createdAt']?.toDate()?.toISOString() ?? '',
      ].map(String);
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Write audit log
    await db.collection(COLLECTIONS.AUDITS).add({
      actorUid: session.uid,
      role: 'superadmin',
      action: 'report.exported',
      targetType: 'leads',
      targetId: 'all',
      createdAt: FieldValue.serverTimestamp(),
      metadata: { rowCount: rows.length },
    });

    return { csv };
  } catch (err: any) {
    console.error('exportReport error:', err);
    return { error: 'Export failed' };
  }
}
