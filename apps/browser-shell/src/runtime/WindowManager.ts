import { BrowserRuntime } from './BrowserRuntime';
import { globalShortcut, Menu } from 'electron';

export class WindowManager {
  private runtime: BrowserRuntime;
  public workspaceWidth: number = 380; // The current width used for bounds
  public savedWorkspaceWidth: number = 380; // The width to restore to when opening
  public workspaceVisible: boolean = true;

  constructor(runtime: BrowserRuntime) {
    this.runtime = runtime;
    this.setupShortcuts();
  }

  private setupShortcuts() {
    // Basic browser shortcuts
    globalShortcut.register('CommandOrControl+T', () => {
      this.runtime.tabManager.createTab();
    });

    globalShortcut.register('CommandOrControl+W', () => {
      const activeTabId = this.runtime.tabManager.activeTabId;
      if (activeTabId) {
        this.runtime.tabManager.closeTab(activeTabId);
      }
    });

    globalShortcut.register('CommandOrControl+R', () => {
      const activeTab = this.runtime.tabManager.getActiveTab();
      if (activeTab) {
        activeTab.view.webContents.reload();
      }
    });
  }

  public setWorkspaceWidth(width: number, save: boolean = false) {
    this.workspaceWidth = width;
    
    if (save && width > 0) {
      this.savedWorkspaceWidth = width;
    }
    
    this.runtime.tabManager.recalculateBounds();
    this.runtime.eventBus.emit('state-changed');
  }

  public toggleWorkspace() {
    console.log('[WindowManager] toggleWorkspace called. Current visible:', this.workspaceVisible);
    this.workspaceVisible = !this.workspaceVisible;
    console.log('[WindowManager] new visible:', this.workspaceVisible, 'savedWidth:', this.savedWorkspaceWidth);
    this.runtime.eventBus.emit('state-changed');
  }

  public destroy() {
    globalShortcut.unregisterAll();
  }
}
