/**
 * renderer/hooks/usePageContext.ts
 * Hook for page semantic model subscription
 * Dependencies: react, renderer/store
 */

import { useEffect } from 'react';
import { usePageStore } from '../store/page-store';
import type { SemanticPageModel } from '../../shared/types';

export function usePageContext() {
  const { model, setModel, setLoading } = usePageStore();
  
  useEffect(() => {
    // Subscribe to page model updates from the Electron main process
    // @ts-ignore - window.electronAPI injected via preload
    const cleanup = window.electronAPI?.onPageUpdate?.((pageModel: SemanticPageModel) => {
      console.log('[usePageContext] Received page model update:', pageModel?.url);
      setModel(pageModel);
    });
    
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [setModel]);
  
  async function refreshModel() {
    setLoading(true);
    try {
      // @ts-ignore
      const pageModel = await window.electronAPI?.getSemanticModel?.();
      if (pageModel) setModel(pageModel);
    } catch (err) {
      console.error('[usePageContext] Failed to refresh model:', err);
    } finally {
      setLoading(false);
    }
  }
  
  return {
    model,
    refreshModel,
  };
}
