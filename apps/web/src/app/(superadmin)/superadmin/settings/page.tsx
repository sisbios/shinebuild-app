import Link from 'next/link';

export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <Link
        href="/superadmin/settings/incentive-rules"
        className="block rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm"
      >
        <p className="font-semibold text-gray-900">Incentive Rules</p>
        <p className="text-sm text-gray-500">Manage base amounts and bonuses per qualified lead</p>
      </Link>
    </div>
  );
}
