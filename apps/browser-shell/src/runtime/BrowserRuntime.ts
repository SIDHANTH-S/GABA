import { BrowserWindow } from 'electron';
import { TabManager } from './TabManager';
import { BrowserTabState } from './BrowserTab';
import { BrowserController } from './BrowserController';
import { EventBus } from './EventBus';
import { WindowManager } from './WindowManager';
import { NavigationManager } from './NavigationManager';
import { HistoryManager } from './HistoryManager';
import { SessionManager } from './SessionManager';
import { DownloadManager, DownloadState } from './DownloadManager';
import { AgentController } from './AgentController';

export interface BrowserState {
  activeTabId: string | null;
  tabs: BrowserTabState[];
  downloads: DownloadState[];
  window: {
    isLoading: boolean;
    focused: boolean;
    workspaceWidth: number;
    savedWorkspaceWidth: number;
    workspaceVisible: boolean;
  };
  navigation: {
    canGoBack: boolean;
    canGoForward: boolean;
  };
}

export class BrowserRuntime {
  public eventBus: EventBus;
  public tabManager: TabManager;
  public controller: BrowserController;
  public windowManager: WindowManager;
  public navigationManager: NavigationManager;
  public historyManager: HistoryManager;
  public sessionManager: SessionManager;
  public downloadManager: DownloadManager;
  public agentController: AgentController;
  
  private mainWindow: BrowserWindow;
  private stateBroadcastTimeout: NodeJS.Timeout | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    
    this.eventBus = new EventBus();
    this.windowManager = new WindowManager(this);
    this.tabManager = new TabManager(this, mainWindow);
    this.navigationManager = new NavigationManager(this);
    this.historyManager = new HistoryManager(this);
    this.downloadManager = new DownloadManager(this);
    this.sessionManager = new SessionManager(this);
    
    this.controller = new BrowserController(this);
    this.agentController = new AgentController(this, mainWindow);

    // Initial setup
    this.sessionManager.restoreSession();

    // Subscribe to window focus events
    mainWindow.on('focus', () => this.eventBus.emit('state-changed'));
    mainWindow.on('blur', () => this.eventBus.emit('state-changed'));
    
    // Recalculate native browser bounds on window resize
    mainWindow.on('resize', () => this.tabManager.recalculateBounds());
    mainWindow.on('maximize', () => this.tabManager.recalculateBounds());
    mainWindow.on('unmaximize', () => this.tabManager.recalculateBounds());
    
    // Throttle state broadcasts
    this.eventBus.on('state-changed', () => {
      if (this.stateBroadcastTimeout) return;
      this.stateBroadcastTimeout = setTimeout(() => {
        this.broadcastState();
        this.stateBroadcastTimeout = null;
      }, 16); // ~60fps
    });
  }

  public getState(): BrowserState {
    const activeTab = this.tabManager.getActiveTab();
    
    return {
      activeTabId: this.tabManager.activeTabId,
      tabs: this.tabManager.tabs.map(t => t.state),
      downloads: Array.from(this.downloadManager.downloads.values()),
      window: {
        isLoading: this.tabManager.tabs.some(t => t.state.loading),
        focused: this.mainWindow.isFocused(),
        workspaceWidth: this.windowManager.workspaceWidth,
        savedWorkspaceWidth: this.windowManager.savedWorkspaceWidth,
        workspaceVisible: this.windowManager.workspaceVisible
      },
      navigation: {
        canGoBack: activeTab ? activeTab.view.webContents.canGoBack() : false,
        canGoForward: activeTab ? activeTab.view.webContents.canGoForward() : false,
      }
    };
  }

  public broadcastState() {
    // Send state to React via IPC
    const state = this.getState();
    if (!this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('browser:state-update', state);
    }
  }
}
