import { useState } from "react";
import { Sparkles, FileText, Diamond, Hexagon, LayoutGrid, PanelRightClose, PanelRightOpen, X } from "lucide-react";
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
      className="relative flex flex-row w-full h-full shrink-0 self-stretch bg-white border-l border-[var(--color-hairline)] overflow-hidden"
      data-name="ai-workspace"
    >
      <div className="flex-1 flex flex-col overflow-hidden bg-white relative">
        {mode === 'chat' ? (
          <div className="flex-1 flex flex-col px-[24px] pb-[32px] pt-[24px] overflow-y-auto">
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
        ) : (
          <Sidebar activeTab={mode} />
        )}
        
        {/* Floating button to re-open rail when hidden */}
        {!showRail && (
          <button
            onClick={() => setShowRail(true)}
            className="absolute top-[20px] right-[16px] z-10 p-1.5 rounded-[6px] bg-white border border-[var(--color-hairline)] text-[var(--color-ink)] shadow-sm hover:bg-[var(--color-subtle)] transition-colors"
            title="Open Rail"
          >
            <PanelRightOpen size={16} />
          </button>
        )}
      </div>

      {/* Vertical Icon Rail */}
      {showRail && (
        <div className="w-[72px] shrink-0 border-l border-[var(--color-hairline)] bg-[#fafafa] flex flex-col items-center py-[20px] gap-[16px] relative">
          <div className="flex flex-col gap-2 w-full px-2 items-center mb-2">
            <button
              onClick={() => setShowRail(false)}
              className="p-1.5 rounded-[6px] text-gray-400 hover:text-[var(--color-ink)] hover:bg-[rgba(0,0,0,0.04)] transition-colors self-end mr-1"
              title="Close Rail"
            >
              <PanelRightClose size={16} strokeWidth={2} />
            </button>
          </div>
          
          {navItems.map((item) => {
          const isActive = mode === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`flex flex-col items-center gap-[6px] transition-colors ${
                isActive ? 'text-[var(--color-accent)]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`flex items-center justify-center size-[40px] rounded-[12px] ${isActive ? 'bg-[#eef5ff]' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
        
        <div className="flex-1" />
        
        <button
          onClick={() => setMode('tools')}
          className={`flex flex-col items-center gap-[6px] transition-colors ${
            mode === 'tools' ? 'text-[var(--color-accent)]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className={`flex items-center justify-center size-[40px] rounded-[12px] ${mode === 'tools' ? 'bg-[#eef5ff]' : ''}`}>
            <LayoutGrid size={20} strokeWidth={mode === 'tools' ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-medium tracking-wide">Tools</span>
        </button>
      </div>
      )}
    </aside>
  );
}
