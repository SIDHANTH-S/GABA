import { useState, useEffect } from "react";
import { useBrowserStore } from "../../store/browser";
import {
  BackIcon,
  NextIcon,
  RefreshIcon,
  CopyLinkIcon,
  SettingsIcon,
} from "./icons";
import { IconButton } from "./ui/primitives";

/** Top chrome: navigation, address, and window controls. */
export default function Toolbar() {
  const { activeTabId, tabs, navigation } = useBrowserStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const currentUrl = activeTab?.url || "newtab";

  const [urlInput, setUrlInput] = useState(currentUrl);
  
  // Sync local input when the actual URL changes, but not while user is typing
  useEffect(() => {
    setUrlInput(currentUrl);
  }, [currentUrl]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && window.browser) {
      let finalUrl = urlInput;
      if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        finalUrl = "https://" + finalUrl;
      }
      window.browser.navigate(finalUrl);
    }
  };

  return (
    <div className="w-full shrink-0 h-[44px] bg-[var(--color-chrome)] pb-[6px]">
      <div className="flex items-center h-full px-[12px] gap-[20px]">
        
        {/* Left: Navigation */}
        <div className="flex items-center gap-[8px] [-webkit-app-region:no-drag]">
          <IconButton label="Back" onClick={() => window.browser?.goBack()}>
            <BackIcon />
          </IconButton>
          <IconButton label="Forward" onClick={() => window.browser?.goForward()}>
            <NextIcon />
          </IconButton>
          <IconButton label="Reload" onClick={() => window.browser?.reload()}>
            <RefreshIcon />
          </IconButton>
        </div>

        {/* Center: Omnibox */}
        <div className="flex-1 flex items-center h-full [-webkit-app-region:no-drag]">
          <div className="group flex items-center w-full bg-white/85 backdrop-blur-xl border border-neutral-200 hover:border-neutral-300 focus-within:border-blue-500 focus-within:shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition-all rounded-[8px] px-[12px] h-[36px] gap-[8px]">
            {/* Leading Icon (Security/Page) */}
            <div className="shrink-0 text-neutral-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>

            {/* URL Input */}
            <input
              type="text"
              className="flex-1 min-w-0 text-[13px] leading-[normal] text-[#2f2f2f] bg-transparent outline-none placeholder:text-[rgba(46,46,46,0.4)]"
              style={{ fontFamily: "var(--font-ui)", fontWeight: 500 }}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search, navigate, or ask AI..."
            />

            {/* Trailing Icons (AI / Share) */}
            <div className="shrink-0 flex items-center gap-[6px] text-neutral-400 group-focus-within:text-neutral-600 transition-colors">
              <button className="hover:bg-black/5 rounded-md p-[4px] hover:text-blue-600 transition-colors flex items-center gap-[4px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
                <span className="text-[11px] font-[600] tracking-wide">Ask AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Page Actions */}
        <div className="flex items-center gap-[8px] [-webkit-app-region:no-drag]">
          <IconButton label="Copy link">
            <CopyLinkIcon />
          </IconButton>
          <IconButton label="Page settings">
            <SettingsIcon />
          </IconButton>
        </div>

      </div>
    </div>
  );
}
