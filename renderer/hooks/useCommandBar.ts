/**
 * renderer/hooks/useCommandBar.ts
 * Hook for command bar state and IPC
 * Dependencies: react, renderer/store
 */

import { useEffect, useCallback } from 'react';
import { useUIStore } from '../store/ui-store';

export function useCommandBar() {
  const { commandBarOpen, setCommandBarOpen, toggleCommandBar, dismissOverlays } = useUIStore();
  
  useEffect(() => {
    // Listen for Ctrl+K toggle from Electron global shortcut via preload
    // @ts-ignore - window.electronAPI injected via preload
    const cleanup = window.electronAPI?.onToggleCommandBar?.(() => {
      toggleCommandBar();
    });
    
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [toggleCommandBar]);
  
  useEffect(() => {
    // Listen for Escape dismiss from Electron global shortcut via preload
    // @ts-ignore
    const cleanup = window.electronAPI?.onDismissOverlays?.(() => {
      dismissOverlays();
    });
    
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [dismissOverlays]);

  useEffect(() => {
    // Notify main process to hide/show browser content view when command bar opens/closes
    // @ts-ignore
    window.electronAPI?.setOverlayVisible?.(commandBarOpen);
  }, [commandBarOpen]);

  const open = useCallback(() => setCommandBarOpen(true), [setCommandBarOpen]);
  const close = useCallback(() => setCommandBarOpen(false), [setCommandBarOpen]);
  
  return {
    isOpen: commandBarOpen,
    open,
    close,
    toggle: toggleCommandBar,
  };
}
