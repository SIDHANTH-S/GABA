/**
 * renderer/store/ui-store.ts
 * UI state management with Zustand
 * Dependencies: zustand
 */

import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  commandBarOpen: boolean;
  hudVisible: boolean;
  currentTab: 'entities' | 'actions' | 'memory' | 'documents';
  
  setSidebarOpen: (open: boolean) => void;
  setCommandBarOpen: (open: boolean) => void;
  setHudVisible: (visible: boolean) => void;
  setCurrentTab: (tab: UIStore['currentTab']) => void;
  toggleCommandBar: () => void;
  dismissOverlays: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  commandBarOpen: false,
  hudVisible: false,
  currentTab: 'entities',
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCommandBarOpen: (open) => set({ commandBarOpen: open }),
  setHudVisible: (visible) => set({ hudVisible: visible }),
  setCurrentTab: (tab) => set({ currentTab: tab }),
  
  toggleCommandBar: () => set((state) => ({ commandBarOpen: !state.commandBarOpen })),
  
  dismissOverlays: () => set({
    commandBarOpen: false,
    hudVisible: false,
  }),
}));
