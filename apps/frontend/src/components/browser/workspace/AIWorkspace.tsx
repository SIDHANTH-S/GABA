import { useState } from "react";
import HeroCard from "./HeroCard";
import QuickActions from "./QuickActions";
import PromptComposer from "./PromptComposer";
import RecentActivity from "./RecentActivity";
import { Sidebar } from "../../agent/Sidebar/Sidebar";

export default function AIWorkspace() {
  const [mode, setMode] = useState<'assistant' | 'context'>('assistant');

  return (
    <aside
      className="relative flex w-full shrink-0 flex-col self-stretch bg-white border-l border-[var(--color-hairline)] overflow-hidden"
      data-name="ai-workspace"
    >
      <div className="flex h-[40px] w-full items-center justify-between px-[16px] border-b border-[var(--color-hairline)] bg-[var(--color-subtle)] shrink-0">
        <div className="flex items-center gap-[8px]">
          <span aria-hidden className="size-[6px] shrink-0 rounded-full bg-[var(--color-accent)]" />
          <span className="text-[11px] font-semibold text-[var(--color-ink)]">
            AI Workspace
          </span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[10px]">
          <button
            onClick={() => setMode('assistant')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              mode === 'assistant' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
            }`}
          >
            Assistant
          </button>
          <button
            onClick={() => setMode('context')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              mode === 'context' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
            }`}
          >
            Page Context
          </button>
        </div>
      </div>

      {mode === 'context' ? (
        <div className="flex-1 overflow-hidden">
          <Sidebar />
        </div>
      ) : (
        <div className="flex-1 flex flex-col px-[24px] pb-[32px] pt-[16px] overflow-y-auto">
          <div className="flex flex-col items-center gap-[20px]">
            <HeroCard />
            <div
              className="text-center text-[20px] font-[590] leading-[26px] tracking-[0.35px] text-[var(--color-ink)]"
              style={{ fontVariationSettings: '"wdth" 100' }}
            >
              <p className="mb-0">What would you like to</p>
              <p>accomplish today?</p>
            </div>
            <QuickActions />
          </div>

          <div className="flex-1 min-h-[20px]" />

          <div className="flex flex-col gap-[20px]">
            <PromptComposer />
            <RecentActivity />
          </div>
        </div>
      )}
    </aside>
  );
}
