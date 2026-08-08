import { app, BrowserWindow, protocol } from 'electron';
import * as path from 'path';
import { config } from 'dotenv';
import { BrowserRuntime } from './runtime/BrowserRuntime';
import { initDB, closeDB } from './db/db';
import { attachCDP } from './agent-core/cdp-bridge';
import { registerIPCHandlers } from './agent-core/ipc-handlers';
import { registerGlobalShortcuts, unregisterAll } from './agent-core/global-shortcuts';
import { buildSemanticModel } from './semantic-parser/semantic-model-builder';
import { CHANNELS } from './shared/constants';

// Load environment variables
config();

let mainWindow: BrowserWindow;
let browserRuntime: BrowserRuntime;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: 'rgba(0,0,0,0)', // Completely transparent so the HTML header shows through perfectly
      symbolColor: '#2e2e2e',
      height: 42 // Match the height of the TabStrip (42px)
    },
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Security: contextIsolation should be true in production, 
      // but we need it true for ContextBridge anyway.
      contextIsolation: true, 
      nodeIntegration: false,
    },
    // transparent: true,
  });

  // We no longer load the React app into the mainWindow directly.
  // Instead, the BrowserRuntime manages the UI WebContentsViews.

  // Initialize the Browser Runtime
  browserRuntime = new BrowserRuntime(mainWindow);
  browserRuntime.initializeUIViews();
}

app.whenReady().then(async () => {
  try {
    console.log('[App] Initializing...');

    // Register internal protocol for New Tab
    protocol.registerStringProtocol('gaba', (request, callback) => {
      callback({ mimeType: 'text/html', data: '<html><body></body></html>' });
    });

    // Initialize database
    await initDB();

    // Create main window & web content view
    createWindow();
    
    // Initialize browser runtime to get web content view
    if (browserRuntime) {
      const contentView = browserRuntime.tabManager.getActiveTab()?.view;

      if (!contentView) {
        console.log('[App] Web content view not available yet, skipping CDP setup');
        return;
      }

      // Attach CDP session to web content view
      const session = await attachCDP(contentView as any);

      // Register IPC handlers & global shortcuts on main window
      registerIPCHandlers(browserRuntime, session);
      registerGlobalShortcuts(mainWindow);

      // Function to parse page and send model to React UI
      const updateSemanticModel = async () => {
        try {
          const url = contentView.webContents.getURL();
          if (!url || url === 'about:blank') return;

          console.log('[App] Extracting semantic model for:', url);
          const model = await buildSemanticModel(session, url);
          browserRuntime.broadcastIPC(CHANNELS.PAGE_SUBSCRIBE_UPDATES, model);
        } catch (err) {
          console.error('[App] Failed to extract semantic model:', err);
        }
      };

      // Attach load/navigate listeners on web content view
      contentView.webContents.on('did-finish-load', updateSemanticModel);
      contentView.webContents.on('did-navigate', updateSemanticModel);

      // Initial parse after 1 second delay to ensure DOM is ready
      setTimeout(updateSemanticModel, 1000);
    }

    console.log('[App] Initialization complete');

  } catch (err) {
    console.error('[App] Initialization failed:', err);
    app.quit();
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  unregisterAll();
  closeDB();
});

