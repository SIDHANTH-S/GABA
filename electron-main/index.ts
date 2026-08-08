/**
 * electron-main/index.ts
 * Electron app entry point
 * Dependencies: all electron-main modules
 */

import { app, BrowserWindow } from 'electron';
import { config } from 'dotenv';
import { initDB, closeDB } from './db';
import { createMainWindow, getWebContentView } from './window-manager';
import { attachCDP } from './cdp-bridge';
import { registerIPCHandlers } from './ipc-handlers';
import { registerGlobalShortcuts, unregisterAll } from './global-shortcuts';
import { buildSemanticModel } from '../semantic-parser/semantic-model-builder';
import { CHANNELS } from '../shared/constants';

// Load environment variables
config();

let mainWindow: BrowserWindow | null = null;

/**
 * App initialization
 */
app.whenReady().then(async () => {
  try {
    console.log('[App] Initializing...');

    // Initialize database
    await initDB();

    // Create main window & web content view
    mainWindow = await createMainWindow();
    const contentView = getWebContentView();

    if (!contentView) {
      throw new Error('Failed to create web content view');
    }

    // Attach CDP session to web content view
    const session = await attachCDP(contentView as any);

    // Register IPC handlers & global shortcuts on main window
    registerIPCHandlers(mainWindow, session);
    registerGlobalShortcuts(mainWindow);

    // Function to parse page and send model to React UI
    const updateSemanticModel = async () => {
      try {
        const url = contentView.webContents.getURL();
        if (!url || url === 'about:blank') return;

        console.log('[App] Extracting semantic model for:', url);
        const model = await buildSemanticModel(session, url);
        // @ts-ignore
        mainWindow?.webContents.send(CHANNELS.PAGE_SUBSCRIBE_UPDATES, model);
      } catch (err) {
        console.error('[App] Failed to extract semantic model:', err);
      }
    };

    // Attach load/navigate listeners on web content view
    contentView.webContents.on('did-finish-load', updateSemanticModel);
    contentView.webContents.on('did-navigate', updateSemanticModel);

    // Initial parse after 1 second delay to ensure DOM is ready
    setTimeout(updateSemanticModel, 1000);

    console.log('[App] Initialization complete');

  } catch (err) {
    console.error('[App] Initialization failed:', err);
    app.quit();
  }
});

/**
 * Handle window close
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Handle app quit
 */
app.on('will-quit', () => {
  unregisterAll();
  closeDB();
});

/**
 * macOS: recreate window when dock icon clicked
 */
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
