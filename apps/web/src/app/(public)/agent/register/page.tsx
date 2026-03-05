import { AgentRegisterClient } from './AgentRegisterClient';

export default function AgentRegisterPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-white px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">Join as Agent</h1>
          <p className="text-sm text-gray-500">Create your account to start collecting leads</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <AgentRegisterClient />
        </div>
      </div>
    </main>
  );
}
