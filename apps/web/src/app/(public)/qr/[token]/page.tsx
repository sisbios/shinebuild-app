export const dynamic = 'force-dynamic';

import { QrLeadFlow } from './QrLeadFlow';
import { validateQrToken } from './actions';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function QrTokenPage({ params }: Props) {
  const { token } = await params;

  // Server-validate and consume token atomically
  const validation = await validateQrToken(token);

  if (validation.error) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900">
            {validation.error === 'expired' ? 'QR Code Expired' :
             validation.error === 'used' ? 'QR Code Already Used' : 'Invalid QR Code'}
          </h1>
          <p className="text-sm text-gray-500">
            {validation.error === 'expired'
              ? 'This QR code has expired (valid for 15 minutes). Please ask the agent to generate a new one.'
              : validation.error === 'used'
              ? 'This QR code has already been used. Each code is single-use only.'
              : 'This QR code is not valid. Please ask the agent to generate a new one.'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh flex-col bg-gray-50">
      <div className="px-4 py-6 max-w-sm mx-auto w-full space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Shine Build Hub</h1>
          <p className="text-sm text-gray-500">Share your requirements securely</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <QrLeadFlow tokenId={validation.tokenId!} />
        </div>
      </div>
    </main>
  );
}
