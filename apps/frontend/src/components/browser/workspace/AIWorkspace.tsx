import { useState } from "react";
import { Sparkles, FileText, Diamond, Hexagon, LayoutGrid, PanelRightClose, PanelRightOpen } from "lucide-react";
import HeroCard from "./HeroCard";
import QuickActions from "./QuickActions";
import PromptComposer from "./PromptComposer";
import RecentActivity from "./RecentActivity";
import { Sidebar } from "../../agent/Sidebar/Sidebar";

type RailMode = 'chat' | 'page' | 'docs' | 'memory' | 'tools';

export default function AIWorkspace() {
  const [mode, setMode] = useState<RailMode>('chat');
  const [showRail, setShowRail] = useState(true);

  const navItems = [
    { id: 'chat', label: 'Chat', icon: Sparkles },
    { id: 'page', label: 'Page', icon: FileText },
    { id: 'docs', label: 'Docs', icon: Diamond },
    { id: 'memory', label: 'Memory', icon: Hexagon },
  ] as const;

  return (
    <aside
      className="relative flex h-full w-full min-w-0 shrink-0 flex-row self-stretch overflow-hidden border-l border-[var(--color-hairline)] bg-white"
      data-name="ai-workspace"
    >
      {/* min-w-0 here is the key fix: it's what lets this pane actually
          shrink with the sidebar instead of being held open to the
          intrinsic width of whatever's inside it (HeroCard, etc). */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        {mode === 'chat' ? (
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 pb-8 pt-6">
            <div className="flex min-w-0 flex-col items-center gap-5">
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

            <div className="min-h-[20px] flex-1" />

            <div className="flex min-w-0 flex-col gap-5">
              <PromptComposer />
              <RecentActivity />
            </div>
          </div>
        ) : (
          <Sidebar activeTab={mode} />
        )}

        {/* Floating re-open button — only rendered when the rail is hidden */}
        {!showRail && (
          <button
            onClick={() => setShowRail(true)}
            aria-label="Open rail"
            aria-expanded={showRail}
            className="absolute right-4 top-5 z-10 rounded-md border border-[var(--color-hairline)] bg-white p-1.5 text-[var(--color-ink)] shadow-sm transition-colors hover:bg-[var(--color-subtle)]"
          >
            <PanelRightOpen size={16} />
          </button>
        )}
      </div>

      {/* Icon rail — narrowed from 72px to 60px, standard icon-rail width */}
      {showRail && (
        <div className="flex w-[60px] shrink-0 flex-col items-center gap-3 border-l border-[var(--color-hairline)] bg-[#fafafa] py-4">
          <button
            onClick={() => setShowRail(false)}
            aria-label="Close rail"
            aria-expanded={showRail}
            className="mb-1 self-end mr-1.5 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-[rgba(0,0,0,0.04)] hover:text-[var(--color-ink)]"
          >
            <PanelRightClose size={16} strokeWidth={2} />
          </button>

          {navItems.map((item) => {
            const isActive = mode === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                aria-pressed={isActive}
                aria-label={item.label}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-[var(--color-accent)]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`flex size-9 items-center justify-center rounded-[10px] ${isActive ? 'bg-[#eef5ff]' : ''}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[9px] font-medium tracking-wide">{item.label}</span>
              </button>
            );
          })}

          <div className="flex-1" />

          <button
            onClick={() => setMode('tools')}
            aria-pressed={mode === 'tools'}
            aria-label="Tools"
            className={`flex flex-col items-center gap-1 transition-colors ${
              mode === 'tools' ? 'text-[var(--color-accent)]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`flex size-9 items-center justify-center rounded-[10px] ${mode === 'tools' ? 'bg-[#eef5ff]' : ''}`}>
              <LayoutGrid size={18} strokeWidth={mode === 'tools' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-medium tracking-wide">Tools</span>
          </button>
        </div>
      )}
    </aside>
  );
}