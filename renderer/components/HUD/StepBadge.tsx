/**
 * renderer/components/HUD/StepBadge.tsx
 * Individual step status indicator
 */

import React from 'react';
import type { StepStatus } from '../../../shared/types';

interface StepBadgeProps {
  status: StepStatus;
  label: string;
}

export function StepBadge({ status, label }: StepBadgeProps) {
  const statusColors = {
    pending: 'bg-gray-600',
    running: 'bg-blue-500 animate-pulse',
    success: 'bg-green-500',
    failed: 'bg-red-500',
    skipped: 'bg-gray-500',
  };
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      <span className="text-gray-400 truncate">{label}</span>
    </div>
  );
}
