/**
 * electron-main/preload.ts
 * Exposes IPC channels safely to renderer via contextBridge
 */

import { contextBridge, ipcRenderer } from 'electron';

// Self-contained channel constants to ensure zero-dependency bundle execution in Electron preload sandbox
const CHANNELS = {
  PAGE_GET_SEMANTIC_MODEL: 'page:get-semantic-model',
  PAGE_SUBSCRIBE_UPDATES: 'page:subscribe-updates',
  PAGE_NAVIGATE: 'page:navigate',
  AGENT_RUN_TASK: 'agent:run-task',
  AGENT_TASK_PROGRESS: 'agent:task-progress',
  AGENT_CHECKPOINT_REQUEST: 'agent:checkpoint-request',
  AGENT_CHECKPOINT_RESOLVE: 'agent:checkpoint-resolve',
  MEMORY_GET_PROFILE: 'memory:get-profile',
  MEMORY_GET_DOMAIN: 'memory:get-domain',
  MEMORY_SET_PROFILE: 'memory:set-profile',
  WORKFLOW_START_RECORDING: 'workflow:start-recording',
  WORKFLOW_STOP_RECORDING: 'workflow:stop-recording',
  WORKFLOW_REPLAY: 'workflow:replay',
  WORKFLOW_LIST: 'workflow:list',
  EXTRACT_PAGE_DATA: 'extract:page-data',
  UI_TOGGLE_COMMAND_BAR: 'ui:toggle-command-bar',
  UI_DISMISS_OVERLAYS: 'ui:dismiss-overlays',
  UI_SET_OVERLAY_VISIBLE: 'ui:set-overlay-visible',
};

contextBridge.exposeInMainWorld('electronAPI', {
  getSemanticModel: () => ipcRenderer.invoke(CHANNELS.PAGE_GET_SEMANTIC_MODEL),
  onPageUpdate: (callback: (model: any) => void) => {
    const handler = (_: unknown, model: any) => callback(model);
    ipcRenderer.on(CHANNELS.PAGE_SUBSCRIBE_UPDATES, handler);
    return () => ipcRenderer.removeListener(CHANNELS.PAGE_SUBSCRIBE_UPDATES, handler);
  },
  runTask: (payload: { intent: string }) => ipcRenderer.invoke(CHANNELS.AGENT_RUN_TASK, payload),
  onTaskProgress: (callback: (update: any) => void) => {
    const handler = (_: unknown, update: any) => callback(update);
    ipcRenderer.on(CHANNELS.AGENT_TASK_PROGRESS, handler);
    return () => ipcRenderer.removeListener(CHANNELS.AGENT_TASK_PROGRESS, handler);
  },
  onCheckpointRequest: (callback: (data: any) => void) => {
    const handler = (_: unknown, data: any) => callback(data);
    ipcRenderer.on(CHANNELS.AGENT_CHECKPOINT_REQUEST, handler);
    return () => ipcRenderer.removeListener(CHANNELS.AGENT_CHECKPOINT_REQUEST, handler);
  },
  resolveCheckpoint: (payload: { id: string; approved: boolean }) =>
    ipcRenderer.invoke(CHANNELS.AGENT_CHECKPOINT_RESOLVE, payload),
  getUserProfile: () => ipcRenderer.invoke(CHANNELS.MEMORY_GET_PROFILE),
  getDomainMemory: (payload: { domain: string }) => ipcRenderer.invoke(CHANNELS.MEMORY_GET_DOMAIN, payload),
  setUserProfile: (payload: any) => ipcRenderer.invoke(CHANNELS.MEMORY_SET_PROFILE, payload),
  listWorkflows: () => ipcRenderer.invoke(CHANNELS.WORKFLOW_LIST),
  startRecording: () => ipcRenderer.invoke(CHANNELS.WORKFLOW_START_RECORDING),
  stopRecording: (payload: { name: string }) => ipcRenderer.invoke(CHANNELS.WORKFLOW_STOP_RECORDING, payload),
  replayWorkflow: (payload: { id: string }) => ipcRenderer.invoke(CHANNELS.WORKFLOW_REPLAY, payload),
  extractPageData: (payload: { format: 'json' | 'csv' }) => ipcRenderer.invoke(CHANNELS.EXTRACT_PAGE_DATA, payload),
  onToggleCommandBar: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on(CHANNELS.UI_TOGGLE_COMMAND_BAR, handler);
    return () => ipcRenderer.removeListener(CHANNELS.UI_TOGGLE_COMMAND_BAR, handler);
  },
  onDismissOverlays: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on(CHANNELS.UI_DISMISS_OVERLAYS, handler);
    return () => ipcRenderer.removeListener(CHANNELS.UI_DISMISS_OVERLAYS, handler);
  },
  setOverlayVisible: (visible: boolean) => ipcRenderer.invoke(CHANNELS.UI_SET_OVERLAY_VISIBLE, { visible }),
  navigatePage: (url: string) => ipcRenderer.invoke(CHANNELS.PAGE_NAVIGATE, { url }),
});
