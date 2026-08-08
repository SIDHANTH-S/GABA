/**
 * renderer/store/agent-store.ts
 * Agent execution state management
 * Dependencies: zustand, shared/types
 */

import { create } from 'zustand';
import type { TaskPlan, PlanStep } from '../shared/types';

interface AgentStore {
  activePlan: TaskPlan | null;
  
  setActivePlan: (plan: TaskPlan) => void;
  updateStep: (stepId: string, update: Partial<PlanStep>) => void;
  updatePlan: (update: Partial<TaskPlan>) => void;
  clearPlan: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  activePlan: null,
  
  setActivePlan: (plan) => set({ activePlan: plan }),
  
  updateStep: (stepId, update) => set((state) => {
    if (!state.activePlan) return state;
    
    return {
      activePlan: {
        ...state.activePlan,
        steps: state.activePlan.steps.map((s: PlanStep) =>
          s.id === stepId ? { ...s, ...update } : s
        ),
      },
    };
  }),

  updatePlan: (update) => set((state) => {
    if (!state.activePlan) return state;
    return {
      activePlan: {
        ...state.activePlan,
        ...update,
      },
    };
  }),
  
  clearPlan: () => set({ activePlan: null }),
}));
