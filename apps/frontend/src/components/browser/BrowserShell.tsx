
/**
 * The AI-native browser window IS the application root. It fills the viewport:
 * toolbar chrome on top, and a content region below split into the Chromium
 * WebView (flex-1) and the AI Workspace rail (fixed width). No desktop wrapper,
 * no page padding, no white card behind the WebView — the content touches the
 * chrome edges directly. Collapses to a stacked layout below ~1000px.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import Toolbar from "./Toolbar";
import TabStrip from "./TabStrip";
import WebView from "./WebView";
import AIWorkspace from "./workspace/AIWorkspace";
import { CommandBar } from "../agent/CommandBar/CommandBar";
import { HUD } from "../agent/HUD/HUD";
import { CheckpointModal } from "../agent/Checkpoint/CheckpointModal";
import { useBrowserStore } from "../../store/browser";
import { useAgent } from "../../hooks/useAgent";
import { useCommandBar } from "../../hooks/useCommandBar";

export default function BrowserShell() {
  useAgent();
  useCommandBar();
  const { window: { workspaceWidth, workspaceVisible, savedWorkspaceWidth } } = useBrowserStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef<number | null>(null);
  
  // Track the actual width locally so we don't depend on the store during animation
  const widthRef = useRef(workspaceWidth);
  useEffect(() => {
    widthRef.current = workspaceWidth;
  }, [workspaceWidth]);

  useEffect(() => {
    if (isDragging) return;

    const targetWidth = workspaceVisible ? savedWorkspaceWidth : 0;
    
    console.log(`[BrowserShell] Animating? current=${widthRef.current}, target=${targetWidth}, visible=${workspaceVisible}`);
    
    // Allow 1px precision before animating to avoid infinite micro-loops
    if (Math.abs(widthRef.current - targetWidth) < 1) {
      console.log(`[BrowserShell] No animation needed. Snapping to target.`);
      if (widthRef.current !== targetWidth) {
        window.browser?.setWorkspaceWidth(targetWidth);
      }
      return;
    }

    console.log(`[BrowserShell] Starting animation to ${targetWidth}...`);
    let start: number | null = null;
    const duration = 180; // ms
    const initialWidth = widthRef.current;

    // Cubic bezier ease-out approximation
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (time: number) => {
      if (start === null) start = time;
      const elapsed = Math.max(0, time - start);
      const progress = Math.min(elapsed / duration, 1);
      
      const easedProgress = easeOutCubic(progress);
      const newWidth = initialWidth + (targetWidth - initialWidth) * easedProgress;
      
      window.browser?.setWorkspaceWidth(newWidth);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we hit the exact target width at the end
        if (newWidth !== targetWidth) {
          window.browser?.setWorkspaceWidth(targetWidth);
        }
      }
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [workspaceVisible, savedWorkspaceWidth, isDragging]);

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
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--color-chrome)] backdrop-blur-[26px]">
      <TabStrip />
      <Toolbar />

      <div className="relative flex min-h-px w-full flex-1 items-stretch">
        <WebView />
        
        {/* Draggable Splitter */}
        <div 
          className={`relative z-10 w-[12px] -mx-[4px] cursor-col-resize select-none shrink-0 ${workspaceWidth < 5 ? 'hidden' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
        >
          {/* Visible line centered inside the hit area */}
          <div className={`
            absolute left-1/2 top-0 bottom-0 -translate-x-1/2 transition-all duration-150
            ${isDragging 
              ? 'w-[3px] bg-[var(--color-accent)] opacity-40' 
              : isHovered
                ? 'w-[2px] bg-[var(--color-accent)]'
                : 'w-[1px] bg-[rgba(0,0,0,0.08)]'}
          `} />
        </div>
        
        <div style={{ width: workspaceWidth }} className="shrink-0 flex">
          <AIWorkspace />
        </div>
      </div>

      <CommandBar />
      <HUD />
      <CheckpointModal />
    </div>
  );
}
