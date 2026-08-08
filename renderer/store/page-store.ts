/**
 * renderer/store/page-store.ts
 * Page context state management
 * Dependencies: zustand, shared/types
 */

import { create } from 'zustand';
import type { SemanticPageModel } from '../../shared/types';

interface PageStore {
  model: SemanticPageModel | null;
  loading: boolean;
  
  setModel: (model: SemanticPageModel) => void;
  setLoading: (loading: boolean) => void;
}

export const usePageStore = create<PageStore>((set) => ({
  model: null,
  loading: false,
  
  setModel: (model) => set({ model, loading: false }),
  setLoading: (loading) => set({ loading }),
}));
