import { QrGenerator } from '@/components/qr/QrGenerator';
import { generateStaffQrTokenAction } from './actions';

export default function StaffQrPage() {
  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Client Registration QR</h1>
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <QrGenerator generateAction={generateStaffQrTokenAction} />
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">How it works</h3>
        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
          <li>Generate a QR code (valid for 15 minutes)</li>
          <li>Show it to your customer to scan</li>
          <li>Customer enters their own details &amp; verifies via OTP</li>
          <li>Lead is linked to you automatically</li>
        </ol>
      </div>
    </div>
  );
}
