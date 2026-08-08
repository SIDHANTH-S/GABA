import { EventEmitter } from 'events';
import { BrowserTab } from './BrowserTab';

export type BrowserEvents = {
  'tab-created': (tab: BrowserTab) => void;
  'tab-updated': (tab: BrowserTab) => void;
  'tab-closed': (id: string) => void;
  'tab-activated': (id: string) => void;
  'navigation-started': (tab: BrowserTab, url: string) => void;
  'navigation-completed': (tab: BrowserTab, url: string) => void;
  'navigation-failed': (tab: BrowserTab, url: string, error: string) => void;
  'window-bounds-changed': () => void;
  'state-changed': () => void; // A unified event to trigger state broadcast
};

export class EventBus {
  private emitter = new EventEmitter();

  public emit<K extends keyof BrowserEvents>(event: K, ...args: Parameters<BrowserEvents[K]>) {
    this.emitter.emit(event, ...args);
  }

  public on<K extends keyof BrowserEvents>(event: K, listener: BrowserEvents[K]) {
    this.emitter.on(event, listener as any);
  }

  public off<K extends keyof BrowserEvents>(event: K, listener: BrowserEvents[K]) {
    this.emitter.off(event, listener as any);
  }
}
