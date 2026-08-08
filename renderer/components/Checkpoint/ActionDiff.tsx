import React from 'react';
import type { AgentAction } from '../../../shared/types';

interface ActionDiffProps {
  action: AgentAction;
}

export function ActionDiff({ action }: ActionDiffProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4 space-y-2">
      <h4 className="text-sm font-medium text-gray-300">Action Details</h4>

      <div className="space-y-1 text-xs">
        <div className="flex gap-2">
          <span className="text-gray-500 w-20">Type:</span>
          <span className="text-white">{action.type}</span>
        </div>

        {action.payload.selector && (
          <div className="flex gap-2">
            <span className="text-gray-500 w-20">Target:</span>
            <span className="text-white truncate">{action.payload.selector}</span>
          </div>
        )}

        {action.payload.value && (
          <div className="flex gap-2">
            <span className="text-gray-500 w-20">Value:</span>
            <span className="text-white">{maskSensitiveValue(action.payload.value)}</span>
          </div>
        )}

        {action.payload.url && (
          <div className="flex gap-2">
            <span className="text-gray-500 w-20">URL:</span>
            <span className="text-white truncate">{action.payload.url}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function maskSensitiveValue(value: string): string {
  const val = String(value);
  if (/^\d{13,19}$/.test(val.replace(/\s/g, ''))) return `**** **** **** ${val.slice(-4)}`;
  if (/cvv|password/i.test(val)) return '******';
  return val;
}
