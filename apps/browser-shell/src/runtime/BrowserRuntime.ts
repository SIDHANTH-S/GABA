import { BrowserWindow, WebContentsView, app } from 'electron';
import * as path from 'path';
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
import { attachViewShortcuts } from '../agent-core/global-shortcuts';

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
  
  public chromeView?: WebContentsView;
  public workspaceView?: WebContentsView;
  public overlayView?: WebContentsView;

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

  public initializeUIViews() {
    const webPreferences = {
      preload: path.join(__dirname, '../preload.js'), // main is at dist/main.js
      contextIsolation: true, 
      nodeIntegration: false,
    };

    this.chromeView = new WebContentsView({ webPreferences });
    this.workspaceView = new WebContentsView({ webPreferences });
    this.overlayView = new WebContentsView({ webPreferences: { ...webPreferences, transparent: true } });

    this.chromeView.setBackgroundColor('#00000000');
    this.workspaceView.setBackgroundColor('#00000000');
    this.overlayView.setBackgroundColor('#00000000');

    this.mainWindow.contentView.addChildView(this.chromeView);
    this.mainWindow.contentView.addChildView(this.workspaceView);
    this.mainWindow.contentView.addChildView(this.overlayView);

    const isDev = !app.isPackaged;
    // We run node from project root (for apps/browser-shell) or we use the dev server
    const baseUrl = isDev ? 'http://localhost:8443' : `file://${path.join(__dirname, '../../../frontend/dist/index.html')}`;

    this.chromeView.webContents.loadURL(`${baseUrl}?view=chrome`);
    this.workspaceView.webContents.loadURL(`${baseUrl}?view=workspace`);
    this.overlayView.webContents.loadURL(`${baseUrl}?view=overlay`);

    attachViewShortcuts(this.chromeView.webContents, this);
    attachViewShortcuts(this.workspaceView.webContents, this);
    attachViewShortcuts(this.overlayView.webContents, this);

    this.windowManager.recalculateBounds();
  }

  public broadcastIPC(channel: string, ...args: any[]) {
    const views = [this.chromeView, this.workspaceView, this.overlayView];
    views.forEach(v => {
      if (v && !v.webContents.isDestroyed()) {
        v.webContents.send(channel, ...args);
      }
    });
    if (!this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args);
    }
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
    const state = this.getState();
    this.broadcastIPC('browser:state-update', state);
  }

  public getWebContentView() {
    const activeTab = this.tabManager.getActiveTab();
    return activeTab?.view || null;
  }

  public getWindowBounds() {
    if (this.mainWindow.isDestroyed()) return null;
    return this.mainWindow.getContentBounds();
  }
}
