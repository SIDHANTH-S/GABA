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
    // Global keyboard listener fallback
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleCommandBar();
      } else if (e.key === 'Escape' && commandBarOpen) {
        dismissOverlays();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandBar, dismissOverlays, commandBarOpen]);

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
