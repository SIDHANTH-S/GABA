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

/**
 * Register all shortcuts
 */
export function registerGlobalShortcuts(win: BrowserWindow): void {
  // Global shortcut: works even when BrowserView has focus
  const registered = globalShortcut.register('CommandOrControl+K', () => {
    sendToggle(win, 'globalShortcut');
  });
  
  if (!registered) {
    console.warn('[Shortcuts] Failed to register global Cmd+K');
  }
  
  // Window-level input event: catches keystrokes within the main window
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if ((input.control || input.meta) && input.key.toLowerCase() === 'k') {
        sendToggle(win, 'before-input-event');
        event.preventDefault();
      }
      if (input.key === 'Escape') {
        win.webContents.send(CHANNELS.UI_DISMISS_OVERLAYS);
      }
    }
  });
  
  console.log('[Shortcuts] Global shortcuts registered');
}

/**
 * Unregister all shortcuts
 */
export function unregisterAll(): void {
  globalShortcut.unregisterAll();
}
