/**
 * renderer/hooks/useAgent.ts
 * Hook for agent task execution
 * Dependencies: react, renderer/store, shared/types
 */

import { useEffect } from 'react';
import { useAgentStore } from '../store/agent-store';
import { useUIStore } from '../store/ui-store';
import type { TaskPlan, TaskPlanUpdate } from '../../shared/types';

export function useAgent() {
  const { activePlan, setActivePlan, updateStep, updatePlan, clearPlan } = useAgentStore();
  const { setHudVisible } = useUIStore();
  
  useEffect(() => {
    // Subscribe to task progress updates via preload IPC
    // @ts-ignore - window.electronAPI injected via preload
    const cleanup = window.electronAPI?.onTaskProgress?.((update: TaskPlanUpdate) => {
      // Update step status
      updateStep(update.stepId, { status: update.stepStatus });
      updatePlan({
        status: update.planStatus,
        currentStepIndex: update.currentStepIndex,
      });

      if (update.planStatus === 'complete' || update.planStatus === 'failed') {
        setTimeout(() => setHudVisible(false), 2000);
      } else {
        setHudVisible(true);
      }
    });
    
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [updatePlan, updateStep, setHudVisible]);
  
  async function runTask(intent: string): Promise<TaskPlan | null> {
    try {
      // @ts-ignore
      const plan = await window.electronAPI?.runTask?.({ intent });
      if (plan) {
        setActivePlan(plan);
        setHudVisible(true);
      }
      return plan;
    } catch (err) {
      console.error('[useAgent] Failed to run task:', err);
      const failedPlan: TaskPlan = {
        id: `renderer_failed_${Date.now()}`,
        intent,
        rawCommand: intent,
        steps: [],
        estimatedDuration: 0,
        requiresCheckpoint: false,
        context: null as any,
        status: 'failed',
        currentStepIndex: 0,
        createdAt: Date.now(),
        error: err instanceof Error ? err.message : String(err),
      };
      setActivePlan(failedPlan);
      setHudVisible(true);
      return null;
    }
  }
  
  // Compute agentState from activePlan
  const agentState = activePlan ? {
    status: activePlan.status,
    currentStep: activePlan.currentStepIndex + 1,
    totalSteps: activePlan.steps.length,
    stepDescription: activePlan.steps[activePlan.currentStepIndex]?.description || '',
    progress: activePlan.steps.length > 0
      ? ((activePlan.currentStepIndex + 1) / activePlan.steps.length) * 100
      : activePlan.status === 'complete' ? 100 : 0,
  } : {
    status: 'idle',
    currentStep: 0,
    totalSteps: 0,
    stepDescription: '',
    progress: 0,
  };

  return {
    agentState,
    submitTask: runTask,
    cancelTask: clearPlan,
  };
}
