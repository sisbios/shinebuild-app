import { requireRole } from '@/lib/session';
import { getServiceItemsForStaff } from './actions';
import { StaffLeadForm } from './StaffLeadForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function StaffNewLeadPage() {
  const session = await requireRole('staff', 'admin', 'superadmin');
  const serviceItems = await getServiceItemsForStaff();

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/staff/leads" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Lead</h1>
          <p className="text-xs text-gray-500">Enter customer details manually</p>
        </div>
      </div>
      <StaffLeadForm staffId={session!.uid} serviceItems={serviceItems} />
    </div>
  );
}
