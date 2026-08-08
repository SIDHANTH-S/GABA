import { BrowserRuntime } from './BrowserRuntime';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

interface SessionData {
  tabs: string[]; // URLs
  activeTabIndex: number;
  workspaceVisible?: boolean;
  savedWorkspaceWidth?: number;
}

export class SessionManager {
  private runtime: BrowserRuntime;
  private sessionPath: string;

  constructor(runtime: BrowserRuntime) {
    this.runtime = runtime;
    this.sessionPath = path.join(app.getPath('userData'), 'session.json');
    
    // Save session when tabs change
    this.runtime.eventBus.on('state-changed', () => this.saveSession());
  }

  public restoreSession() {
    try {
      if (fs.existsSync(this.sessionPath)) {
        const data = fs.readFileSync(this.sessionPath, 'utf8');
        const session: SessionData = JSON.parse(data);
        
        if (session.savedWorkspaceWidth) {
          const clampedWidth = Math.max(250, session.savedWorkspaceWidth);
          this.runtime.windowManager.savedWorkspaceWidth = clampedWidth;
          this.runtime.windowManager.workspaceWidth = session.workspaceVisible ? clampedWidth : 0;
        }
        if (session.workspaceVisible !== undefined) {
          this.runtime.windowManager.workspaceVisible = session.workspaceVisible;
        }
        
        if (session.tabs.length > 0) {
          session.tabs.forEach((url, i) => {
            const id = this.runtime.tabManager.createTab(url);
            if (i === session.activeTabIndex) {
              this.runtime.tabManager.activateTab(id);
            }
          });
          return;
        }
      }
    } catch (e) {
      console.error('Failed to restore session', e);
    }

    // Fallback if no session
    this.runtime.tabManager.createTab('https://google.com');
  }

  private saveSession() {
    const tabs = this.runtime.tabManager.tabs;
    if (tabs.length === 0) return;

    const data: SessionData = {
      tabs: tabs.map(t => t.state.url),
      activeTabIndex: tabs.findIndex(t => t.id === this.runtime.tabManager.activeTabId),
      workspaceVisible: this.runtime.windowManager.workspaceVisible,
      savedWorkspaceWidth: this.runtime.windowManager.savedWorkspaceWidth
    };

    try {
      fs.writeFileSync(this.sessionPath, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save session', e);
    }
  }
}
