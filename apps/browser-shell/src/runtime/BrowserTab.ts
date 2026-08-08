import { WebContentsView, BrowserWindow, Menu } from 'electron';
import { randomUUID } from 'crypto';
import { BrowserRuntime } from './BrowserRuntime';
import { attachViewShortcuts } from '../agent-core/global-shortcuts';

export interface BrowserTabState {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  loading: boolean;
  security: {
    secure: boolean;
  };
}

export class BrowserTab {
  public id: string;
  public view: WebContentsView;
  private runtime: BrowserRuntime;
  private favicon?: string;

  constructor(runtime: BrowserRuntime, url: string = 'gaba://newtab') {
    this.id = randomUUID();
    this.runtime = runtime;
    this.view = new WebContentsView();
    
    attachViewShortcuts(this.view.webContents, this.runtime);

    this.setupListeners();
  }

  public get state(): BrowserTabState {
    const webContents = this.view.webContents;
    const url = webContents.getURL();
    return {
      id: this.id,
      url: url,
      title: webContents.getTitle(),
      favicon: this.favicon,
      loading: webContents.isLoading(),
      security: {
        secure: url.startsWith('https://'),
      }
    };
  }

  private setupListeners() {
    const wc = this.view.webContents;
    
    wc.on('did-start-loading', () => this.runtime.eventBus.emit('state-changed'));
    wc.on('did-stop-loading', () => this.runtime.eventBus.emit('state-changed'));
    wc.on('page-title-updated', () => this.runtime.eventBus.emit('state-changed'));
    wc.on('did-navigate', (event, url) => {
      this.runtime.eventBus.emit('navigation-completed', this, url);
      this.runtime.eventBus.emit('state-changed');
    });
    wc.on('did-navigate-in-page', () => this.runtime.eventBus.emit('state-changed'));
    
    wc.on('page-favicon-updated', (event, favicons) => {
      if (favicons && favicons.length > 0) {
        // Just cache the first favicon in state dynamically, or read from webContents if possible
        // Actually webContents doesn't have a getter for favicon, so we must store it locally
        this.favicon = favicons[0];
        this.runtime.eventBus.emit('state-changed');
      }
    });

    // Native Context Menu for Inspect Element
    wc.on('context-menu', (event, params) => {
      const menu = Menu.buildFromTemplate([
        {
          label: 'Inspect Element',
          click: () => {
            wc.inspectElement(params.x, params.y);
            if (!wc.isDevToolsOpened()) {
              wc.openDevTools({ mode: 'right' });
            }
          }
        }
      ]);
      menu.popup();
    });
  }

  public setBounds(bounds: { x: number, y: number, width: number, height: number }) {
    this.view.setBounds(bounds);
  }

  public destroy() {
    // Cleanup if needed
  }
}
