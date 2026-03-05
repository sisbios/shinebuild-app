import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-white px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo */}
        <div className="space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 shadow-lg">
            <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Shine Build Hub</h1>
          <p className="text-sm text-gray-500">Agent Lead Collection Platform</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-xl bg-orange-500 py-3 text-center text-base font-semibold text-white shadow-sm hover:bg-orange-600"
          >
            Sign In
          </Link>
          <Link
            href="/agent/register"
            className="block w-full rounded-xl border border-gray-300 bg-white py-3 text-center text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            Register as Agent
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          Secure lead collection with verified agent tracking
        </p>
      </div>
    </main>
  );
}
