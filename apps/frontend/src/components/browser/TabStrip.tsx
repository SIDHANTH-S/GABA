import { useBrowserStore } from "../../store/browser";
import { IconButton } from "./ui/primitives";

export default function TabStrip() {
  const { tabs, activeTabId } = useBrowserStore();

  return (
    <div className="flex h-[42px] w-full items-end justify-between px-[8px] bg-[var(--color-chrome)] shrink-0 border-b border-[var(--color-hairline)] [-webkit-app-region:drag]">
      {/* Left: Tabs */}
      <div className="flex items-end gap-[4px] overflow-x-auto flex-1 h-full">
        {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => window.browser?.activateTab(tab.id)}
            className={`
              group relative flex h-[28px] max-w-[200px] min-w-[120px] items-center gap-[8px] rounded-t-[6px] px-[12px] text-[12px] cursor-default select-none [-webkit-app-region:no-drag]
              ${isActive ? "bg-white text-black shadow-[0_-1px_3px_rgba(0,0,0,0.05)]" : "bg-white/40 text-[rgba(46,46,46,0.6)] hover:bg-white/60"}
            `}
          >
            {/* Favicon or Loading Spinner */}
            <div className="shrink-0 size-[14px] flex items-center justify-center">
              {tab.loading ? (
                <div className="size-[12px] animate-spin rounded-full border-[2px] border-[rgba(0,0,0,0.1)] border-t-[var(--color-accent)]" />
              ) : tab.favicon ? (
                <img src={tab.favicon} alt="" className="size-full object-contain" />
              ) : (
                <div className="size-full rounded-full bg-black/10" />
              )}
            </div>

            {/* Title */}
            <span className="flex-1 truncate leading-none">
              {tab.title || "Loading..."}
            </span>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.browser?.closeTab(tab.id);
              }}
              className="invisible group-hover:visible shrink-0 size-[16px] rounded-full hover:bg-black/10 flex items-center justify-center -mr-[4px]"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1l6 6M7 1L1 7" />
              </svg>
            </button>
          </div>
        );
      })}

      {/* New Tab Button */}
      <button
        onClick={() => window.browser?.openTab()}
        className="ml-[4px] mb-[2px] shrink-0 size-[24px] rounded-full bg-white/40 hover:bg-white/60 flex items-center justify-center text-[rgba(46,46,46,0.6)] hover:text-black [-webkit-app-region:no-drag]"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2v8M2 6h8" />
        </svg>
      </button>
      </div>

    </div>
  );
}
