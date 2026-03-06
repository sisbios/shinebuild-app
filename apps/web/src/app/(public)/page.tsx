import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-mesh-orange px-4 py-10">
      <div className="w-full max-w-sm space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl brand-gradient shadow-xl shadow-red-200/60">
            <svg className="h-11 w-11 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Shine Build Hub</h1>
            <p className="text-sm text-gray-500 mt-1.5">Agent Lead Collection Platform</p>
          </div>
        </div>

        {/* Glass card */}
        <div className="glass-card rounded-3xl p-6 space-y-3">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full rounded-2xl brand-gradient py-3.5 text-base font-semibold text-white shadow-lg shadow-red-300/40 hover:shadow-red-600/50 active:scale-[0.98] transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In
          </Link>
          <Link
            href="/agent/register"
            className="flex items-center justify-center gap-2 w-full rounded-2xl glass border border-red-200/60 py-3.5 text-base font-semibold text-red-800 hover:bg-red-50/60 active:scale-[0.98] transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Register as Agent
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '🔒', label: 'Secure Data' },
            { icon: '📍', label: 'Geo-verified' },
            { icon: '💰', label: 'Track Earnings' },
          ].map(({ icon, label }) => (
            <div key={label} className="glass rounded-2xl p-3 space-y-1">
              <span className="text-xl">{icon}</span>
              <p className="text-xs font-medium text-gray-600">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400">
          Powered by verified OTP authentication
        </p>
      </div>
    </main>
  );
}
