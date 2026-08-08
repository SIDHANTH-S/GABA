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
    
    runAgentTask: (intent: string) => Promise<any>;
    resolveCheckpoint: (id: string, approved: boolean) => void;
    getSemanticModel: () => Promise<any>;
    getMemory: (domain: string) => Promise<any>;

    onStateChange: (callback: (state: any) => void) => void;
    onSelectionChange: (callback: (selection: string) => void) => void;
    onContextChange: (callback: (context: any) => void) => void;
  };

  electronAPI?: {
    getSemanticModel: () => Promise<any>;
    onModelUpdated: (callback: (model: any) => void) => () => void;
    runTask: (payload: { intent: string }) => Promise<any>;
    onTaskProgress: (callback: (update: any) => void) => () => void;
    onCheckpointRequest: (callback: (payload: any) => void) => () => void;
    resolveCheckpoint: (payload: { id: string; approved: boolean }) => void;
    getUserProfile: () => Promise<any>;
    getDomainMemory: (domain: string) => Promise<any>;
    setUserProfile: (profile: any) => Promise<any>;
    startWorkflowRecording: (payload: { name: string; trigger: string }) => Promise<any>;
    stopWorkflowRecording: () => Promise<any>;
    replayWorkflow: (workflowId: string) => Promise<any>;
    listWorkflows: () => Promise<any>;
    toggleCommandBar: () => void;
    dismissOverlays: () => void;
    setOverlayVisible: (payload: { name: string; visible: boolean }) => void;
  };
}
