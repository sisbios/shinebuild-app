import { requireApprovedAgent } from '@/lib/session';
import { AgentNav } from './AgentNav';

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  await requireApprovedAgent();

  return (
    <div className="flex min-h-svh flex-col bg-gray-50">
      <div className="flex-1 pb-20">{children}</div>
      <AgentNav />
    </div>
  );
}
