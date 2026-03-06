'use client';

import { useEffect, useState } from 'react';
import { getQualifiedLeadCount } from '@/app/(agent)/agent/actions';

export function AgentNotifier({ agentId }: { agentId: string }) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const key = `agent_qualified_${agentId}`;
    const lastSeen = parseInt(localStorage.getItem(key) ?? '0', 10);

    getQualifiedLeadCount(agentId).then((total) => {
      const newCount = Math.max(0, total - lastSeen);
      if (newCount > 0) {
        setMessage(`${newCount} of your lead${newCount > 1 ? 's have' : ' has'} been qualified!`);
        localStorage.setItem(key, String(total));
      }
    });
  }, [agentId]);

  if (!message) return null;

  return (
    <div className="fixed top-16 left-3 right-3 z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="glass-card rounded-2xl p-4 border-l-4 border-green-500 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Lead Qualified!</p>
            <p className="text-xs text-gray-600 mt-0.5">{message} Check your leads for incentive details.</p>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
