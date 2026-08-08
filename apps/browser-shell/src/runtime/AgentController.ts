/**
 * runtime/AgentController.ts
 * Connects AI Agent core, CDP Bridge, Database, and IPC Handlers to BrowserRuntime
 */

import { ipcMain, BrowserWindow } from 'electron';
import { BrowserRuntime } from './BrowserRuntime';
import { attachCDP } from '../agent-core/cdp-bridge';
import type { CDPSession } from '../shared/types';

export class AgentController {
  private runtime: BrowserRuntime;
  private mainWindow: BrowserWindow;
  private cdpSession: CDPSession | null = null;

  constructor(runtime: BrowserRuntime, mainWindow: BrowserWindow) {
    this.runtime = runtime;
    this.mainWindow = mainWindow;
  }

  private async getActiveCDPSession(): Promise<CDPSession | null> {
    const activeTab = this.runtime.tabManager.getActiveTab();
    if (!activeTab) return null;

    try {
      this.cdpSession = await attachCDP({ webContents: activeTab.view.webContents });
      return this.cdpSession;
    } catch (err) {
      console.error('[AgentController] Failed to attach CDP:', err);
      return null;
    }
  }
}
