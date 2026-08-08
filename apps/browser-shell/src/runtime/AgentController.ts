/**
 * runtime/AgentController.ts
 * Connects AI Agent core, CDP Bridge, Database, and IPC Handlers to BrowserRuntime
 */

import { ipcMain, BrowserWindow } from 'electron';
import { BrowserRuntime } from './BrowserRuntime';
import { attachCDP } from '../agent-core/cdp-bridge';
import { runPipeline } from '../agent-core/pipeline';
import { resolveCheckpoint } from '../agent-core/verifier';
import { buildSemanticModel } from '../semantic-parser/semantic-model-builder';
import { getUserProfile, setUserProfile, getDomainMemory, listWorkflows } from '../agent-core/memory-manager';
import { startRecording, stopRecording } from '../agent-core/workflow-recorder';
import { replayWorkflow } from '../agent-core/workflow-replayer';
import { CHANNELS } from '../shared/constants';
import type { CDPSession } from '../shared/types';

export class AgentController {
  private runtime: BrowserRuntime;
  private mainWindow: BrowserWindow;
  private cdpSession: CDPSession | null = null;

  constructor(runtime: BrowserRuntime, mainWindow: BrowserWindow) {
    this.runtime = runtime;
    this.mainWindow = mainWindow;
    this.setupAgentIpc();
  }

  private async getActiveCDPSession(): Promise<CDPSession | null> {
    const activeTab = this.runtime.tabManager.getActiveTab();
    if (!activeTab) return null;

    try {
      this.cdpSession = await attachCDP({ webContents: activeTab.view.webContents });
      return this.cdpSession;
    } catch (err) {
      console.error('[AgentController] Failed to attach CDP:', err);
      return null;
    }
  }

  private setupAgentIpc() {
    // 1. Run Task / Intent
    ipcMain.handle(CHANNELS.AGENT_RUN_TASK, async (_, { intent }: { intent: string }) => {
      const session = await this.getActiveCDPSession();
      if (!session) {
        throw new Error('No active browser tab session available for AI Agent');
      }

      console.log('[AgentController] Running agent intent:', intent);
      return await runPipeline(intent, this.mainWindow, session);
    });

    // Also support fallback `runTask` for electronAPI compatibility
    ipcMain.on('agent:run-intent', async (_, intent: string) => {
      const session = await this.getActiveCDPSession();
      if (session) {
        await runPipeline(intent, this.mainWindow, session);
      }
    });

    // 2. Checkpoint Resolve
    ipcMain.on(CHANNELS.AGENT_CHECKPOINT_RESOLVE, (_, { id, approved }: { id: string; approved: boolean }) => {
      console.log(`[AgentController] Checkpoint ${id} resolved: ${approved}`);
      resolveCheckpoint(id, approved);
    });

    // 3. Page Semantic Model
    ipcMain.handle(CHANNELS.PAGE_GET_SEMANTIC_MODEL, async () => {
      const activeTab = this.runtime.tabManager.getActiveTab();
      if (!activeTab) return null;

      const session = await this.getActiveCDPSession();
      if (!session) return null;

      const url = activeTab.view.webContents.getURL();
      return await buildSemanticModel(session, url);
    });

    // 4. Memory Handlers
    ipcMain.handle(CHANNELS.MEMORY_GET_PROFILE, () => {
      return getUserProfile();
    });

    ipcMain.handle(CHANNELS.MEMORY_SET_PROFILE, (_, profile) => {
      setUserProfile(profile);
      return true;
    });

    ipcMain.handle(CHANNELS.MEMORY_GET_DOMAIN, (_, domain: string) => {
      return getDomainMemory(domain);
    });

    // 5. Workflows
    ipcMain.handle(CHANNELS.WORKFLOW_LIST, () => {
      return listWorkflows();
    });

    ipcMain.handle(CHANNELS.WORKFLOW_START_RECORDING, async () => {
      const session = await this.getActiveCDPSession();
      if (session) startRecording(session);
      return true;
    });

    ipcMain.handle(CHANNELS.WORKFLOW_STOP_RECORDING, (_, { name }: { name: string }) => {
      return stopRecording(name || 'Recorded Workflow');
    });

    ipcMain.handle(CHANNELS.WORKFLOW_REPLAY, async (_, workflowId: string) => {
      const session = await this.getActiveCDPSession();
      if (!session) throw new Error('No active CDP session');
      const { getWorkflow } = await import('../agent-core/memory-manager');
      const recording = getWorkflow(workflowId);
      if (!recording) throw new Error(`Workflow not found: ${workflowId}`);
      return replayWorkflow(recording);
    });
  }
}
