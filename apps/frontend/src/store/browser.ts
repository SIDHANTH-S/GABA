import { useSyncExternalStore } from 'react';

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  loading: boolean;
  security: {
    secure: boolean;
  };
}

export interface BrowserState {
  activeTabId: string | null;
  tabs: BrowserTab[];
  downloads: any[];
  window: {
    isLoading: boolean;
    focused: boolean;
    workspaceWidth: number;
    savedWorkspaceWidth: number;
    workspaceVisible: boolean;
  };
  navigation: {
    canGoBack: boolean;
    canGoForward: boolean;
  };
}

let cachedState: BrowserState = {
  activeTabId: null,
  tabs: [],
  downloads: [],
  window: { isLoading: false, focused: true, workspaceWidth: 380, savedWorkspaceWidth: 380, workspaceVisible: true },
  navigation: { canGoBack: false, canGoForward: false },
};

const listeners = new Set<() => void>();

// Subscribe to IPC state changes
if (typeof window !== 'undefined' && window.browser) {
  window.browser.onStateChange((newState: BrowserState) => {
    cachedState = newState;
    listeners.forEach((listener) => listener());
  });
  
  // Request initial state on boot
  window.browser.getState();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return cachedState;
}

export function useBrowserStore() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
