/**
 * electron-main/ipc-handlers.ts
 * All IPC channel registrations
 * Dependencies: electron, agent-core, semantic-parser
 */

import { BrowserWindow, app, ipcMain } from 'electron';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { CHANNELS } from '../shared/constants';
import { buildSemanticModel } from '../semantic-parser/semantic-model-builder';
import { runPipeline } from '../agent-core/pipeline';
import { getUserProfile, setUserProfile, getDomainMemory } from '../agent-core/memory-manager';
import { listWorkflows, saveWorkflow, getWorkflow } from '../agent-core/memory-manager';
import { extractToJSON, extractToCSV } from '../agent-core/extractor';
import { startRecording, stopRecording, isCurrentlyRecording } from '../agent-core/workflow-recorder';
import { replayWorkflow } from '../agent-core/workflow-replayer';
import { resolveCheckpoint } from '../agent-core/verifier';
import type { CDPSession } from '../shared/types';

let currentSession: CDPSession | null = null;

/**
 * Register all IPC handlers
 */
export function registerIPCHandlers(win: BrowserWindow, session: CDPSession): void {
  currentSession = session;
  
  // Page understanding
  ipcMain.handle(CHANNELS.PAGE_GET_SEMANTIC_MODEL, async () => {
    if (!currentSession) return null;
    
    try {
      const url = await currentSession.send('Page.getNavigationHistory') as any;
      const currentURL = url?.currentEntry?.url || '';
      return await buildSemanticModel(currentSession, currentURL);
    } catch (err) {
      console.error('[IPC] Failed to get semantic model:', err);
      return null;
    }
  });

  ipcMain.handle(CHANNELS.PAGE_NAVIGATE, async (_, payload: { url: string }) => {
    const { getWebContentView } = require('./window-manager');
    const contentView = getWebContentView();
    if (contentView) {
      let targetUrl = payload.url.trim();
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      await contentView.webContents.loadURL(targetUrl);
    }
  });
  
  // Agent task execution
  ipcMain.handle(CHANNELS.AGENT_RUN_TASK, async (_, payload: { intent: string }) => {
    if (!currentSession) throw new Error('No CDP session');
    
    return await runPipeline(payload.intent, win, currentSession);
  });
  
  // Checkpoint resolution
  ipcMain.handle(CHANNELS.AGENT_CHECKPOINT_RESOLVE, async (_, payload: { id: string; approved: boolean }) => {
    resolveCheckpoint(payload.id, payload.approved);
  });
  
  // Memory operations
  ipcMain.handle(CHANNELS.MEMORY_GET_PROFILE, async () => {
    return getUserProfile();
  });
  
  ipcMain.handle(CHANNELS.MEMORY_GET_DOMAIN, async (_, payload: { domain: string }) => {
    return getDomainMemory(payload.domain);
  });
  
  ipcMain.handle(CHANNELS.MEMORY_SET_PROFILE, async (_, payload: any) => {
    setUserProfile(payload);
  });
  
  // Workflow operations
  ipcMain.handle(CHANNELS.WORKFLOW_LIST, async () => {
    return listWorkflows();
  });
  
  ipcMain.handle(CHANNELS.WORKFLOW_START_RECORDING, async () => {
    if (!currentSession) throw new Error('No CDP session');
    startRecording(currentSession);
  });
  
  ipcMain.handle(CHANNELS.WORKFLOW_STOP_RECORDING, async (_, payload: { name: string }) => {
    const recording = stopRecording(payload.name);
    saveWorkflow(recording);
    return recording;
  });
  
  ipcMain.handle(CHANNELS.WORKFLOW_REPLAY, async (_, payload: { id: string }) => {
    const workflow = getWorkflow(payload.id);
    if (!workflow) throw new Error('Workflow not found');
    
    const plan = replayWorkflow(workflow);
    
    if (!currentSession) throw new Error('No CDP session');
    
    // Execute via pipeline
    return await runPipeline(plan.rawCommand, win, currentSession);
  });
  
  // Data extraction
  ipcMain.handle(CHANNELS.EXTRACT_PAGE_DATA, async (_, payload: { format: 'json' | 'csv' }) => {
    if (!currentSession) throw new Error('No CDP session');
    
    const url = await currentSession.send('Page.getNavigationHistory') as any;
    const currentURL = url?.currentEntry?.url || '';
    const model = await buildSemanticModel(currentSession, currentURL);
    
    const content = payload.format === 'json' ? extractToJSON(model) : extractToCSV(model);
    const safeTitle = (model.title || model.pageIntent || 'page-data')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'page-data';
    const filePath = join(app.getPath('downloads'), `${safeTitle}-${Date.now()}.${payload.format}`);
    writeFileSync(filePath, content, 'utf8');
    return { content, path: filePath, format: payload.format };
  });
  
  // Tab operations (stub for MVP)
  ipcMain.handle(CHANNELS.TABS_GET_GROUPS, async () => {
    return [];
  });
  
  ipcMain.handle(CHANNELS.TABS_GROUP_BY_INTENT, async () => {
    return [];
  });
  
  // Overlay visibility control
  ipcMain.handle(CHANNELS.UI_SET_OVERLAY_VISIBLE, async (_, payload: { visible: boolean }) => {
    const { setContentViewVisible } = require('./window-manager');
    setContentViewVisible(!payload.visible);
  });
  
  console.log('[IPC] All handlers registered');
}
