/**
 * renderer/components/CommandBar/CommandBar.tsx
 * Cmd+K command palette overlay
 */

import React, { useState } from 'react';
import { usePageStore } from '../../store/page-store';
import { useUIStore } from '../../store/ui-store';
import { useAgentStore } from '../../store/agent-store';
import type { TaskPlan } from '../../../shared/types';
import { CommandInput } from './CommandInput';
import { SuggestionList } from './SuggestionList';

export function CommandBar() {
  const isOpen = useUIStore((state) => state.commandBarOpen);
  const setCommandBarOpen = useUIStore((state) => state.setCommandBarOpen);
  const setHudVisible = useUIStore((state) => state.setHudVisible);
  const setActivePlan = useAgentStore((state) => state.setActivePlan);
  const close = () => setCommandBarOpen(false);
  const { model } = usePageStore();
  const [isLoading, setIsLoading] = useState(false);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (intent: string) => {
    setIsLoading(true);
    try {
      // @ts-ignore
      const plan: TaskPlan | undefined = await window.electronAPI?.runTask?.({ intent });
      if (plan) {
        setActivePlan(plan);
        setHudVisible(true);
      }
      close();
    } catch (err) {
      console.error('[CommandBar] Task failed:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuggestionSelect = (suggestion: string) => {
    handleSubmit(suggestion);
  };
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };
  
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-28"
      style={{ zIndex: 9999 }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-[#1a1a1a] border border-[#333333] rounded-xl shadow-2xl overflow-hidden animate-scale-in">
        <CommandInput onSubmit={handleSubmit} isLoading={isLoading} />
        
        {model && !isLoading && (
          <SuggestionList
            pageIntent={model.pageIntent}
            onSelect={handleSuggestionSelect}
          />
        )}
      </div>
    </div>
  );
}
