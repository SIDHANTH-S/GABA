import { BrowserRuntime } from './BrowserRuntime';

export class NavigationManager {
  private runtime: BrowserRuntime;

  constructor(runtime: BrowserRuntime) {
    this.runtime = runtime;
  }

  public navigate(url: string) {
    let finalUrl = url;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('devtools://')) {
      // Very basic omnibox behavior
      if (finalUrl.includes(' ') || !finalUrl.includes('.')) {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
      } else {
        finalUrl = 'https://' + finalUrl;
      }
    }

    const activeTab = this.runtime.tabManager.getActiveTab();
    if (activeTab) {
      activeTab.view.webContents.loadURL(finalUrl);
    }
  }

  public goBack() {
    const activeTab = this.runtime.tabManager.getActiveTab();
    if (activeTab && activeTab.view.webContents.canGoBack()) {
      activeTab.view.webContents.goBack();
    }
  }

  public goForward() {
    const activeTab = this.runtime.tabManager.getActiveTab();
    if (activeTab && activeTab.view.webContents.canGoForward()) {
      activeTab.view.webContents.goForward();
    }
  }

  public reload() {
    const activeTab = this.runtime.tabManager.getActiveTab();
    if (activeTab) {
      activeTab.view.webContents.reload();
    }
  }
}
