/**
 * renderer/components/HUD/TaskProgress.tsx
 * Progress bar and step counter
 */

import React from 'react';
import type { TaskPlan } from '../../../shared/types';

interface TaskProgressProps {
  plan: TaskPlan;
}

export function TaskProgress({ plan }: TaskProgressProps) {
  const completedSteps = plan.steps.filter(s => s.status === 'success').length;
  const totalSteps = plan.steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  const currentStep = plan.steps[plan.currentStepIndex];
  const label = totalSteps > 0
    ? `Step ${Math.min(plan.currentStepIndex + 1, totalSteps)} of ${totalSteps}`
    : plan.status === 'failed'
      ? 'No executable steps'
      : 'Preparing plan';
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">
          {label}
        </span>
        <span className="text-gray-500">{Math.round(progress)}%</span>
      </div>
      
      <div className="h-0.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {currentStep && (
        <p className="text-xs text-gray-400 truncate">
          {currentStep.description}
        </p>
      )}
    </div>
  );
}
