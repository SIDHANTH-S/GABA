import { BrowserRuntime } from './BrowserRuntime';
import { session } from 'electron';

export interface DownloadState {
  id: string;
  filename: string;
  url: string;
  receivedBytes: number;
  totalBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
}

export class DownloadManager {
  private runtime: BrowserRuntime;
  public downloads: Map<string, DownloadState> = new Map();

  constructor(runtime: BrowserRuntime) {
    this.runtime = runtime;
    this.setupListeners();
  }

  private setupListeners() {
    session.defaultSession.on('will-download', (event, item, webContents) => {
      const id = Date.now().toString(); // simple ID
      const downloadState: DownloadState = {
        id,
        filename: item.getFilename(),
        url: item.getURL(),
        receivedBytes: 0,
        totalBytes: item.getTotalBytes(),
        state: 'progressing'
      };
      
      this.downloads.set(id, downloadState);
      this.runtime.eventBus.emit('state-changed');

      item.on('updated', (event, state) => {
        downloadState.receivedBytes = item.getReceivedBytes();
        if (state === 'interrupted') downloadState.state = 'interrupted';
        this.runtime.eventBus.emit('state-changed');
      });

      item.once('done', (event, state) => {
        downloadState.state = state;
        this.runtime.eventBus.emit('state-changed');
      });
    });
  }
}
