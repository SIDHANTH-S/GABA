import { BrowserRuntime } from './BrowserRuntime';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
}

export class HistoryManager {
  private runtime: BrowserRuntime;
  private entries: HistoryEntry[] = [];
  private historyPath: string;

  constructor(runtime: BrowserRuntime) {
    this.runtime = runtime;
    this.historyPath = path.join(app.getPath('userData'), 'history.json');
    this.loadHistory();

    this.runtime.eventBus.on('navigation-completed', (tab, url) => {
      this.addEntry(url, tab.state.title);
    });
  }

  private addEntry(url: string, title: string) {
    if (url === 'about:blank' || url.startsWith('devtools://')) return;
    
    this.entries.unshift({ url, title, timestamp: Date.now() });
    
    // Keep max 1000 for MVP
    if (this.entries.length > 1000) {
      this.entries = this.entries.slice(0, 1000);
    }
    
    this.saveHistory();
  }

  private loadHistory() {
    try {
      if (fs.existsSync(this.historyPath)) {
        const data = fs.readFileSync(this.historyPath, 'utf8');
        this.entries = JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }

  private saveHistory() {
    try {
      fs.writeFileSync(this.historyPath, JSON.stringify(this.entries));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }
}
