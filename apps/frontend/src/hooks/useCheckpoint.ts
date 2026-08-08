/**
 * renderer/hooks/useCheckpoint.ts
 * Hook for checkpoint modal state
 * Dependencies: react, shared/types
 */

import { useState, useEffect } from 'react';
import type { CheckpointPayload } from '../shared/types';

export function useCheckpoint() {
  const [isOpen, setIsOpen] = useState(false);
  const [payload, setPayload] = useState<CheckpointPayload | null>(null);
  
  useEffect(() => {
    // Listen for checkpoint requests
    // @ts-ignore
    const handler = (_: unknown, data: CheckpointPayload) => {
      setPayload(data);
      setIsOpen(true);
    };
    
    // @ts-ignore
    window.electronAPI?.onCheckpointRequest?.(handler);
    
    return () => {
      // @ts-ignore
      window.electronAPI?.offCheckpointRequest?.(handler);
    };
  }, []);

  useEffect(() => {
    // Notify main process to hide/show browser content view when checkpoint modal opens/closes
    // @ts-ignore
    window.electronAPI?.setOverlayVisible?.(isOpen);
  }, [isOpen]);
  
  async function resolve(approved: boolean) {
    if (!payload) return;
    
    try {
      // @ts-ignore
      await window.electronAPI?.resolveCheckpoint?.({
        id: payload.id,
        approved,
      });
      
      setIsOpen(false);
      setPayload(null);
    } catch (err) {
      console.error('[useCheckpoint] Failed to resolve:', err);
    }
  }
  
  return {
    isOpen,
    payload,
    approve: () => resolve(true),
    cancel: () => resolve(false),
  };
}
