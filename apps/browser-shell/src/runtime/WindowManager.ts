import { BrowserRuntime } from './BrowserRuntime';
import { globalShortcut, Menu } from 'electron';

export class WindowManager {
  private runtime: BrowserRuntime;
  public workspaceWidth: number = 380; // The current width used for bounds
  public savedWorkspaceWidth: number = 380; // The width to restore to when opening
  public workspaceVisible: boolean = true;
  public overlayVisible: boolean = false;

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
    
    this.recalculateBounds();
    this.runtime.eventBus.emit('state-changed');
  }

  public toggleWorkspace() {
    console.log('[WindowManager] toggleWorkspace called. Current visible:', this.workspaceVisible);
    this.workspaceVisible = !this.workspaceVisible;
    if (this.workspaceVisible) {
      this.workspaceWidth = this.savedWorkspaceWidth || 380;
    }
    console.log('[WindowManager] new visible:', this.workspaceVisible, 'savedWidth:', this.savedWorkspaceWidth);
    this.recalculateBounds();
    this.runtime.eventBus.emit('state-changed');
  }

  public recalculateBounds() {
    const bounds = this.runtime.getWindowBounds();
    if (!bounds) return;

    const { width, height } = bounds;
    
    // Top Chrome height: 42px (TabStrip) + 44px (Toolbar) = 86px.
    const chromeHeight = 86;
    
    // Calculate effective workspace width
    const currentWorkspaceWidth = this.workspaceVisible ? this.workspaceWidth : 0;
    const pageViewWidth = Math.max(0, width - currentWorkspaceWidth);
    const viewsHeight = Math.max(0, height - chromeHeight);

    // 1. BrowserChromeView
    if (this.runtime.chromeView && !this.runtime.chromeView.webContents.isDestroyed()) {
      this.runtime.chromeView.setBounds({
        x: 0,
        y: 0,
        width,
        height: chromeHeight
      });
    }

    // 2. AIWorkspaceView
    if (this.runtime.workspaceView && !this.runtime.workspaceView.webContents.isDestroyed()) {
      if (currentWorkspaceWidth > 0) {
        this.runtime.workspaceView.setBounds({
          x: width - currentWorkspaceWidth,
          y: chromeHeight,
          width: currentWorkspaceWidth,
          height: viewsHeight
        });
      } else {
        // Move offscreen when collapsed
        this.runtime.workspaceView.setBounds({
          x: -9999, y: -9999, width: 0, height: 0
        });
      }
    }

    // 3. PageView (The active tab)
    const activeTab = this.runtime.tabManager.getActiveTab();
    if (activeTab) {
      activeTab.view.setBounds({
        x: 0,
        y: chromeHeight,
        width: pageViewWidth,
        height: viewsHeight
      });
    }

    // 4. OverlayView
    if (this.runtime.overlayView && !this.runtime.overlayView.webContents.isDestroyed()) {
      if (this.overlayVisible) {
        this.runtime.overlayView.setBounds({
          x: 0,
          y: 0,
          width,
          height
        });
      } else {
        this.runtime.overlayView.setBounds({
          x: -9999, y: -9999, width: 0, height: 0
        });
      }
    }
  }

  public setOverlayVisible(visible: boolean) {
    this.overlayVisible = visible;
    this.recalculateBounds();
  }

  public destroy() {
    globalShortcut.unregisterAll();
  }
}
