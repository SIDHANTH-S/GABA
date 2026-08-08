import React from 'react';
import { useCheckpoint } from '../../hooks/useCheckpoint';
import { ActionDiff } from './ActionDiff';

export function CheckpointModal() {
  const { isOpen, payload, approve, cancel } = useCheckpoint();

  if (!isOpen || !payload) return null;

  const riskColors = {
    low: 'border-yellow-500',
    medium: 'border-orange-500',
    high: 'border-red-500',
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
      style={{ zIndex: 10000 }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`w-full max-w-md bg-[#111111] border ${riskColors[payload.riskLevel]} rounded-xl p-6 shadow-2xl`}>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Action Required</h2>
            <p className="text-sm text-gray-400 mt-1">Review this action before proceeding.</p>
          </div>

          <div className="bg-[#1a1a1a] rounded-md border border-[#2a2a2a] p-3">
            <p className="text-sm text-white">{payload.stepDescription}</p>
          </div>

          <ActionDiff action={payload.action} />

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Risk Level:</span>
            <span className={`px-2 py-1 rounded ${
              payload.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
              payload.riskLevel === 'medium' ? 'bg-orange-500/20 text-orange-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {payload.riskLevel.toUpperCase()}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={cancel}
              className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-gray-500 text-gray-300 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={approve}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Approve and Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
