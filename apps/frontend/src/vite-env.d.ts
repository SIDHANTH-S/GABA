/// <reference types="vite/client" />

interface Window {
  browser: {
    navigate: (url: string) => void;
    reload: () => void;
    stop: () => void;
    openTab: (url?: string) => void;
    closeTab: (id: string) => void;
    activateTab: (id: string) => void;
    getState: () => void;
    execute: (command: any) => void;
    inspect: () => void;
    goBack: () => void;
    goForward: () => void;
    
    setBounds: (bounds: { x: number, y: number, width: number, height: number }) => void;
    setWorkspaceWidth: (width: number, save?: boolean) => void;
    toggleWorkspace: () => void;
    
    onStateChange: (callback: (state: any) => void) => void;
    onSelectionChange: (callback: (selection: string) => void) => void;
    onContextChange: (callback: (context: any) => void) => void;
  };
}
