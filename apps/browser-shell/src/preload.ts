import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('browser', {
  navigate: (url: string) => ipcRenderer.send('browser:navigate', url),
  reload: () => ipcRenderer.send('browser:reload'),
  stop: () => ipcRenderer.send('browser:stop'),
  openTab: (url?: string) => ipcRenderer.send('browser:openTab', url),
  closeTab: (id: string) => ipcRenderer.send('browser:closeTab', id),
  activateTab: (id: string) => ipcRenderer.send('browser:activateTab', id),
  getState: () => ipcRenderer.send('browser:getState'),
  execute: (command: any) => ipcRenderer.send('browser:execute', command),
  inspect: () => ipcRenderer.send('browser:inspect'),
  goBack: () => ipcRenderer.send('browser:goBack'),
  goForward: () => ipcRenderer.send('browser:goForward'),
  
  // UI-specific bindings
  setBounds: (bounds: { x: number, y: number, width: number, height: number }) => 
    ipcRenderer.send('browser:setBounds', bounds),
  setWorkspaceWidth: (width: number, save: boolean = false) => ipcRenderer.send('browser:setWorkspaceWidth', width, save),
  toggleWorkspace: () => ipcRenderer.send('browser:toggleWorkspace'),

  // AI Agent & Execution bindings
  runAgentTask: (intent: string) => ipcRenderer.invoke('agent:run-task', { intent }),
  resolveCheckpoint: (id: string, approved: boolean) => ipcRenderer.send('agent:checkpoint-resolve', { id, approved }),
  getSemanticModel: () => ipcRenderer.invoke('page:get-semantic-model'),
  getMemory: (domain: string) => ipcRenderer.invoke('memory:get-domain', domain),

  // Event subscriptions
  onStateChange: (callback: (state: any) => void) => {
    ipcRenderer.on('browser:state-update', (event, state) => callback(state));
  },
  onSelectionChange: (callback: (selection: string) => void) => {
    ipcRenderer.on('browser:selection-update', (event, selection) => callback(selection));
  },
  onContextChange: (callback: (context: any) => void) => {
    ipcRenderer.on('browser:context-update', (event, context) => callback(context));
  },
});

contextBridge.exposeInMainWorld('electronAPI', {
  // Page understanding
  getSemanticModel: () => ipcRenderer.invoke('page:get-semantic-model'),
  onModelUpdated: (callback: (model: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('page:model-updated', handler);
    return () => ipcRenderer.removeListener('page:model-updated', handler);
  },

  // Agent lifecycle
  runTask: (payload: { intent: string }) => ipcRenderer.invoke('agent:run-task', payload),
  onTaskProgress: (callback: (update: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('agent:task-progress', handler);
    return () => ipcRenderer.removeListener('agent:task-progress', handler);
  },
  onCheckpointRequest: (callback: (payload: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('agent:checkpoint-request', handler);
    return () => ipcRenderer.removeListener('agent:checkpoint-request', handler);
  },
  resolveCheckpoint: (payload: { id: string; approved: boolean }) => ipcRenderer.send('agent:checkpoint-resolve', payload),

  // Memory operations
  getUserProfile: () => ipcRenderer.invoke('memory:get-profile'),
  getDomainMemory: (domain: string) => ipcRenderer.invoke('memory:get-domain', domain),
  setUserProfile: (profile: any) => ipcRenderer.invoke('memory:set-profile', profile),

  // Workflow operations
  startWorkflowRecording: (payload: { name: string; trigger: string }) => ipcRenderer.invoke('workflow:start-recording', payload),
  stopWorkflowRecording: () => ipcRenderer.invoke('workflow:stop-recording'),
  replayWorkflow: (workflowId: string) => ipcRenderer.invoke('workflow:replay', workflowId),
  listWorkflows: () => ipcRenderer.invoke('workflow:list'),

  // UI overlay controls
  toggleCommandBar: () => ipcRenderer.send('ui:toggle-command-bar'),
  dismissOverlays: () => ipcRenderer.send('ui:dismiss-overlays'),
  setOverlayVisible: (payload: { name: string; visible: boolean }) => ipcRenderer.send('ui:set-overlay-visible', payload),
});


