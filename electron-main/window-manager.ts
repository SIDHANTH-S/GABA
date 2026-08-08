/**
 * electron-main/window-manager.ts
 * Creates and manages browser windows and web content views
 * Dependencies: electron, path
 */

import { BrowserWindow, BrowserView } from 'electron';
import { join } from 'path';

let mainWindow: BrowserWindow | null = null;
let webContentView: BrowserView | null = null;

/**
 * Create main browser window
 */
export async function createMainWindow(): Promise<BrowserWindow> {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'AI-Native Execution Browser',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, 'preload.js'),
    },
  });

  // Load React UI in main window
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5173');
  } else {
    await mainWindow.loadFile(join(__dirname, '..', 'renderer', 'index.html'));
  }

  // Create web content view for browsing pages
  createContentView();

  // Handle window resize
  mainWindow.on('resize', () => {
    positionContentView();
  });

  return mainWindow;
}

/**
 * Create web content view for target web pages
 */
function createContentView(): void {
  if (!mainWindow) return;

  webContentView = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.addBrowserView(webContentView);
  webContentView.webContents.loadURL('https://example.com');

  positionContentView();
}

/**
 * Position content view on left, leaving 340px for sidebar on right
 */
function positionContentView(): void {
  if (!webContentView || !mainWindow) return;

  const bounds = mainWindow.getContentBounds();
  const sidebarWidth = 340;
  const headerHeight = 48;

  webContentView.setBounds({
    x: 0,
    y: headerHeight,
    width: Math.max(bounds.width - sidebarWidth, 400),
    height: Math.max(bounds.height - headerHeight, 200),
  });
}

/**
 * Get web content view (for CDP attachment and page navigation)
 */
export function getWebContentView(): BrowserView | null {
  return webContentView;
}

/**
 * Get main window
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

/**
 * Show/hide web content view (e.g. when overlays/modals are active)
 */
export function setContentViewVisible(visible: boolean): void {
  if (!webContentView || !mainWindow) return;

  const currentViews = mainWindow.getBrowserViews();
  if (visible) {
    if (!currentViews.includes(webContentView)) {
      mainWindow.addBrowserView(webContentView);
    }
    positionContentView();
  } else {
    if (currentViews.includes(webContentView)) {
      mainWindow.removeBrowserView(webContentView);
    }
  }
}
