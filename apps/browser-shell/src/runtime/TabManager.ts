import { BrowserTab } from './BrowserTab';
import { BrowserRuntime } from './BrowserRuntime';
import { BrowserWindow } from 'electron';

export class TabManager {
  public tabs: BrowserTab[] = [];
  public activeTabId: string | null = null;
  private runtime: BrowserRuntime;
  private mainWindow: BrowserWindow;
  private latestBounds: { x: number, y: number, width: number, height: number } | null = null;

  constructor(runtime: BrowserRuntime, mainWindow: BrowserWindow) {
    this.runtime = runtime;
    this.mainWindow = mainWindow;
  }

  public createTab(url?: string): string {
    const tab = new BrowserTab(this.runtime, url);
    this.tabs.push(tab);
    this.mainWindow.contentView.addChildView(tab.view);
    
    if (this.latestBounds) {
      tab.setBounds(this.latestBounds);
    }
    
    this.activateTab(tab.id);
    return tab.id;
  }

  public closeTab(id: string) {
    const index = this.tabs.findIndex(t => t.id === id);
    if (index === -1) return;

    const tab = this.tabs[index];
    this.mainWindow.contentView.removeChildView(tab.view);
    tab.destroy();
    this.tabs.splice(index, 1);

    if (this.activeTabId === id) {
      if (this.tabs.length > 0) {
        // Activate the previous tab, or the next one
        const nextIndex = Math.max(0, index - 1);
        this.activateTab(this.tabs[nextIndex].id);
      } else {
        this.activeTabId = null;
        this.runtime.eventBus.emit('state-changed');
      }
    } else {
      this.runtime.eventBus.emit('state-changed');
    }
  }

  public activateTab(id: string) {
    if (this.activeTabId === id) return;
    
    this.activeTabId = id;
    // Hide all tabs except the active one (by moving them out of bounds or zero sizing them)
    // Actually, in Electron, we can just manage z-index or visibility.
    // For WebContentsView, removing and adding to contentView is best, or setting bounds to 0.
    
    this.tabs.forEach(tab => {
      if (tab.id === id) {
        if (this.latestBounds) {
          tab.setBounds(this.latestBounds);
        }
      } else {
        // Move offscreen or resize to 0
        tab.setBounds({ x: -9999, y: -9999, width: 0, height: 0 });
      }
    });

    this.runtime.eventBus.emit('state-changed');
  }

  public getActiveTab(): BrowserTab | null {
    return this.tabs.find(t => t.id === this.activeTabId) || null;
  }

  public setBounds(bounds: { x: number, y: number, width: number, height: number }) {
    this.latestBounds = bounds;
    const activeTab = this.getActiveTab();
    if (activeTab) {
      activeTab.setBounds(bounds);
    }
  }

  public recalculateBounds() {
    if (this.mainWindow.isDestroyed()) return;
    
    const [width, height] = this.mainWindow.getSize();
    const windowManager = this.runtime.windowManager;
    const currentWorkspaceWidth = windowManager.workspaceWidth;
    
    // Top Chrome height: 42px (TabStrip) + 44px (Toolbar) = 86px.
    const chromeHeight = 86;
    const splitterWidth = currentWorkspaceWidth > 0 ? 4 : 0;
    
    const bounds = {
      x: 0,
      y: chromeHeight,
      width: Math.max(0, width - currentWorkspaceWidth - splitterWidth),
      height: Math.max(0, height - chromeHeight)
    };
    
    this.setBounds(bounds);
  }
}
