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

