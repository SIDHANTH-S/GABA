/**
 * agent-core/workflow-replayer.ts
 * Replays recorded workflows
 * Dependencies: shared/types, agent-core/executor
 */

import type { WorkflowRecording, TaskPlan, PlanStep } from '../shared/types';
import { generateId } from '../shared/utils';

/**
 * Convert workflow recording to TaskPlan for execution
 */
export function replayWorkflow(recording: WorkflowRecording): TaskPlan {
  const steps: PlanStep[] = recording.steps.map((recStep, index) => ({
    id: generateId('step'),
    sequence: index + 1,
    description: recStep.label || `${recStep.type} action`,
    action: {
      id: generateId('action'),
      type: recStep.type as any,
      payload: {
        selector: recStep.selector,
        value: recStep.value,
        url: recStep.url,
      },
      isDestructive: false,
      requiresUserConfirmation: false,
    },
    retryCount: 0,
    maxRetries: 3,
    status: 'pending',
  }));
  
  return {
    id: generateId('plan'),
    intent: `Replay workflow: ${recording.name}`,
    rawCommand: recording.trigger,
    steps,
    estimatedDuration: steps.length * 2000,
    requiresCheckpoint: false,
    context: {} as any, // No context needed for replay
    status: 'pending',
    currentStepIndex: 0,
    createdAt: Date.now(),
  };
}
