/**
 * electron-main/tab-manager.ts
 * Tracks and groups browser tabs
 * Dependencies: shared/types
 */

import type { TabGroup, PageIntent } from '../shared/types';
import { generateId } from '../shared/utils';
import { classifyTabIntent } from '../semantic-parser/tab-intent-classifier';

interface TabState {
  id: number;
  url: string;
  title: string;
  intent: PageIntent;
  groupId?: string;
}

const tabs = new Map<number, TabState>();

/**
 * Register new tab
 */
export function registerTab(webContentsId: number, url: string, title: string): void {
  const intent = classifyTabIntent(url, title);
  
  tabs.set(webContentsId, {
    id: webContentsId,
    url,
    title,
    intent,
  });
}

/**
 * Get all tab states
 */
export function getTabStates(): TabState[] {
  return Array.from(tabs.values());
}

/**
 * Assign tab to group
 */
export function assignTabToGroup(tabId: number, groupId: string): void {
  const tab = tabs.get(tabId);
  if (tab) {
    tab.groupId = groupId;
  }
}

/**
 * Auto-group tabs by intent
 */
export async function autoGroupByIntent(): Promise<TabGroup[]> {
  const groups: TabGroup[] = [];
  const intentMap = new Map<PageIntent, number[]>();
  
  // Cluster by intent
  for (const tab of tabs.values()) {
    const existing = intentMap.get(tab.intent) || [];
    existing.push(tab.id);
    intentMap.set(tab.intent, existing);
  }
  
  // Create groups
  const colors: Array<'blue' | 'green' | 'orange' | 'pink' | 'purple' | 'red' | 'yellow'> = 
    ['blue', 'green', 'orange', 'pink', 'purple', 'red', 'yellow'];
  
  let colorIndex = 0;
  
  for (const [intent, tabIds] of intentMap.entries()) {
    if (tabIds.length === 0) continue;
    
    const groupId = generateId('group');
    const group: TabGroup = {
      id: groupId,
      name: formatIntentName(intent),
      intent,
      color: colors[colorIndex % colors.length],
      tabIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    groups.push(group);
    
    // Assign tabs to group
    for (const tabId of tabIds) {
      assignTabToGroup(tabId, groupId);
    }
    
    colorIndex++;
  }
  
  return groups;
}

/**
 * Format intent name for display
 */
function formatIntentName(intent: PageIntent): string {
  const names: Record<PageIntent, string> = {
    checkout: 'Shopping',
    'form-fill': 'Forms',
    article: 'Reading',
    dashboard: 'Dashboards',
    search: 'Search Results',
    document: 'Documents',
    'product-listing': 'Shopping',
    login: 'Authentication',
    unknown: 'General',
  };
  
  return names[intent] || 'General';
}
