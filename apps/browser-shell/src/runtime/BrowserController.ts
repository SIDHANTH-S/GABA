import { ipcMain } from 'electron';
import { BrowserRuntime } from './BrowserRuntime';

export class BrowserController {
  private runtime: BrowserRuntime;

  constructor(runtime: BrowserRuntime) {
    this.runtime = runtime;
    this.setupIpc();
  }

  private setupIpc() {
    ipcMain.on('browser:navigate', (event, url: string) => {
      const activeTab = this.runtime.tabManager.getActiveTab();
      if (activeTab) {
        activeTab.view.webContents.loadURL(url);
      }
    });

    ipcMain.on('browser:setBounds', (event, bounds) => {
      // Ignored: Bounds are now calculated natively by WindowManager
    });

    ipcMain.on('browser:setWorkspaceWidth', (event, width: number, save: boolean = false) => {
      this.runtime.windowManager.setWorkspaceWidth(width, save);
    });

    ipcMain.on('browser:toggleWorkspace', () => {
      this.runtime.windowManager.toggleWorkspace();
    });

    ipcMain.on('browser:openTab', (event, url?: string) => {
      this.runtime.tabManager.createTab(url || 'gaba://newtab');
    });

    ipcMain.on('browser:closeTab', (event, id: string) => {
      this.runtime.tabManager.closeTab(id);
    });

    ipcMain.on('browser:activateTab', (event, id: string) => {
      this.runtime.tabManager.activateTab(id);
    });

    ipcMain.on('browser:reload', () => {
      const activeTab = this.runtime.tabManager.getActiveTab();
      if (activeTab) activeTab.view.webContents.reload();
    });

    ipcMain.on('browser:goBack', () => {
      const activeTab = this.runtime.tabManager.getActiveTab();
      if (activeTab && activeTab.view.webContents.canGoBack()) {
        activeTab.view.webContents.goBack();
      }
    });

    ipcMain.on('browser:goForward', () => {
      const activeTab = this.runtime.tabManager.getActiveTab();
      if (activeTab && activeTab.view.webContents.canGoForward()) {
        activeTab.view.webContents.goForward();
      }
    });

    ipcMain.on('browser:getState', (event) => {
      // Send the current state immediately
      event.reply('browser:state-update', this.runtime.getState());
    });
  }
}
