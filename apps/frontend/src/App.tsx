import { useEffect, useState, useCallback, useRef } from "react";
import BrowserShell from "./components/browser/BrowserShell";
import Toolbar from "./components/browser/Toolbar";
import TabStrip from "./components/browser/TabStrip";
import AIWorkspace from "./components/browser/workspace/AIWorkspace";
import { CommandBar } from "./components/agent/CommandBar/CommandBar";
import { HUD } from "./components/agent/HUD/HUD";
import { CheckpointModal } from "./components/agent/Checkpoint/CheckpointModal";
import { useAgent } from "./hooks/useAgent";
import { useCommandBar } from "./hooks/useCommandBar";
import { useBrowserStore } from "./store/browser";
import StartPage from "./components/browser/StartPage";

function WorkspaceWithSplitter() {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newWidth = window.innerWidth - e.clientX;
    const constrainedWidth = Math.max(250, Math.min(newWidth, 800));
    window.browser?.setWorkspaceWidth(constrainedWidth, true);
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [isDragging]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* Draggable Splitter */}
      <div 
        className="relative z-10 w-[12px] -ml-[6px] mr-[2px] cursor-col-resize select-none shrink-0"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        <div className={`
          absolute left-1/2 top-0 bottom-0 -translate-x-1/2 transition-all duration-150
          ${isDragging 
            ? 'w-[3px] bg-[var(--color-accent)] opacity-40' 
            : isHovered
              ? 'w-[2px] bg-[var(--color-accent)]'
              : 'w-[1px] bg-[rgba(0,0,0,0.08)]'}
        `} />
      </div>
      
      <div className="flex-1 flex min-w-0">
        <AIWorkspace />
      </div>
    </div>
  );
}

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get("view");

  useAgent();
  useCommandBar();

  if (view === "chrome") {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--color-chrome)] backdrop-blur-[26px]">
        <TabStrip />
        <Toolbar />
      </div>
    );
  }

  if (view === "workspace") {
    return <WorkspaceWithSplitter />;
  }

  if (view === "overlay") {
    return (
      <div className="flex h-screen w-screen bg-transparent pointer-events-none">
        <div className="pointer-events-auto w-full h-full">
          <CommandBar />
          <HUD />
          <CheckpointModal />
        </div>
      </div>
    );
  }

  if (view === "newtab") {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <StartPage />
      </div>
    );
  }

  // Fallback for full shell (e.g. older implementation)
  return <BrowserShell />;
}
