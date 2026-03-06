import { requireApprovedAgent } from '@/lib/session';
import { AgentNav } from './AgentNav';
import { LogoutButton } from '@/components/shared/LogoutButton';
import { AgentNotifier } from '@/components/shared/AgentNotifier';

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireApprovedAgent();

  return (
    <div className="flex min-h-svh flex-col bg-mesh">
      {/* Fixed top header */}
      <header className="glass-header fixed top-0 inset-x-0 z-40 h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg brand-gradient flex items-center justify-center shadow-sm">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900">Shine Build Hub</span>
        </div>
        <LogoutButton />
      </header>

      {/* Notification popup */}
      <AgentNotifier agentId={session.uid} />

      {/* Page content: top padding for header, bottom for nav */}
      <div className="flex-1 pt-14 pb-24">
        {children}
      </div>

      <AgentNav />
    </div>
  );
}
