export default function AgentPendingPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-white px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Approval Pending</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your registration is under review. You will receive an SMS once your account is approved.
            This usually takes 1-2 business days.
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-left">
          <p className="text-xs text-amber-800">
            <strong>What happens next?</strong><br />
            Our admin team will verify your details and approve your account. Once approved, you can log in
            and start collecting leads.
          </p>
        </div>
      </div>
    </main>
  );
}
