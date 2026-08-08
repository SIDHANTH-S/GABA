import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { BrowserRuntime } from './runtime/BrowserRuntime';
import { initDB } from './db/db';

let mainWindow: BrowserWindow;
let browserRuntime: BrowserRuntime;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff', // Match your toolbar/chrome background
      symbolColor: '#2e2e2e',
      height: 36 // Roughly the height of the TabStrip or Toolbar
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

  // Load the React Vite Dev Server (or built files)
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:8443');
  } else {
    // mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }

  // Initialize the Browser Runtime
  browserRuntime = new BrowserRuntime(mainWindow);
}

app.whenReady().then(async () => {
  await initDB();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

