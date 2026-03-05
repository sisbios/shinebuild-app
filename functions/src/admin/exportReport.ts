import { onCall } from 'firebase-functions/v2/https';
import { adminDb } from '../lib/admin.js';
import { requireRole } from '../lib/auth-claims.js';
import { writeAuditLog } from '../lib/audit.js';

export const exportReport = onCall(
  { enforceAppCheck: process.env['FUNCTIONS_EMULATOR'] !== 'true', region: 'asia-south1', timeoutSeconds: 120 },
  async (request) => {
    const { uid } = requireRole(request, ['superadmin']);
    const db = adminDb();

    const snap = await db.collection('leads').orderBy('createdAt', 'desc').get();

    const headers = ['Lead ID','Reference','Source','Agent ID','Customer Name','Phone','Email','City','Status','Created'];
    const rows = snap.docs.map((doc) => {
      const d = doc.data();
      return [
        doc.id,
        doc.id.slice(-6).toUpperCase(),
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
      .map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    await writeAuditLog({
      actorUid: uid,
      role: 'superadmin',
      action: 'report.exported',
      targetType: 'leads',
      targetId: 'all',
      metadata: { rowCount: rows.length },
    });

    return { csv, rowCount: rows.length };
  }
);
