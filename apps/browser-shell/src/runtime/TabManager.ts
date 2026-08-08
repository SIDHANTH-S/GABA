import { BrowserTab } from './BrowserTab';
import { BrowserRuntime } from './BrowserRuntime';
import { BrowserWindow } from 'electron';

export class TabManager {
  public tabs: BrowserTab[] = [];
  public activeTabId: string | null = null;
  private runtime: BrowserRuntime;
  public mainWindow: BrowserWindow;
  private latestBounds: { x: number, y: number, width: number, height: number } | null = null;

  constructor(runtime: BrowserRuntime, mainWindow: BrowserWindow) {
    this.runtime = runtime;
    this.mainWindow = mainWindow;
  }

  public createTab(url?: string): string {
    const tab = new BrowserTab(this.runtime, url);
    this.tabs.push(tab);
    this.mainWindow.contentView.addChildView(tab.view);
    
    // Now safe to load the URL
    tab.view.webContents.loadURL(url || 'https://google.com');
    
    // We let WindowManager calculate the initial bounds
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
      if (tab.id !== id) {
        // Move offscreen or resize to 0
        tab.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      }
    });

    this.recalculateBounds();
    this.runtime.eventBus.emit('state-changed');
  }

  public getActiveTab(): BrowserTab | null {
    return this.tabs.find(t => t.id === this.activeTabId) || null;
  }

  // We no longer need setBounds here since WindowManager sets it directly,
  // but we can leave a stub if needed. Actually we'll remove it.

  public recalculateBounds() {
    if (this.mainWindow.isDestroyed()) return;
    this.runtime.windowManager.recalculateBounds();
  }
}
