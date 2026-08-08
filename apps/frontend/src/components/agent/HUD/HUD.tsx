import React, { useEffect } from 'react';
import { useAgentStore } from '../../../store/agent-store';
import { useUIStore } from '../../../store/ui-store';
import { TaskProgress } from './TaskProgress';

export function HUD() {
  const { activePlan } = useAgentStore();
  const { hudVisible, setHudVisible } = useUIStore();

  useEffect(() => {
    if (activePlan?.status === 'running' || activePlan?.status === 'pending') {
      setHudVisible(true);
    } else if (activePlan?.status === 'complete' || activePlan?.status === 'failed') {
      const timeout = setTimeout(() => setHudVisible(false), 2400);
      return () => clearTimeout(timeout);
    }
  }, [activePlan?.status, setHudVisible]);

  if (!hudVisible || !activePlan) return null;

  const statusColors = {
    pending: 'border-gray-700',
    running: 'border-indigo-500',
    complete: 'border-green-500',
    failed: 'border-red-500',
    paused: 'border-yellow-500',
    cancelled: 'border-gray-500',
  };

  const statusKey = (activePlan.status || 'pending') as keyof typeof statusColors;

  return (
    <div
      className={`fixed bottom-6 right-6 w-72 bg-black/85 backdrop-blur-sm border ${statusColors[statusKey] || statusColors.pending} rounded-xl p-4 shadow-2xl`}
      style={{ zIndex: 8888 }}
      role="status"
      aria-live="polite"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">
            {activePlan.status === 'complete'
              ? 'Complete'
              : activePlan.status === 'failed'
                ? 'Failed'
                : activePlan.status === 'pending'
                  ? 'Planning...'
                  : 'Processing...'}
          </h3>
          <button
            onClick={() => setHudVisible(false)}
            className="text-gray-500 hover:text-gray-300 text-xs"
          >
            Dismiss
          </button>
        </div>

        <TaskProgress plan={activePlan} />

        {activePlan.error && (
          <p className="text-xs text-red-400 leading-5">{activePlan.error}</p>
        )}
      </div>
    </div>
  );
}
