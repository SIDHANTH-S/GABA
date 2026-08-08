/**
 * electron-main/global-shortcuts.ts
 * Register keyboard shortcuts scoped to the app window
 * Dependencies: electron, shared/constants
 */

import { globalShortcut, BrowserWindow } from 'electron';
import { CHANNELS } from '../shared/constants';

let lastToggleTime = 0;

/**
 * Send toggle with debounce to prevent double-firing from multiple sources
 */
function sendToggle(win: BrowserWindow, source: string): void {
  const now = Date.now();
  if (now - lastToggleTime < 300) return; // Debounce 300ms
  lastToggleTime = now;
  console.log(`[Shortcuts] Ctrl+K triggered via ${source}`);
  win.webContents.send(CHANNELS.UI_TOGGLE_COMMAND_BAR);
}

import type { BrowserRuntime } from '../runtime/BrowserRuntime';
import type { WebContents } from 'electron';

export function attachViewShortcuts(wc: WebContents, runtime: BrowserRuntime): void {
  wc.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      // Ctrl+K
      if ((input.control || input.meta) && input.key.toLowerCase() === 'k') {
        runtime.broadcastIPC(CHANNELS.UI_TOGGLE_COMMAND_BAR);
        event.preventDefault();
      }
      // Escape
      if (input.key === 'Escape') {
        runtime.broadcastIPC(CHANNELS.UI_DISMISS_OVERLAYS);
      }
      // Ctrl+Shift+I (DevTools)
      if ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i') {
        const activeTab = runtime.tabManager.getActiveTab();
        if (activeTab && activeTab.view && !activeTab.view.webContents.isDestroyed()) {
          const tabWc = activeTab.view.webContents;
          if (tabWc.isDevToolsOpened()) {
            tabWc.closeDevTools();
          } else {
            tabWc.openDevTools({ mode: 'right' });
          }
        }
        event.preventDefault();
      }
    }
  });
}

/**
 * Register all shortcuts
 */
export function registerGlobalShortcuts(win: BrowserWindow): void {
  // Global shortcut (OS level) for global activation if needed.
  // We'll leave CommandOrControl+K since it might be a launcher feature,
  // but for DevTools we strictly use local shortcuts.
  globalShortcut.register('CommandOrControl+K', () => {
    sendToggle(win, 'globalShortcut');
  });
  
  // Note: We used to attach 'before-input-event' to win.webContents here,
  // but now we attach it to each individual WebContentsView via attachViewShortcuts.
}

/**
 * Unregister all shortcuts
 */
export function unregisterAll(): void {
  globalShortcut.unregisterAll();
}
