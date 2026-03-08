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
          <img src="/icons/logo-96.png" alt="Shine Build Hub" className="h-7 w-7 rounded-lg object-cover shadow-sm flex-shrink-0" />
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
